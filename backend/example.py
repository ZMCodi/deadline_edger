import os
from dotenv import load_dotenv
from ai_sdk import tool, generate_text, openai
from tools.firecrawl_client import scrape_url

load_dotenv()


def scrape_webpage_execute(url: str, only_main_content: bool = True) -> str:
    """Scrape a webpage and return its content"""
    print(f"🔧 Scraping: {url}")
    return scrape_url(url, only_main_content)


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
    """
    Create an AI agent with Firecrawl scraping capability
    
    Required environment variables:
        - FIRECRAWL_API_KEY: Your Firecrawl API key
        - OPENROUTER_API_KEY: Your OpenRouter API key
    
    Returns:
        Configured model provider
    """
    if not os.getenv("FIRECRAWL_API_KEY"):
        raise ValueError("FIRECRAWL_API_KEY not found in environment variables")
    if not os.getenv("OPENROUTER_API_KEY"):
        raise ValueError("OPENROUTER_API_KEY not found in environment variables")
    
    # Set OpenRouter as default for all OpenAI calls
    os.environ["OPENAI_BASE_URL"] = "https://openrouter.ai/api/v1"
    os.environ["OPENAI_API_KEY"] = os.getenv("OPENROUTER_API_KEY")
    
    return openai


def chat_with_agent(provider, user_message: str) -> str:
    """
    Send a message to the AI agent using AI SDK
    
    Args:
        provider: The AI model provider (openai function from ai_sdk)
        user_message: The user's message
        
    Returns:
        The agent's response
    """
    system_prompt = """You are a helpful AI assistant with powerful web scraping capabilities.

Your capabilities:
- You have access to a scrape_webpage tool that can extract content from any URL
- You can analyze and summarize web content
- You can extract specific information from websites

Important instructions:
- When users ask you to check, visit, analyze, or get information from a URL, ALWAYS use the scrape_webpage function first
- After scraping, provide a clear, well-structured analysis of the content
- If asked about specific information on a page, scrape it first, then extract the relevant details
- You cannot access URLs directly - you MUST use the scraping tool
- Be thorough in your analysis and provide helpful insights
- If the content is long, summarize the key points clearly

When responding:
- Start by acknowledging what you're doing (e.g., "I'll scrape that page for you...")
- After getting the content, provide a clear and organized response
- Format your responses in a readable way with bullet points or sections when appropriate"""
    

    os.environ["OPENAI_BASE_URL"] = "https://openrouter.ai/api/v1"
    os.environ["OPENAI_API_KEY"] = os.getenv("OPENROUTER_API_KEY")
    

    model = openai(os.getenv("DEFAULT_MODEL"))
    
    result = generate_text(
        model=model,
        prompt=user_message,
        system=system_prompt,
        tools=[scrape_webpage_tool],
    )
    
    return result.text


def main():
    """Run the agent interactively"""
    print("=" * 60)
    print("AI Agent with Firecrawl Scraping Tool (Python AI SDK)")
    print("=" * 60)
    
    try:
        provider = create_agent()
        

        while True:
            try:
                user_input = input("You: ").strip()
                
                if user_input.lower() in ['exit', 'quit', 'q']:
                    print("Goodbye!")
                    break
                
                if not user_input:
                    continue
                
                print("\nAgent thinking...")
                response = chat_with_agent(provider, user_input)
                print(f"\nAgent: {response}\n")
                
            except KeyboardInterrupt:
                print("\n\nGoodbye!")
                break
            except Exception as e:
                print(f"\nError: {str(e)}\n")
                import traceback
                traceback.print_exc()
    
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
