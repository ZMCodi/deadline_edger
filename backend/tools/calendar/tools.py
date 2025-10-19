from ai_sdk import tool
from .calendar_fetch import (
    get_calendar_service, 
    list_calendars, 
    get_events, 
    create_event, 
    search_events,
    update_event,
    delete_event
)
import database.supabase_db as sb
from datetime import datetime

# Hardcoded user ID for testing
USER_ID = "e6ac7c44-b6d3-465c-9d75-3d44611d0e6c"

=========================================================

def list_calendars_execute() -> list[dict]:
    """List all calendars for a user"""
    print(f"🔧 Listing calendars for user: {USER_ID}")
    try:
        user_context = sb.get_user_context(USER_ID)
        token_data = user_context.get("google_token")
        
        if not token_data:
            return [{"error": "User has not connected Google Calendar"}]
        
        service = get_calendar_service(token_data)
        calendars = list_calendars(service)
        print(f"✅ Found {len(calendars)} calendars")
        return calendars
    except Exception as e:
        print(f"❌ Error: {e}")
        return [{"error": str(e)}]


def get_calendar_events_execute(
    max_results: int = 10, 
    calendar_id: str = "primary",
    days_ahead: int = 7
) -> list[dict]:
    """Get upcoming calendar events for a user"""
    print(f"🔧 Fetching {max_results} events for user: {USER_ID} (next {days_ahead} days)")
    try:
        user_context = sb.get_user_context(USER_ID)
        token_data = user_context.get("google_token")
        
        if not token_data:
            return [{"error": "User has not connected Google Calendar"}]
        
        service = get_calendar_service(token_data)
        events = get_events(service, calendar_id=calendar_id, max_results=max_results)
        print(f"✅ Found {len(events)} events")
        return events
    except Exception as e:
        print(f"❌ Error: {e}")
        return [{"error": str(e)}]


def search_calendar_events_execute(
    query: str,
    max_results: int = 10,
    calendar_id: str = "primary"
) -> list[dict]:
    """Search calendar events by keyword"""
    print(f"🔧 Searching calendar for: '{query}'")
    try:
        user_context = sb.get_user_context(USER_ID)
        token_data = user_context.get("google_token")
        
        if not token_data:
            return [{"error": "User has not connected Google Calendar"}]
        
        service = get_calendar_service(token_data)
        events = search_events(service, query, calendar_id=calendar_id, max_results=max_results)
        print(f"✅ Found {len(events)} matching events")
        return events
    except Exception as e:
        print(f"❌ Error: {e}")
        return [{"error": str(e)}]


def create_calendar_event_execute(
    summary: str,
    start_datetime: str,
    end_datetime: str,
    description: str = "",
    location: str = "",
    calendar_id: str = "primary"
) -> dict:
    """Create a new calendar event"""
    print(f"🔧 Creating event: {summary}")
    try:
        user_context = sb.get_user_context(USER_ID)
        token_data = user_context.get("google_token")
        
        if not token_data:
            return {"error": "User has not connected Google Calendar"}
        
        service = get_calendar_service(token_data)
        
        # Parse datetime strings (supports ISO format)
        start = datetime.fromisoformat(start_datetime.replace('Z', '+00:00'))
        end = datetime.fromisoformat(end_datetime.replace('Z', '+00:00'))
        
        event_data = {
            'summary': summary,
            'start': start,
            'end': end,
            'description': description,
            'location': location
        }
        
        result = create_event(service, event_data, calendar_id=calendar_id)
        print(f"✅ Event created successfully")
        return result
    except Exception as e:
        print(f"❌ Error: {e}")
        return {"error": str(e)}


def update_calendar_event_execute(
    event_id: str,
    summary: str = None,
    start_datetime: str = None,
    end_datetime: str = None,
    description: str = None,
    location: str = None,
    calendar_id: str = "primary"
) -> dict:
    """Update an existing calendar event"""
    print(f"🔧 Updating event: {event_id}")
    try:
        user_context = sb.get_user_context(USER_ID)
        token_data = user_context.get("google_token")
        
        if not token_data:
            return {"error": "User has not connected Google Calendar"}
        
        service = get_calendar_service(token_data)
        
        # Build updates dict
        updates = {}
        if summary is not None:
            updates['summary'] = summary
        if description is not None:
            updates['description'] = description
        if location is not None:
            updates['location'] = location
        if start_datetime is not None:
            updates['start'] = datetime.fromisoformat(start_datetime.replace('Z', '+00:00'))
        if end_datetime is not None:
            updates['end'] = datetime.fromisoformat(end_datetime.replace('Z', '+00:00'))
        
        result = update_event(service, event_id, updates, calendar_id=calendar_id)
        print(f"✅ Event updated successfully")
        return result
    except Exception as e:
        print(f"❌ Error: {e}")
        return {"error": str(e)}


