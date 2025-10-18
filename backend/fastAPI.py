import asyncio
import os
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from fastapi import Body, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from collections import defaultdict
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

#pydantic models define the structure of the JSON that the API will return.

class Template(BaseModel):
    id: int # the node address
    todos: List[str]
    lat: float
    status: str

#api endpoints

@app.get("/api/nodes/latest", response_model=Template)
def get_latest_nodes():
    pass

@app.post("/api/cron/run-tasks")
def run_scheduled_tasks(tasks = Body(...)):
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

    model = openai("google/gemini-2.5-flash")
    
    result = generate_object(
        model=model,
        schema=AgentResponse,
        prompt=request.message,
        system=system_prompt,
    )
    
    return result.object
