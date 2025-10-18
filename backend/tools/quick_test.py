from dotenv import load_dotenv
from firecrawl_client import scrape_url

load_dotenv()

print("Scraping https://app.the-trackr.com/uk-technology/summer-internships...\n")
result = scrape_url("https://app.the-trackr.com/uk-technology/summer-internships")
print(result)

