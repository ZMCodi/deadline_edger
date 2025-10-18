from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()

import backend.database.supabase_db as sb

# sb.add_user(
#     user_id="eb42a4e4-ddcd-40f7-abaa-5e2837fcf451",
#     context={"role": "admin", "theme": "dark"},
#     preferences=["uni", "hackathons", "societies"],
#     calendar_url="https://example.com"
# )

# sb.add_task(
#     user_id="eb42a4e4-ddcd-40f7-abaa-5e2837fcf451",
#     type_="TODO",
#     context={
#         "title": "Do laundry",
#         "due_date": "2024-06-15",
#         "priority": "high",
#         "completed": False
#     },
#     period="1 minute"
# )

client = sb.sb
print(client.auth.sign_in_with_password({
    "email": "zaim.mohsin@gmail.com",
    "password": "password123"
}).session.access_token)

# print(sb.get_tasks("eb42a4e4-ddcd-40f7-abaa-5e2837fcf451"))
# print(sb.get_user_context("eb42a4e4-ddcd-40f7-abaa-5e2837fcf451"))

