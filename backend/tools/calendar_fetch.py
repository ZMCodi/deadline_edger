"""
Google Calendar API - Updated to work with frontend OAuth tokens
================================================================
Prerequisites:
1. Install: pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
2. Store user's OAuth token in your database (Supabase)
3. Run from: backend/ directory using: python -m tools.calendar_fetch
"""

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from datetime import datetime, timedelta
import json

def create_credentials_from_token(token_data):
    """
    Create Google credentials object from your frontend OAuth token
    
    Args:
        token_data: Dict with keys: access_token, refresh_token, token_type, 
                   expiry_date (in milliseconds), scope
    
    Returns:
        Credentials object ready to use with Google APIs
    """
    # Convert expiry from milliseconds to seconds if needed
    expiry_timestamp = token_data.get('expiry_date')
    if expiry_timestamp:
        # If it's in milliseconds (13 digits), convert to seconds
        if len(str(expiry_timestamp)) > 10:
            expiry_timestamp = int(expiry_timestamp) / 1000
    
    # Create credentials object
    creds = Credentials(
        token=token_data.get('access_token'),
        refresh_token=token_data.get('refresh_token') or None,
        token_uri='https://oauth2.googleapis.com/token',
        client_id=None,  # Not needed for API calls
        client_secret=None,  # Not needed for API calls
        scopes=token_data.get('scope', '').split() if isinstance(token_data.get('scope'), str) else token_data.get('scope', [])
    )
    
    return creds

def get_calendar_service(token_data):
    """
    Get authenticated calendar service from token data
    
    Args:
        token_data: Dict from frontend OAuth or database
    
    Returns:
        Google Calendar API service object
    """
    creds = create_credentials_from_token(token_data)
    return build('calendar', 'v3', credentials=creds)

def list_calendars(service):
    """List all calendars"""
    try:
        calendars = service.calendarList().list().execute()
        
        calendar_list = []
        for calendar in calendars.get('items', []):
            calendar_list.append({
                'summary': calendar['summary'],
                'id': calendar['id'],
                'primary': calendar.get('primary', False)
            })
        
        return calendar_list
    except Exception as e:
        print(f"Error listing calendars: {e}")
        return []

