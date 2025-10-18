from fastapi import Depends, HTTPException
from supabase_auth.errors import AuthApiError
from supabase import create_client
from dotenv import load_dotenv
import os
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

load_dotenv()

security = HTTPBearer(auto_error=False)

print("Connecting to Supabase...")
sb = create_client(
    supabase_url=os.getenv("SUPABASE_URL"),
    supabase_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)
print("Connected to Supabase. (if this prints more than once, you're cooked)")

def authenticate_user(
        credentials: HTTPAuthorizationCredentials = Depends(security)
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        user = sb.auth.get_user(credentials.credentials)
        return user.user.id
    except AuthApiError:
        raise HTTPException(status_code=401, detail="Invalid token")

def add_user(
        user_id: str,
        context: dict,
        preferences: list[str],
        calendar_url: str
):
    """Adds a new user to the database with the given context."""
    sb.table("users")\
        .insert({
            "id": user_id,
            "context": context,
            "preferences": preferences,
            "calendar_url": calendar_url
        }).execute()
    
def set_user_context(
        user_id: str,
        context: dict
):
    """Updates the context for a given user."""
    sb.table("users")\
        .update({"context": context})\
        .eq("id", user_id)\
        .execute()

def get_user_context(user_id: str) -> dict:
    """Retrieves the context for a given user."""
    response = sb.table("users")\
        .select("context, preferences, calendar_url")\
        .eq("id", user_id)\
        .single()\
        .execute()

    return {
        "context": response.data.get("context", {}),
        "preferences": response.data.get("preferences", []),
        "calendar_url": response.data.get("calendar_url", "")
    } if response.data else {}

def add_task(
        user_id: str,
        context: dict,
        type_: str,
        period: str = "1 HOUR"
):
    """Adds a new task for the user with the given context and period."""
    response = sb.table("tasks")\
        .insert({
            "user_id": user_id,
            "context": context,
            "type": type_,
            "period": period,
            "last_run_ts": "now()"
        }).execute()
    
    return response.data[0] if response.data else None
    
def get_tasks(user_id: str) -> list[dict]:
    """Retrieves all tasks for a given user."""
    response = sb.table("tasks")\
        .select("*")\
        .eq("user_id", user_id)\
        .execute()

    return response.data if response.data else []

def delete_task(
        task_id: int,
        user_id: str
):
    """Deletes a task by its ID for the given user."""
    sb.table("tasks")\
        .delete()\
        .eq("id", task_id)\
        .eq("user_id", user_id)\
        .execute()
    
def update_task(
        task_id: int,
        user_id: str,
        context: dict
):
    """Updates a task's context and period by its ID for the given user."""
    sb.table("tasks")\
        .update({"context": context})\
        .eq("id", task_id)\
        .eq("user_id", user_id)\
        .execute()
    
def add_task_log(
        task_id: int,
        context: dict
):
    """Adds a log entry for a given task."""
    sb.table("task_logs")\
        .insert({
            "task_id": task_id,
            "context": context,
            "timestamp": "now()"
        }).execute()
    
def mark_tasks_ran(
        task_ids: list[int]
):
    """Updates the last_run_ts for the given task IDs to now."""
    sb.table("tasks")\
        .update({"last_run_ts": "now()"})\
        .in_("id", task_ids)\
        .execute()

def add_chat_message(
        user_id: str,
        context: dict
):
    """Adds a chat message for the given user."""
    sb.table("compact_chat")\
        .insert({
            "user_id": user_id,
            "context": context,
            "timestamp": "now()"
        }).execute()
    
def get_chat_messages(
        user_id: str,
        limit: int = 20
) -> list[dict]:
    """Retrieves the latest chat messages for a given user."""
    response = sb.table("compact_chat")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("timestamp", desc=True)\
        .limit(limit)\
        .execute()
    return response.data if response.data else []
