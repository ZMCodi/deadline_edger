import os
from dotenv import load_dotenv
from ai_sdk import tool, generate_text, openai
from tools.firecrawl_client import scrape_url
from tools.email_fetcher import mail_fetch
from tools.calendar import (
    list_calendars_tool,
    get_calendar_events_tool,
    search_calendar_events_tool,
    create_calendar_event_tool,
    update_calendar_event_tool,
    delete_calendar_event_tool
)
import ezgmail

load_dotenv()


PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CREDENTIALS_PATH = PROJECT_ROOT 
TOKEN_PATH = os.path.join(PROJECT_ROOT, "token.json")


try:
    ezgmail.init(tokenFile=TOKEN_PATH, credentialsFile=CREDENTIALS_PATH)
    print(f"✅ EZGmail initialized successfully for: {ezgmail.EMAIL_ADDRESS}")
except Exception as e:
    print(f"⚠️  EZGmail initialization failed: {e}")
    print(f"📍 Looking for credentials in: {CREDENTIALS_PATH}")
    print(f"📍 Expected files: client_secret_*.json or credentials-sheets.json")
    print(f"📍 Token file location: {TOKEN_PATH}")

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


def chat_with_agent(user_message: str, system_prompt: str = None) -> dict:
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
    if system_prompt is None:
        system_prompt = """You are a helpful AI assistant with access to tools that can:
1. Scrape webpages to extract content from URLs
2. Fetch emails from the user's inbox
3. List all user's Google calendars
4. Get upcoming calendar events
5. Search calendar events by keyword
6. Create new calendar events
7. Update existing calendar events
8. Delete calendar events

Use these tools when needed to help answer the user's questions or complete their tasks.
When fetching emails, dates should be in yyyy/mm/dd format.
When creating/updating calendar events, use ISO datetime format (e.g., '2024-12-25T10:00:00Z' or '2025-10-20T14:30:00-05:00')."""
    
    print(f"💬 User: {user_message}")
    print(f"🤖 Agent thinking...")
    result = generate_text(
        model=openai(os.getenv("DEFAULT_MODEL")),
        prompt=user_message,
        system=system_prompt,
        tools=[
            scrape_webpage_tool, 
            list_calendars_tool,
            get_calendar_events_tool,
            search_calendar_events_tool,
            create_calendar_event_tool,
            update_calendar_event_tool,
            delete_calendar_event_tool
        ],
        max_steps=5 
    )
    
    print(f"✅ Agent response: {result.text}")
    
    return {
        "text": result.text,
        "tool_calls": getattr(result, "tool_calls", []),
        "steps": getattr(result, "steps", [])
    }


# Example usage
if __name__ == "__main__":
    # Test the agent with calendar
    print("🚀 Testing Calendar Agent")
    print("="*60)
    
    response = chat_with_agent(
        "I'm not going to be getting married on 2025-12-25. Remove this calendar event for it."
    )
    print("\n" + "="*60)
    print("Final Response:")
    print(response["text"])
    print("="*60)