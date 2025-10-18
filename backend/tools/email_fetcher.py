import ezgmail

# dates must be in yyyy/mm/dd format
def mail_fetch(start_date=False):
    all_emails_list = []

    if start_date:
        threads = ezgmail.search(f"after:{start_date}", maxResults=10)
    else:
        threads = ezgmail.search('in:inbox', maxResults=10)
        
    if not threads:
        print("No emails found bhai")
    else:
        print(f"Displaying the {len(threads)} most recent sent emails:\n")
        
        for i, thread in enumerate(threads):
            # messages are in chronological order (oldest to newest)
            message = thread.messages[0] 
            
            email_data = {
                "Email_Number": i + 1,
                "To": message.recipient,
                "Subject": message.subject,
                "Snippet": message.snippet,
                "Body": message.body,
                "Sender": message.sender, # Added sender
                "Timestamp": str(message.timestamp) # Added timestamp
            }
            
            all_emails_list.append(email_data)
    
    return all_emails_list



if __name__ == "__main__":
    emails = mail_fetch()
    print(emails)