import asyncio
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from fastapi import Body, Depends, FastAPI, HTTPException, Query
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

#api endpoints

@app.post("/api/task/create")
def create_task(
    user_id: str = Depends(sb.authenticate_user),
    task: dict = Body(...)
):
    """Creates a new task for the authenticated user."""
    sb.add_task(
        user_id=user_id,
        type_=task.get("type_", "TODO"),
        context=task.get("context", {}),
        period=task.get("period", None)
    )

    context = sb.get_user_context(user_id)
    chats = sb.get_chat_messages(user_id)

    # run_task(user_id, task, context, chats)

    sb.mark_tasks_ran([task.get("id")])

@app.get("/api/tasks")
def get_tasks(
    user_id: str = Depends(sb.authenticate_user)
):
    """Retrieves all tasks for the authenticated user."""
    return sb.get_tasks(user_id)

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
