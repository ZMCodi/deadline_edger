"""
Gmail API - Direct implementation without EZGmail
=================================================
This version works directly with your frontend OAuth tokens
No need for credentials-sheets.json or token-gmail.json

Prerequisites:
1. Install: pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
2. Store user's OAuth token in your database (Supabase)
3. Run from: backend/ directory using: python -m tools.email_fetcher
"""

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from datetime import datetime
import base64
from email.mime.text import MIMEText
import database.supabase_db as sb
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
    if expiry_timestamp and len(str(expiry_timestamp)) > 10:
        expiry_timestamp = int(expiry_timestamp) / 1000
    
    # Create credentials object
    creds = Credentials(
        token=token_data.get('access_token'),
        refresh_token=token_data.get('refresh_token') or None,
        token_uri='https://oauth2.googleapis.com/token',
        client_id=None,
        client_secret=None,
        scopes=token_data.get('scope', '').split() if isinstance(token_data.get('scope'), str) else token_data.get('scope', [])
    )
    
    return creds

def get_gmail_service(token_data):
    """
    Get authenticated Gmail service from token data
    
    Args:
        token_data: Dict from frontend OAuth or database
    
    Returns:
        Gmail API service object
    """
    creds = create_credentials_from_token(token_data)
    return build('gmail', 'v1', credentials=creds)

def parse_email_body(payload):
    """Extract email body from message payload"""
    body = ""
    
    try:
        if 'parts' in payload:
            # Multi-part message
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain':
                    if 'data' in part['body']:
                        body = base64.urlsafe_b64decode(
                            part['body']['data']
                        ).decode('utf-8', errors='ignore')
                        break
                elif part['mimeType'] == 'text/html' and not body:
                    if 'data' in part['body']:
                        body = base64.urlsafe_b64decode(
                            part['body']['data']
                        ).decode('utf-8', errors='ignore')
                elif 'parts' in part:
                    # Nested parts
                    for nested_part in part['parts']:
                        if nested_part['mimeType'] == 'text/plain':
                            if 'data' in nested_part['body']:
                                body = base64.urlsafe_b64decode(
                                    nested_part['body']['data']
                                ).decode('utf-8', errors='ignore')
                                break
        else:
            # Simple message
            if 'body' in payload and 'data' in payload['body']:
                body = base64.urlsafe_b64decode(
                    payload['body']['data']
                ).decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error parsing body: {e}")
    
    return body

def get_header_value(headers, name):
    """Get specific header value from headers list"""
    for header in headers:
        if header['name'].lower() == name.lower():
            return header['value']
    return ''

def mail_fetch(service=None, token_data=None, start_date=None, max_results=10, query='in:inbox'):
    """
    Fetch emails from Gmail
    
    Args:
        service: Gmail service object (if None, will create from token_data)
        token_data: User's OAuth token dict (required if service is None)
        start_date: Filter emails after this date (format: 'yyyy/mm/dd')
        max_results: Maximum number of emails to fetch
        query: Gmail search query (default: 'in:inbox')
    
    Returns:
        List of email dictionaries matching EZGmail format
    """
    if service is None:
        if token_data is None:
            raise ValueError("Either service or token_data must be provided")
        service = get_gmail_service(token_data)
    
    try:
        all_emails_list = []
        
        # Build query
        if start_date:
            query = f"{query} after:{start_date}"
        
        print(f"Searching Gmail with query: '{query}'")
        
        # Get message IDs
        results = service.users().messages().list(
            userId='me',
            q=query,
            maxResults=max_results
        ).execute()
        
        messages = results.get('messages', [])
        
        if not messages:
            print("No emails found bhai")
            return []
        
        print(f"Displaying the {len(messages)} most recent emails:\n")
        
        # Fetch full message details for each
        for i, msg in enumerate(messages):
            try:
                message = service.users().messages().get(
                    userId='me',
                    id=msg['id'],
                    format='full'
                ).execute()
                
                headers = message['payload']['headers']
                
                # Extract email data in format
                email_data = {
                    "email_number": i + 1,
                    "id": message['id'],
                    "thread_id": message['threadId'],
                    "sender": get_header_value(headers, 'From'),
                    "to": get_header_value(headers, 'To'),
                    "subject": get_header_value(headers, 'Subject'),
                    "date": get_header_value(headers, 'Date'),
                    "snippet": message.get('snippet', ''),
                    "body": parse_email_body(message['payload']),
                    "labels": message.get('labelIds', []),
                    "is_unread": "UNREAD" in message.get('labelIds', [])
                }
                
                all_emails_list.append(email_data)
                
            except Exception as e:
                print(f"Error fetching message {msg['id']}: {e}")
                continue
        
        return all_emails_list
        
    except Exception as e:
        print(f"Error in mail_fetch: {e}")
        import traceback
        traceback.print_exc()
        return []

