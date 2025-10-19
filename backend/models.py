from pydantic import BaseModel, Field
from typing import List, Optional
import enum
from datetime import timedelta

class ChatTaskType(enum.Enum):
    create_task = "create_task"
    run_task = "run_task"
    reshuffle_calendar = "reshuffle_calendar"    
    no_task = "no_task"

class TaskType(enum.Enum):
    email = "EMAIL"
    web = "WEB"
    todo = "TODO"

class Context(BaseModel):
    prompt: str = Field(description="Description of the user's task with added detail")
    priority: str = Field(description="Priority of the user's task, high, medium, low")
    url: Optional[str] = Field(None, description="URL of the task to be executed")

class Task(BaseModel):
    context: Context = Field(description="Information about what the task will do")
    period: str = Field(description="How often the task will be run, e.g. 1 hour, 1 day, 1 week")
    type: TaskType = Field(description="Type of task to be created")
    title: str = Field(description="Title of the task to be executed")

class AgentResponse(BaseModel):
    type_: ChatTaskType
    text: str = Field(description="Explanation of the task to be created")
    tasks: Optional[List[Task]] = Field(None, description="List of tasks to be created")

class TaskResponse(BaseModel):
    id_: int = Field(description="Unique identifier for the task")
    type_: TaskType = Field(description="Type of the task")
    title: str = Field(description="Title of the task")
    context: Context = Field(description="Context of the task")
    period: str = Field(description="Period of the task in seconds")
    last_run_ts: str = Field(description="Timestamp of the last run of the task")

class UserToken(BaseModel):
    access_token: str = Field(description="Access token for the user")
    refresh_token: str = Field(description="Refresh token for the user")
    scope: str = Field(description="Scope of the token")
    token_type: str = Field(description="Type of the token")
    expiry_date: str = Field(description="Expiry date of the token")

class UserOnboarding(BaseModel):
    context: dict = Field(description="User context data")
    preferences: List[str] = Field(description="User preferences")
    calendar_url: str = Field(description="URL of the user's calendar")
    google_token: Optional[dict] = Field(None, description="Google token information")
