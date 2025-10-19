import asyncio
import os
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from fastapi import Body, FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from collections import defaultdict
from models import Task, TaskResponse, Context, UserToken, UserOnboarding
from ai_sdk import generate_object, openai
from dotenv import load_dotenv
import database.supabase_db as sb
from models import AgentResponse
from agent import scrape_webpage_tool

load_dotenv()

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # very permissive setting that tells browsers to allow requests from any domain. convenient for development but should be restricted to the actual frontend's domain in a production environment for security.
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

@app.post("/api/task/create")
def create_task(
    task: Task,
    user_id: str = Depends(sb.authenticate_user)
):
    """Creates a new task for the authenticated user."""
    added_task = sb.add_task(
        title=task.title,
        user_id=user_id,
        type_=task.type_.value,
        context=task.context.model_dump(mode="json"),
        period=task.period
    )

    context = sb.get_user_context(user_id)
    chats = sb.get_chat_messages(user_id)

    # run_task(user_id, task, context, chats)

    sb.mark_tasks_ran([added_task['id']])

@app.get("/api/tasks", response_model=list[TaskResponse])
def get_tasks(
    user_id: str = Depends(sb.authenticate_user)
):
    """Retrieves all tasks for the authenticated user."""
    user_tasks = sb.get_tasks(user_id)
    return [
        TaskResponse(
            id_=task["id"],
            type_=task["type"],
            title=task["title"],
            context=Context(**task["context"]),
            period=task["period"],
            last_run_ts=task["last_run_ts"]
        ) for task in user_tasks
    ]

@app.post("/api/users/token")
def add_user_token(
    token: UserToken,
    user_id: str = Depends(sb.authenticate_user)
):
    """Adds a token for the authenticated user."""
    sb.set_user_token(user_id, token.model_dump(mode="json"))

@app.get("/api/users/onboard")
def get_whether_user_onboarded(
    user_id: str = Depends(sb.authenticate_user)
):
    """Checks if the user is onboarded by retrieving their context."""
    try:
        sb.get_user_context(user_id)
        return True
    except Exception as e:
        return False

@app.post("/api/users/onboard")
def onboard_user(
    onboarding_data: UserOnboarding,
    user_id: str = Depends(sb.authenticate_user)
):
    """Onboards a new user with context, preferences, calendar URL, and Google token."""
    sb.add_user(
        user_id=user_id,
        context=onboarding_data.context,
        preferences=onboarding_data.preferences,
        calendar_url=onboarding_data.calendar_url
    )

    if onboarding_data.google_token:
        sb.set_user_token(user_id, onboarding_data.google_token)

@app.post("/api/cron/run-tasks")
def run_scheduled_tasks(tasks = Body(...)):
    """Endpoint to be called by a cron job to run scheduled tasks."""
    print("Received tasks:", tasks['tasks'])
    user_tasks = defaultdict(list)

    for task in tasks['tasks']:
        user_id = task.pop('user_id')
        user_tasks[user_id].append(task)

    for user_id, tasks in user_tasks.items():
        print(f"Running tasks for user {user_id}:")
        context = sb.get_user_context(user_id)
        chats = sb.get_chat_messages(user_id)
        print(f" - User context: {context}")
        print(f" - Chat history: {chats}")

        ids = []
        # this is where we give all tasks to agents + provide tools and knowledge of them
        # with these toools agent is given goal to get to the end result
        # also provide context
        for task in tasks:
            print(f" - Task: {task}")
            ids.append(task.get("id"))
            # ADD YOUR TASK RUNNING LOGIC HERE
            # run_task(user_id, task, context, chats)

        # mark them as ran
        sb.mark_tasks_ran(ids)

# Configure OpenRouter as default for all OpenAI calls
os.environ["OPENAI_BASE_URL"] = "https://openrouter.ai/api/v1"
os.environ["OPENAI_API_KEY"] = os.getenv("OPENROUTER_API_KEY")


class ChatRequest(BaseModel):
    message: str


@app.post("/api/agent/chat", response_model=AgentResponse)
async def chat_with_agent(request: ChatRequest):
    
    system_prompt = """You are a helpful AI assistant that can help with tasks and questions.

Your capabilities:
- You can create, run, and manage tasks for users
- You can reshuffle calendars and schedules

When the user asks for:
1. Creating a task: Set type_ to "create_task" and populate the tasks list
2. Running a task: Set type_ to "run_task" 
3. Reshuffling calendar: Set type_ to "reshuffle_calendar"
4. General questions: Set type_ to "no_task" and provide helpful text

Important:
- Be clear and concise in your explanations for reusability later.
"""

    model = openai(os.getenv("DEFAULT_MODEL"))
    
    result = generate_object(
        model=model,
        schema=AgentResponse,
        prompt=request.message,
        system=system_prompt,
    )
    
    return result.object