def get_events(service, calendar_id='primary', max_results=10, time_min=None):
    """
    Get upcoming events from calendar
    
    Args:
        service: Calendar service object
        calendar_id: Calendar ID (default 'primary')
        max_results: Maximum number of events to return
        time_min: Start time (datetime object), defaults to now
    
    Returns:
        List of event dictionaries
    """
    try:
        if time_min is None:
            time_min = datetime.utcnow()
        
        events_result = service.events().list(
            calendarId=calendar_id,
            timeMin=time_min.isoformat() + 'Z',
            maxResults=max_results,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        
        # Format events for easier consumption
        formatted_events = []
        for event in events:
            formatted_events.append({
                'id': event['id'],
                'summary': event.get('summary', 'No title'),
                'description': event.get('description', ''),
                'start': event['start'].get('dateTime', event['start'].get('date')),
                'end': event['end'].get('dateTime', event['end'].get('date')),
                'location': event.get('location', ''),
                'attendees': event.get('attendees', []),
                'htmlLink': event.get('htmlLink', '')
            })
        
        return formatted_events
    except Exception as e:
        print(f"Error fetching events: {e}")
        return []

def get_events_in_range(service, start_date, end_date, calendar_id='primary'):
    """Get events within a specific date range"""
    try:
        events_result = service.events().list(
            calendarId=calendar_id,
            timeMin=start_date.isoformat() + 'Z',
            timeMax=end_date.isoformat() + 'Z',
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        
        formatted_events = []
        for event in events:
            formatted_events.append({
                'id': event['id'],
                'summary': event.get('summary', 'No title'),
                'start': event['start'].get('dateTime', event['start'].get('date')),
                'end': event['end'].get('dateTime', event['end'].get('date')),
                'description': event.get('description', ''),
                'location': event.get('location', '')
            })
        
        return formatted_events
    except Exception as e:
        print(f"Error fetching events in range: {e}")
        return []

def create_event(service, event_data, calendar_id='primary'):
    """
    Create a new calendar event
    
    Args:
        service: Calendar service object
        event_data: Dict with event details
            Required: summary, start (datetime), end (datetime)
            Optional: description, location, attendees (list of emails), timezone
        calendar_id: Calendar ID (default 'primary')
    
    Returns:
        Created event dict or None if error
    """
    try:
        timezone = event_data.get('timezone', 'UTC')
        
        event = {
            'summary': event_data['summary'],
            'start': {
                'dateTime': event_data['start'].isoformat(),
                'timeZone': timezone,
            },
            'end': {
                'dateTime': event_data['end'].isoformat(),
                'timeZone': timezone,
            }
        }
        
        # Add optional fields
        if 'description' in event_data:
            event['description'] = event_data['description']
        
        if 'location' in event_data:
            event['location'] = event_data['location']
        
        if 'attendees' in event_data:
            event['attendees'] = [{'email': email} for email in event_data['attendees']]
        
        if 'reminders' in event_data:
            event['reminders'] = event_data['reminders']
        
        created_event = service.events().insert(
            calendarId=calendar_id, 
            body=event
        ).execute()
        
        return {
            'id': created_event['id'],
            'htmlLink': created_event.get('htmlLink'),
            'summary': created_event.get('summary')
        }
    except Exception as e:
        print(f"Error creating event: {e}")
        return None

def update_event(service, event_id, updates, calendar_id='primary'):
    """Update an existing event"""
    try:
        # Get the existing event
        event = service.events().get(
            calendarId=calendar_id, 
            eventId=event_id
        ).execute()
        
        # Update fields
        for key, value in updates.items():
            event[key] = value
        
        updated_event = service.events().update(
            calendarId=calendar_id,
            eventId=event_id,
            body=event
        ).execute()
        
        return updated_event
    except Exception as e:
        print(f"Error updating event: {e}")
        return None

def delete_event(service, event_id, calendar_id='primary'):
    """Delete an event"""
    try:
        service.events().delete(
            calendarId=calendar_id, 
            eventId=event_id
        ).execute()
        return True
    except Exception as e:
        print(f"Error deleting event: {e}")
        return False

def search_events(service, query, calendar_id='primary', max_results=10):
    """Search for events by keyword"""
    try:
        events_result = service.events().list(
            calendarId=calendar_id,
            q=query,
            maxResults=max_results,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        
        formatted_events = []
        for event in events:
            formatted_events.append({
                'id': event['id'],
                'summary': event.get('summary', 'No title'),
                'start': event['start'].get('dateTime', event['start'].get('date')),
                'description': event.get('description', '')
            })
        
        return formatted_events
    except Exception as e:
        print(f"Error searching events: {e}")
        return []

# Example usage with your database
if __name__ == '__main__':
    try:
        import database.supabase_db as sb
        
        # Get user's token from database
        user_id = "e6ac7c44-b6d3-465c-9d75-3d44611d0e6c"
        print(f"Fetching token for user: {user_id}")
        
        user_context = sb.get_user_context(user_id)
        token_data = user_context.get("google_token")
        
        if not token_data:
            print("\n❌ ERROR: No token found in database!")
            print("Please authenticate user through frontend OAuth first.")
            exit(1)
        
        print("✅ Token found!")
        print(f"Token has access_token: {bool(token_data.get('access_token'))}")
        print(f"Token has refresh_token: {bool(token_data.get('refresh_token'))}")
        print(f"Token scopes: {token_data.get('scope', 'N/A')[:100]}...")
        
        # Create service
        print("\n📅 Creating calendar service...")
        service = get_calendar_service(token_data)
        print("✅ Service created successfully!")
        
        # List calendars
        print("\n📋 Listing calendars...")
        calendars = list_calendars(service)
        print(f"✅ Found {len(calendars)} calendar(s):")
        for cal in calendars:
            primary = " (PRIMARY)" if cal.get('primary') else ""
            print(f"  • {cal['summary']}{primary}")
        
        # Get upcoming events
        print("\n📅 Fetching upcoming events...")
        events = get_events(service, max_results=5)
        
        if events:
            print(f"✅ Found {len(events)} upcoming event(s):")
            for event in events:
                print(f"  • {event['start']}: {event['summary']}")
                if event.get('location'):
                    print(f"    📍 {event['location']}")
        else:
            print("No upcoming events found.")
        
        # Get events for next 7 days
        print("\n📆 Fetching events for next 7 days...")
        start = datetime.utcnow()
        end = start + timedelta(days=7)
        week_events = get_events_in_range(service, start, end)
        print(f"✅ Found {len(week_events)} event(s) in the next 7 days")
        
        print("\n✅ All tests completed successfully!")
        
    except ImportError:
        print("\n❌ ERROR: Could not import database.supabase_db")
        print("Make sure you're running from the backend directory:")
        print("  cd backend")
        print("  python -m tools.calendar_fetch")
    except Exception as e:
        print(f"\n❌ ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()