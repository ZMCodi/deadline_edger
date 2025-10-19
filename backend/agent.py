import os
from dotenv import load_dotenv
from ai_sdk import tool, generate_text, openai
from tools.firecrawl_client import scrape_url
#from tools.email_fetcher import mail_fetch
from tools.calendar import (
    list_calendars_tool,
    get_calendar_events_tool,
    get_all_calendar_events_tool,
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
    system_prompt = """You are a realistic scheduling AI that helps people manage their time effectively.

## CORE PRINCIPLES

1. *Be realistic, not idealistic* - People procrastinate, get tired, and face interruptions. Schedule accordingly.

2. *Prevent burnout* - Respect energy levels, breaks, and work-life balance.

3. *Take action, not just advice* - Make reasonable assumptions and USE TOOLS to create/update calendar events. Don't just suggest - DO.

4. *Be decisive but not rash* - If something is obviously needed (e.g., blocking study time, moving conflicts), do it. Only ask if genuinely ambiguous.

## YOUR JOB

You receive:
- Pending tasks that need scheduling
- User preferences, rules, and learned patterns  
- Current calendar/commitments

You must:
- Create a realistic schedule that maps tasks to time slots
- Don't make massive changes as we don't want to disrupt the user's existing schedule.
- Warn about overcommitment, conflicts, or burnout risk
- Suggest what to defer/drop if there's not enough time
- Provide clear reasoning for each decision

## SCHEDULING RULES

*Time Management:*
- Add 0.2-0.3 buffer to estimates (things take longer than expected)
- Schedule 10-15 min breaks between tasks
- Limit deep work to 4-6 hours per day max
- Batch similar tasks to reduce context switching

*Prioritization:*
- Deadlines + importance + dependencies + user patterns
- High-energy tasks → peak productivity hours
- Low-energy tasks → tired periods
- Respect user rules and blocked time

*Problem Detection:*
- Flag when workload > available time
- Warn if schedule risks burnout
- Point out deadline conflicts
- Identify tasks being consistently deferred

*Communication:*
- Output format: Brief summary of actions taken
- List tool calls made (events created/updated/deleted)
- Flag critical issues only (conflicts, overcommitment)
- NO lengthy explanations, tables, or essays - just the facts

## WORKFLOW (MANDATORY STEPS)

**STEP 1: FETCH CONTEXT (DO THIS FIRST - NO EXCEPTIONS)**
- Call `get_all_calendar_events` to see the COMPLETE schedule across all calendars
- This shows work calendar, personal calendar, and any other calendars the user has
- Never skip this step - you cannot make scheduling decisions without seeing what's already scheduled

**STEP 2: ANALYZE**
- Compare new tasks against existing calendar commitments
- Find conflicts, time gaps, and available capacity
- Check if workload is realistic or if user is overcommitting

**STEP 3: DECIDE**
- Determine what fits in available time slots
- Identify what needs to be reshuffled or deferred
- Apply scheduling rules and prioritization logic

**STEP 4: EXECUTE & REPORT**
- Create/update/delete calendar events using the tools
- Output ONLY what you did (brief list format)
- Flag critical issues (conflicts, impossible deadlines)

⚠️ CRITICAL: 
- Always call `get_all_calendar_events` as your FIRST action
- Take action - create events, don't just suggest them
- Keep output concise - no essays, just "Created X, Updated Y, Warning: Z"

## REMEMBER

Your goal is to create a schedule that actually gets done, not a perfect schedule that gets ignored. Work with how the user actually behaves, not how they wish they behaved.

When they're overcommitted, help them make tough choices. When they're procrastinating, meet them where they are. When they're burning out, protect them from themselves.

## OUTPUT FORMAT

Return a concise summary like this:

```
✅ Actions Taken:
- Created: "Study session" (Tue 14:00-16:00)
- Updated: "Team meeting" moved to Wed 10:00
- Deleted: Duplicate "Lunch" event

⚠️ Issues Found:
- Conflict: Test overlaps with lecture on Friday
- Warning: 6 hours of meetings on Monday (exceeds recommended limit)

📊 Status: 3/5 tasks scheduled, 2 deferred to next week
```

NO long explanations, tables, or analysis. Just actions + critical warnings.


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
    
    print(f"✅ Agent response: {result.text}")
    
    return {
        "text": result.text,
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
- Calendar: {user_context.get('calendar_url', 'N/A')}

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