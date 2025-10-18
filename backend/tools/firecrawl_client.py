import os
from typing import Optional
from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field
from firecrawl import FirecrawlApp
from dotenv import load_dotenv

load_dotenv()


class ScrapeInput(BaseModel):
    """Input schema for scraping a webpage"""
    url: str = Field(description="The URL of the webpage to scrape")
    only_main_content: bool = Field(default=True, description="Whether to extract only the main content")


def scrape_url(url: str, only_main_content: bool = True, api_key: Optional[str] = None) -> str:
    """
    Scrape a specific webpage using Firecrawl
    
    Args:
        url: The URL to scrape
        only_main_content: Whether to extract only main content (default: True)
        api_key: Firecrawl API key (optional, uses FIRECRAWL_API_KEY env var if not provided)
        
    Returns:
        Scraped content as markdown string
    """
    # Get API key
    key = api_key or os.getenv("FIRECRAWL_API_KEY")
    if not key:
        return "Error: FIRECRAWL_API_KEY not set. Please set the environment variable."
    
    try:
        # Initialize Firecrawl
        app = FirecrawlApp(api_key=key)
        
        # Scrape the URL
        params = {
            "formats": ["markdown"],
            "onlyMainContent": only_main_content,
        }
        
        result = app.scrape_url(url, params=params)
        
        # Extract content
        if isinstance(result, dict):
            if "markdown" in result:
                return result["markdown"]
            elif "content" in result:
                return result["content"]
            return str(result)
        
        return str(result)
        
    except Exception as e:
        return f"Error scraping {url}: {str(e)}"


   
def create_scrape_tool(api_key: Optional[str] = None) -> StructuredTool:
    """
    Create a LangChain-compatible web scraping tool
    
    Args:
        api_key: Firecrawl API key (optional, uses FIRECRAWL_API_KEY env var if not provided)
        
    Returns:
        StructuredTool for web scraping
        
    Example:
        >>> tool = create_scrape_tool()
        >>> result = tool.run({"url": "https://example.com"})
        >>> print(result)
    """
    def scrape_wrapper(url: str, only_main_content: bool = True) -> str:
        return scrape_url(url=url, only_main_content=only_main_content, api_key=api_key)
    
    return StructuredTool.from_function(
        func=scrape_wrapper,
        name="scrape_webpage",
        description=(
            "Scrape content from a specific webpage. "
            "Provide a URL to extract its content in markdown format. "
            "Useful for getting the full text content of a specific page."
        ),
        args_schema=ScrapeInput,
    )
