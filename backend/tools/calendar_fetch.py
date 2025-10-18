import datetime
import os.path
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build


def main():
    global calendar_service
    SCOPES = ['https://www.googleapis.com/auth/calendar']
    creds = None

    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)

    # If 'creds' is None or invalid, you'd re-run the full auth flow.
    # We'll assume 'creds' is valid for these examples.

    calendar_service = build('calendar', 'v3', credentials=creds)

def addEvents():
    global created_event
    # Define the event details
    event_body = {
    'summary': 'Team Meeting',
    'location': 'Video Call',
    'description': 'Discuss project milestones.',
    'start': {
        'dateTime': '2025-10-30T10:00:00',
        'timeZone': 'America/Los_Angeles',
    },
    'end': {
        'dateTime': '2025-10-30T11:00:00',
        'timeZone': 'America/Los_Angeles',
    },
    'attendees': [
        {'email': 'friend1@example.com'},
        {'email': 'friend2@example.com'},
    ],
    }

    # Create the event
    created_event = calendar_service.events().insert(
        calendarId='primary', 
        body=event_body
    ).execute()

    print(f"Event created!")
    print(f"Summary: {created_event['summary']}")
    print(f"ID: {created_event['id']}")
    print(f"Link: {created_event['htmlLink']}")

def fetchEvents():
    # 'Z' indicates UTC time
    now = datetime.datetime.utcnow().isoformat() + 'Z' 

    print('Getting the next 5 events:')
    events_result = calendar_service.events().list(
        calendarId='primary', 
        timeMin=now,
        maxResults=5, 
        singleEvents=True,
        orderBy='startTime'
    ).execute()

    events = events_result.get('items', [])

    if not events:
        print('No upcoming events found.')
    else:
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            print(f"{start} - {event['summary']} (ID: {event['id']})")

def editEvent():
    # Use an 'eventId' from your search results (or the one you just created)
    event_id_to_edit = created_event['id'] 

    try:
        # 1. Get the event
        event_to_update = calendar_service.events().get(
            calendarId='primary', 
            eventId=event_id_to_edit
        ).execute()

        # 2. Modify the event
        event_to_update['summary'] = 'UPDATED: Team Meeting'
        event_to_update['location'] = 'Room 202'

        # 3. Update the event
        updated_event = calendar_service.events().update(
            calendarId='primary',
            eventId=event_to_update['id'],
            body=event_to_update
        ).execute()
        
        print(f"Event updated! New summary: {updated_event['summary']}")

    except Exception as e:
        print(f"Error updating event: {e}")


def deleteEvent():
    # Use the 'eventId' of the event you want to delete
    event_id_to_delete = created_event['id']

    try:
        calendar_service.events().delete(
            calendarId='primary', 
            eventId=event_id_to_delete
        ).execute()
        
        print(f"Event with ID {event_id_to_delete} has been deleted.")

    except Exception as e:
        print(f"Error deleting event: {e}")