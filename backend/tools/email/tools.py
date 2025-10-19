from ai_sdk import tool
from .email_fetcher import (
    create_credentials_from_token,
    get_gmail_service,
    parse_email_body,
    get_header_value,
    mail_fetch,
    get_unread_emails,
    get_emails_from_sender,
    search_emails
)
import database.supabase_db as sb
from datetime import datetime

# Hardcoded user ID for testing
USER_ID = "e6ac7c44-b6d3-465c-9d75-3d44611d0e6c"

"""
Email Tools for AI Agent
========================

This file follows the 3-layer pattern:
- Layer 1 (Core): Imported from .emails_fetched.py (e.g., get_unread_emails, search_emails)
- Layer 2 (Wrapper): execute functions (e.g., get_unread_emails_execute)
- Layer 3 (Tool): tool definitions (e.g., get_unread_emails_tool)

The wrapper functions (Layer 2) are responsible for:
1. Getting the user's ID (hardcoded for this example).
2. Fetching the user's Google token from the database (Supabase).
3. Creating the authenticated 'service' object.
4. Calling the core logic function (Layer 1) with that service.
"""

# Assuming 'tool' comes from your AI SDK, as per the context
# from ai_sdk import tool
# For this example, we'll create a placeholder decorator
def tool(name, description, parameters, execute):
    """A placeholder for your real 'tool' decorator or function."""
    # In a real system, this would register the tool
    print(f"Registering tool: {name}")
    # We can attach the metadata to the function for good measure
    execute._tool_metadata = {
        "name": name,
        "description": description,
        "parameters": parameters
    }
    return execute

# --- Imports ---

# Import database functions (as per context)
import database.supabase_db as sb

# Import Layer 1 (Core Functions) from your original file
# We assume this file is in the same directory (e.g., 'tools/')
from .email_fetcher import (
    get_gmail_service,
    get_unread_emails,
    get_emails_from_sender,
    search_emails
)

# --- User Context ---

# This ID is grabbed from the __main__ block of your emails_fetched.py
# In a real application, this would come from the user's session or request context.
USER_ID = "e6ac7c44-b6d3-465c-9d75-3d44611d0e6c"

# --- Helper Function ---

def _get_authenticated_service(user_id):
    """
    Internal helper to get token from DB and create a service.
    This encapsulates the common part of all Layer 2 wrappers.
    """
    user_context = sb.get_user_context(user_id)
    token_data = user_context.get("google_token")
    
    if not token_data:
        raise ConnectionError("User is not authenticated with Google.")
        
    service = get_gmail_service(token_data)
    return service

# =================================================================
# Tool 1: Get Unread Emails
# =================================================================

# --- Layer 2: Wrapper Function ---
def get_unread_emails_execute(max_results: int = 10):
    """
    AI-callable tool to get unread emails.
    Handles user authentication automatically.
    """
    try:
        # 1. Get user's token from DB and create service
        service = _get_authenticated_service(USER_ID)
        
        # 2. Call the core function (Layer 1)
        emails = get_unread_emails(service=service, max_results=max_results)
        return emails
    
    except Exception as e:
        print(f"Error in get_unread_emails_execute: {e}")
        return f"An error occurred while fetching unread emails: {e}"

# --- Layer 3: Tool Definition ---
get_unread_emails_tool = tool(
    name="get_unread_emails",
    description="Fetches a list of the user's most recent unread emails from their Gmail inbox.",
    parameters={
        "type": "object",
        "properties": {
            "max_results": {
                "type": "integer",
                "description": "The maximum number of unread emails to return.",
                "default": 10
            }
        },
        "required": []
    },
    execute=get_unread_emails_execute
)

# =================================================================
# Tool 2: Get Emails From Sender
# =================================================================

