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
    url: Optional[str] = Field(description="URL of the task to be executed")

class AgentResponse(BaseModel):
    _type: ChatTaskType
    text: str = Field(description="Explanation of the task to be created")
    tasks: Optional[List[Task]] = Field(description="List of tasks to be created")


class Task(BaseModel):
    context: Context = Field(description="Information about what the task will do")
    period: timedelta = Field(description="How often the task will be run, e.g. 1 hour, 1 day, 1 week")
    _type: TaskType = Field(description="Type of task to be created")
    title: str = Field(description="Title of the task to be executed")
