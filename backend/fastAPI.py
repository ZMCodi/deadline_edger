import asyncio
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from fastapi import Body, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware # To allow frontend to connect
from collections import defaultdict

import database.supabase_db as sb

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
def get_latest_nodes(
    site: Optional[str] = None, 
    status: Optional[int] = None,
    shift: Optional[str] = None,
    crew: Optional[List[str]] = Query(None)  # query to properly receive a list from the url
):
    print("hello")
    
    return {}

@app.post("/api/cron/run-tasks")
def run_scheduled_tasks(
    tasks = Body(...)
):
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
        for task in tasks:
            print(f" - Task: {task}")
