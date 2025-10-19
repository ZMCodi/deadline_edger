import asyncio
import os
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from fastapi import Body, FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from collections import defaultdict
from backend.models import Task, TaskResponse, Context, UserToken, UserOnboarding, AgentResponse
from ai_sdk import generate_object, openai
from dotenv import load_dotenv
import backend.database.supabase_db as sb
from backend.agent import scrape_webpage_tool, run_tasks_with_agent, chat_with_agent as agent_chat

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

    # TODO: run the task here
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
        
        # Run all tasks through the agent
        response = run_tasks_with_agent(user_id, tasks, context, chats)
        print(f"Agent response: {response['text']}")
        
        ids = [task.get("id") for task in tasks]
        sb.mark_tasks_ran(ids)

# Configure OpenRouter as default for all OpenAI calls
os.environ["OPENAI_BASE_URL"] = "https://openrouter.ai/api/v1"
os.environ["OPENAI_API_KEY"] = os.getenv("OPENROUTER_API_KEY")


class ChatRequest(BaseModel):
    message: str


@app.post("/api/agent/chat", response_model=AgentResponse)
async def chat_endpoint(
    request: ChatRequest,
    user_id: str = Depends(sb.authenticate_user)
):
    """
    Chat with the scheduling agent.
    Handles:
    - One-off tasks: Adds directly to Google Calendar
    - Reshuffling: Uses agent to optimize existing calendar
    - General questions: Fetches context and answers
    """
    
    # First, classify what the user wants
    classify_prompt = """You are a helpful AI assistant that classifies user requests.

Your capabilities:
- You can create, run, and manage tasks for users
- You can reshuffle calendars and schedules
- You can add one-off events to calendars
- You can answer questions about schedules

When the user asks for:
1. Creating a task: Set type_ to "create_task" and populate the tasks list
2. Adding a one-off calendar event is classed as no_task as we just add to calendar
3. Reshuffling calendar: Set type_ to "reshuffle_calendar"
4. General questions: Set type_ to "no_task" and provide helpful text

Important:
- Be clear and concise in your explanations for reusability later.
"""

    model = openai(os.getenv("DEFAULT_MODEL"))
    
    classification = generate_object(
        model=model,
        schema=AgentResponse,
        prompt=request.message,
        system=classify_prompt,
    )
    
    # Get user context
    context = sb.get_user_context(user_id)
    chats = sb.get_chat_messages(user_id)
    
    # Build context string
    context_str = f"""
User Context:
- Preferences: {context.get('preferences', [])}

Recent Chat History:
{chr(10).join([f"- {msg.get('context', {}).get('message', '')}" for msg in chats[-5:]])}
"""
    
    # Handle based on classification
    if classification.object.type_ == "run_task":
        # One-off task: Add to calendar using agent
        agent_response = agent_chat(
            user_message=f"Add this to my calendar: {request.message}",
            context_injection=context_str
        )
        return AgentResponse(
            type_=classification.object.type_,
            text=agent_response['text'],
            tasks=classification.object.tasks
        )
    
    elif classification.object.type_ == "reshuffle_calendar":
        # Reshuffle calendar using agent
        agent_response = agent_chat(
            user_message=f"Reshuffle my calendar based on: {request.message}",
            context_injection=context_str
        )
        return AgentResponse(
            type_=classification.object.type_,
            text=agent_response['text'],
            tasks=None
        )
    
    elif classification.object.type_ == "create_task":
        # Creating a recurring task - just classify and return
        return classification.object
    
    else:
        # General question - use agent with context
        agent_response = agent_chat(
            user_message=request.message,
            context_injection=context_str
        )
        return AgentResponse(
            type_="no_task",
            text=agent_response['text'],
            tasks=None
        )
