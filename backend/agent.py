import os
from dotenv import load_dotenv
from ai_sdk import tool, generate_text, openai
from backend.tools.firecrawl_client import scrape_url
#from tools.email_fetcher import mail_fetch
from backend.tools.calendar import (
    list_calendars_tool,
    get_calendar_events_tool,
    get_all_calendar_events_tool,
    search_calendar_events_tool,
    create_calendar_event_tool,
    update_calendar_event_tool,
    delete_calendar_event_tool
)

load_dotenv()


PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CREDENTIALS_PATH = PROJECT_ROOT 
TOKEN_PATH = os.path.join(PROJECT_ROOT, "token.json")


def scrape_webpage_execute(url: str, only_main_content: bool = True) -> str:
    """Scrape a webpage and return its content"""
    print(f"🔧 Scraping: {url}")
    return scrape_url(url, only_main_content)

def email_fetch_execute(start_date: str, max_results: int = 10) -> list[dict]:
    """Fetch emails from the user's inbox"""
    print(f"🔧 Fetching emails from {start_date} (max: {max_results})")
    return mail_fetch(start_date, max_results)

# Define the scraping tool with JSON schema
scrape_webpage_tool = tool(
    name="scrape_webpage",
    description="Scrape content from a specific webpage and return it in markdown format. Use this when you need to get the content of a URL.",
    parameters={
        "type": "object",
        "properties": {
            "url": {
                "type": "string",
                "description": "The URL of the webpage to scrape (must start with http:// or https://)"
            },
            "only_main_content": {
                "type": "boolean",
                "description": "Whether to extract only the main content of the page",
                "default": True
            }
        },
        "required": ["url"]
    },
    execute=scrape_webpage_execute
)


def create_agent():
    """Initialize and return the AI agent with OpenRouter configuration"""
    os.environ["OPENAI_BASE_URL"] = "https://openrouter.ai/api/v1"
    os.environ["OPENAI_API_KEY"] = os.getenv("OPENROUTER_API_KEY")
    
    # Return a configured model instance
    model = openai(os.getenv("DEFAULT_MODEL"))
    return model


def chat_with_agent(user_message: str, context_injection: str = None) -> dict:
    """
    Chat with the agent and let it use available tools.
    
    Args:
        user_message: The user's message/query
        system_prompt: Optional system prompt to guide the agent's behavior
    
    Returns:
        dict with 'text' (response) and 'tool_calls' (list of tools used)
    """
    # Set up OpenRouter configuration
    os.environ["OPENAI_BASE_URL"] = "https://openrouter.ai/api/v1"
    os.environ["OPENAI_API_KEY"] = os.getenv("OPENROUTER_API_KEY")
    
    # Default system prompt if none provided
    system_prompt = """You are a realistic scheduling AI. Be concise and action-oriented.

## YOUR JOB
Schedule tasks realistically considering user's actual behavior (procrastination, energy levels, interruptions).

## WORKFLOW
1. Call `get_all_calendar_events` FIRST to see current schedule
2. Analyze conflicts, capacity, and workload
3. Create/update/delete events using tools
4. Output brief summary

## RULES
- Add 20-30% time buffer to estimates
- Max 4-6 hours deep work per day
- Schedule breaks between tasks
- Don't overload schedule - be realistic
- Take action, don't just suggest

## OUTPUT FORMAT
```
✅ Actions: Created X, Updated Y
⚠️ Issues: Conflict on Friday
📊 Status: 3/5 scheduled, 2 deferred
```

NO lengthy explanations. Just actions + warnings.
"""

    if context_injection:
        system_prompt += f"\n\n Here are some added context for you to help you make decisions: {context_injection}"

    print(f"💬 User: {user_message}")
    print(f"🤖 Agent thinking...")
    result = generate_text(
        model=openai(os.getenv("DEFAULT_MODEL")),
        prompt=user_message,
        system=system_prompt,
        tools=[
            scrape_webpage_tool,
            get_all_calendar_events_tool,
            list_calendars_tool,
            get_calendar_events_tool,
            search_calendar_events_tool,
            create_calendar_event_tool,
            update_calendar_event_tool,
            delete_calendar_event_tool
        ],
        max_steps=10
    )
    
    # Ensure we always have response text
    response_text = result.text if result.text and result.text.strip() else "✅ Calendar updated successfully."
    print(f"✅ Agent response: {response_text}")
    
    return {
        "text": response_text,
        "tool_calls": getattr(result, "tool_calls", []),
        "steps": getattr(result, "steps", [])
    }


def run_tasks_with_agent(user_id: str, tasks: list, user_context: dict, chat_history: list) -> dict:
    """
    Run scheduled tasks through the agent with full context.
    
    Args:
        user_id: User identifier
        tasks: List of tasks to schedule/execute
        user_context: User preferences, patterns, calendar_url
        chat_history: Recent chat messages
    
    Returns:
        Agent response with actions taken
    """
    # Format tasks into user message
    task_descriptions = []
    for task in tasks:
        task_desc = f"- {task['title']}: {task['context'].get('prompt', '')} (Priority: {task['context'].get('priority', 'medium')})"
        task_descriptions.append(task_desc)
    
    user_message = f"""Schedule these tasks:

{chr(10).join(task_descriptions)}

Review calendar, find optimal time slots, and create the events."""
    
    # Build context injection
    context_str = f"""
User Context:
- Preferences: {user_context.get('preferences', [])}

Recent Chat History:
{chr(10).join([f"- {msg.get('context', {}).get('message', '')}" for msg in chat_history[-5:]])}
"""
    
    return chat_with_agent(user_message, context_injection=context_str)


# Example usage
if __name__ == "__main__":
    # Test the agent with calendar
    print("🚀 Testing Calendar Agent")
    print("="*60)
    
    response = chat_with_agent(
        """
        Prepare the week ahead:
        1. Get all calendar events for the upcoming week
        2. Review pending tasks and their deadlines
        3. Identify any deadline conflicts or crunch periods
        4. Suggest schedule optimizations
        5. Warn about burnout risk if overcommitted

        Provide a realistic weekly outlook.
        """
    )
    print("\n" + "="*60)
    print("Final Response:")
    print(response["text"])
    print("="*60)