def get_unread_emails(service=None, token_data=None, max_results=10):
    """Get only unread emails"""
    return mail_fetch(
        service=service,
        token_data=token_data,
        max_results=max_results,
        query='is:unread'
    )

def get_emails_from_sender(service=None, token_data=None, sender_email='', max_results=10):
    """Get emails from specific sender"""
    return mail_fetch(
        service=service,
        token_data=token_data,
        max_results=max_results,
        query=f'from:{sender_email}'
    )

def search_emails(service=None, token_data=None, search_term='', max_results=10):
    """Search emails by keyword"""
    return mail_fetch(
        service=service,
        token_data=token_data,
        max_results=max_results,
        query=f'subject:{search_term} OR body:{search_term}'
    )

def mark_as_read(service, message_id):
    """Mark an email as read"""
    try:
        service.users().messages().modify(
            userId='me',
            id=message_id,
            body={'removeLabelIds': ['UNREAD']}
        ).execute()
        return True
    except Exception as e:
        print(f"Error marking message as read: {e}")
        return False

def emails_to_json_string(emails, pretty=True):
    """
    Convert emails list to JSON string
    
    Args:
        emails: List of email dictionaries
        pretty: If True, format with indentation (default: True)
    
    Returns:
        JSON string
    """
    import json
    if pretty:
        return json.dumps(emails, indent=2, ensure_ascii=False)
    else:
        return json.dumps(emails, ensure_ascii=False)

# Example usage with your database
if __name__ == "_main_":
    try:
        # Get user's token from database
        user_id = "e6ac7c44-b6d3-465c-9d75-3d44611d0e6c"
        print(f"Fetching token for user: {user_id}")
        
        user_context = sb.get_user_context(user_id)
        token_data = user_context.get("google_token")
        
        if not token_data:
            print("No token found")
            exit(1)
        
        print("Token found!")
        print(f"Token has access_token: {bool(token_data.get('access_token'))}")
        print(f"Token has refresh_token: {bool(token_data.get('refresh_token'))}")
        
        # Test: Fetch recent emails
        print("\nFetching recent emails from inbox...")
        emails = mail_fetch(token_data=token_data, max_results=5)
        
        if emails:
            print(f"\nSuccessfully fetched {len(emails)} email(s)")
            
            # Print as JSON
            print("\n" + "="*80)
            print("📋 EMAILS IN JSON FORMAT:")
            print("="*80)
            print(emails_to_json_string(emails))
            print("="*80)
            
            # Also print a summary
            print("\n📊 SUMMARY:")
            for email in emails:
                print(f"  • From: {email['sender']}")
                print(f"    Subject: {email['subject']}")
                print(f"    Date: {email['date']}")
                print(f"    Unread: {'Yes' if email['is_unread'] else 'No'}")
                print()
        else:
            print("No emails found or error occurred.")
        
        # Test: Get unread emails as JSON
        print("\n📬 Fetching unread emails...")
        unread = get_unread_emails(token_data=token_data, max_results=5)
        
        if unread:
            print(f"✅ Found {len(unread)} unread email(s)")
        else:
            print("No unread emails found")
        
        print("\n✅ All tests completed successfully!")
        
    except Exception as e:
        print(f"\nERROR: {type(e)._name_}: {e}")
        import traceback
        traceback.print_exc()