def delete_calendar_event_execute(
    event_id: str,
    calendar_id: str = "primary"
) -> dict:
    """Delete a calendar event"""
    print(f"🔧 Deleting event: {event_id}")
    try:
        user_context = sb.get_user_context(USER_ID)
        token_data = user_context.get("google_token")
        
        if not token_data:
            return {"error": "User has not connected Google Calendar"}
        
        service = get_calendar_service(token_data)
        delete_event(service, event_id, calendar_id=calendar_id)
        print(f"✅ Event deleted successfully")
        return {"success": True, "message": "Event deleted"}
    except Exception as e:
        print(f"❌ Error: {e}")
        return {"error": str(e)}


# tools

list_calendars_tool = tool(
    name="list_calendars",
    description="List all Google calendars for a user. Returns calendar names, IDs, and access roles.",
    parameters={
        "type": "object",
        "properties": {},
        "required": []
    },
    execute=list_calendars_execute
)

get_calendar_events_tool = tool(
    name="get_calendar_events",
    description="Get upcoming events from a user's Google Calendar. Returns event details including title, start/end time, location, description, and attendees.",
    parameters={
        "type": "object",
        "properties": {
            "max_results": {
                "type": "integer",
                "description": "Maximum number of events to return",
                "default": 10
            },
            "calendar_id": {
                "type": "string",
                "description": "Calendar ID to fetch from (default: 'primary' for main calendar)",
                "default": "primary"
            },
            "days_ahead": {
                "type": "integer",
                "description": "Number of days ahead to look for events",
                "default": 7
            }
        },
        "required": []
    },
    execute=get_calendar_events_execute
)

search_calendar_events_tool = tool(
    name="search_calendar_events",
    description="Search for calendar events by keyword. Searches event titles, descriptions, and locations.",
    parameters={
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Search keyword or phrase to find in events"
            },
            "max_results": {
                "type": "integer",
                "description": "Maximum number of matching events to return",
                "default": 10
            },
            "calendar_id": {
                "type": "string",
                "description": "Calendar ID to search in (default: 'primary')",
                "default": "primary"
            }
        },
        "required": ["query"]
    },
    execute=search_calendar_events_execute
)

create_calendar_event_tool = tool(
    name="create_calendar_event",
    description="Create a new event in the user's Google Calendar. Requires title, start time, and end time. Optionally add description, location.",
    parameters={
        "type": "object",
        "properties": {
            "summary": {
                "type": "string",
                "description": "Event title/summary"
            },
            "start_datetime": {
                "type": "string",
                "description": "Event start time in ISO format (e.g., '2024-12-25T10:00:00Z' or '2024-12-25T10:00:00-05:00')"
            },
            "end_datetime": {
                "type": "string",
                "description": "Event end time in ISO format (e.g., '2024-12-25T11:00:00Z')"
            },
            "description": {
                "type": "string",
                "description": "Event description or notes",
                "default": ""
            },
            "location": {
                "type": "string",
                "description": "Event location (address, room name, etc.)",
                "default": ""
            },
            "calendar_id": {
                "type": "string",
                "description": "Calendar ID to create event in (default: 'primary')",
                "default": "primary"
            }
        },
        "required": ["summary", "start_datetime", "end_datetime"]
    },
    execute=create_calendar_event_execute
)

update_calendar_event_tool = tool(
    name="update_calendar_event",
    description="Update an existing calendar event. Can modify title, time, description, or location. Only provide fields you want to change.",
    parameters={
        "type": "object",
        "properties": {
            "event_id": {
                "type": "string",
                "description": "The event ID to update (from get_calendar_events or search)"
            },
            "summary": {
                "type": "string",
                "description": "New event title/summary (optional)"
            },
            "start_datetime": {
                "type": "string",
                "description": "New start time in ISO format (optional)"
            },
            "end_datetime": {
                "type": "string",
                "description": "New end time in ISO format (optional)"
            },
            "description": {
                "type": "string",
                "description": "New event description (optional)"
            },
            "location": {
                "type": "string",
                "description": "New event location (optional)"
            },
            "calendar_id": {
                "type": "string",
                "description": "Calendar ID where event exists (default: 'primary')",
                "default": "primary"
            }
        },
        "required": ["event_id"]
    },
    execute=update_calendar_event_execute
)

delete_calendar_event_tool = tool(
    name="delete_calendar_event",
    description="Delete a calendar event permanently. Use with caution - this cannot be undone.",
    parameters={
        "type": "object",
        "properties": {
            "event_id": {
                "type": "string",
                "description": "The event ID to delete (from get_calendar_events or search)"
            },
            "calendar_id": {
                "type": "string",
                "description": "Calendar ID where event exists (default: 'primary')",
                "default": "primary"
            }
        },
        "required": ["event_id"]
    },
    execute=delete_calendar_event_execute
)


# export all tools

__all__ = [
    'list_calendars_tool',
    'get_calendar_events_tool',
    'search_calendar_events_tool',
    'create_calendar_event_tool',
    'update_calendar_event_tool',
    'delete_calendar_event_tool'
]