# --- Layer 2: Wrapper Function ---
def get_emails_from_sender_execute(sender_email: str, max_results: int = 10):
    """
    AI-callable tool to get emails from a specific sender.
    Handles user authentication automatically.
    """
    try:
        # 1. Get user's token from DB and create service
        service = _get_authenticated_service(USER_ID)
        
        # 2. Call the core function (Layer 1)
        emails = get_emails_from_sender(
            service=service, 
            sender_email=sender_email, 
            max_results=max_results
        )
        return emails
        
    except Exception as e:
        print(f"Error in get_emails_from_sender_execute: {e}")
        return f"An error occurred while fetching emails from {sender_email}: {e}"

# --- Layer 3: Tool Definition ---
get_emails_from_sender_tool = tool(
    name="get_emails_from_sender",
    description="Fetches a list of recent emails from a specific sender's email address.",
    parameters={
        "type": "object",
        "properties": {
            "sender_email": {
                "type": "string",
                "description": "The email address of the sender to search for (e.g., 'no-reply@google.com')."
            },
            "max_results": {
                "type": "integer",
                "description": "The maximum number of emails to return from this sender.",
                "default": 10
            }
        },
        "required": ["sender_email"]
    },
    execute=get_emails_from_sender_execute
)

# =================================================================
# Tool 3: Search Emails
# =================================================================

# --- Layer 2: Wrapper Function ---
def search_emails_execute(search_term: str, max_results: int = 10):
    """
    AI-callable tool to search emails by a keyword.
    Handles user authentication automatically.
    """
    try:
        # 1. Get user's token from DB and create service
        service = _get_authenticated_service(USER_ID)
        
        # 2. Call the core function (Layer 1)
        emails = search_emails(
            service=service, 
            search_term=search_term, 
            max_results=max_results
        )
        return emails
        
    except Exception as e:
        print(f"Error in search_emails_execute: {e}")
        return f"An error occurred while searching for emails with term '{search_term}': {e}"

# --- Layer 3: Tool Definition ---
search_emails_tool = tool(
    name="search_emails",
    description="Searches the user's emails (subject and body) for a specific keyword or search term.",
    parameters={
        "type": "object",
        "properties": {
            "search_term": {
                "type": "string",
                "description": "The keyword or term to search for in the email's subject or body (e.g., 'invoice', 'meeting link')."
            },
            "max_results": {
                "type": "integer",
                "description": "The maximum number of matching emails to return.",
                "default": 10
            }
        },
        "required": ["search_term"]
    },
    execute=search_emails_execute
)


# =================================================================
# (Optional) Stubbed Tools from Context
# =================================================================
# Your context mentioned send_email and mark_as_read.
# Since they aren't in emails_fetched.py, here is how you
# would add them following the same pattern.

# --- Layer 2: Wrapper Function (Example for send_email) ---
def send_email_execute(to: str, subject: str, body: str):
    """
    AI-callable tool to send an email.
    Handles user authentication automatically.
    """
    try:
        service = _get_authenticated_service(USER_ID)
        
        # You would import this from emails_fetched.py
        # from .emails_fetched import send_email 
        
        # 2. Call the (hypothetical) core function
        # result = send_email(service=service, to=to, subject=subject, body=body)
        # return result
        
        print(f"--- STUBBED: Sending email to {to} ---")
        return f"Successfully sent email to {to} with subject: {subject}"

    except Exception as e:
        print(f"Error in send_email_execute: {e}")
        return f"An error occurred while sending the email: {e}"

# --- Layer 3: Tool Definition (Example for send_email) ---
send_email_tool = tool(
    name="send_email",
    description="Sends a new email from the user's Gmail account.",
    parameters={
        "type": "object",
        "properties": {
            "to": {
                "type": "string",
                "description": "The recipient's email address (e.g., 'friend@example.com')."
            },
            "subject": {
                "type": "string",
                "description": "The subject line of the email."
            },
            "body": {
                "type": "string",
                "description": "The plain text content of the email body."
            }
        },
        "required": ["to", "subject", "body"]
    },
    execute=send_email_execute
)