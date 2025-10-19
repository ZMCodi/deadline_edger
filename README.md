# Deadline Edger

**The Todo List on Steroids for High-Agency Procrastinators**

[![Home Page](/thumbnail.png)](https://youtu.be/BFaI1cI7j5E)

## 🚀 Overview

**Deadline Edger** is a dynamic, AI-powered schedule manager designed for those who thrive under pressure. If you're juggling university lectures, coursework deadlines, job applications, society meetings, leetcode study plans, and daily chores like taking showers (while working best at the last minute) this is your ultimate scheduling companion.

Unlike traditional todo lists that barely capture the complexity of modern life, Deadline Edger uses intelligent AI orchestration to continuously monitor your commitments, fetch updates from multiple sources, and dynamically reschedule your life to maximize utility while keeping you *just barely* on track.

### 🎯 Built For

- **High-agency procrastinators** who want to do everything last minute (but successfully)
- **Overwhelmed students** managing coursework, applications, and life
- **Busy professionals** tracking job boards, emails, and multiple deadlines
- **Anyone** who needs a smarter way to manage time-sensitive commitments


## ✨ Key Features

### 🧠 Intelligent AI Agent Orchestration
- **Context-aware scheduling** using user preferences, habits, and chat history
- **Proactive task management** that fetches and schedules tasks automatically
- **Priority-based optimization** that reschedules dynamically based on urgency
- Powered by **AI SDK** with **OpenRouter** for flexible LLM selection

### 🌐 Multi-Source Data Integration
- **📧 Email Monitoring**: Gmail API integration to track coursework deadlines and application updates
- **🕸️ Web Scraping**: Firecrawl integration for monitoring job boards, announcement pages, and more
- **📅 Calendar Sync**: Full Google Calendar integration for scheduling and rescheduling
- **✅ Manual Tasks**: Add recurring chores like laundry, workouts, and personal commitments

### 🔄 Dynamic Task Scheduling
- Tasks run at **user-defined intervals** (hourly, daily, weekly)
- Agent automatically **fetches new data** from external sources
- **Smart conflict resolution** and capacity analysis
- **Realistic time buffers** (20-30% added to estimates)
- Prevents overcommitment with burnout detection

### 💬 Conversational Interface
- Chat with your schedule to ask questions and get advice
- Natural language task creation ("Check job board daily")
- Get insights on whether you can take on new commitments
- Receive personalized scheduling recommendations

### 📊 User-Centric Context
- Learns from your preferences and behavior patterns
- Tracks work capacity (max 4-6 hours deep work/day)
- Considers energy levels and realistic productivity
- Stores conversation history for contextual decisions


## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│                   Modern UI with Chat Interface              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ REST API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI + Python)                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           AI Agent (AI SDK + OpenRouter)             │   │
│  │  • Task Classification  • Schedule Optimization      │   │
│  │  • Tool Orchestration  • Context Management          │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│  ┌──────────────────┴───────────────────────────────────┐   │
│  │                  Tool Layer                           │   │
│  │  📧 Gmail API  │  🕸️ Firecrawl  │  📅 Calendar API │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Database (Supabase)  │
              │  • User Context       │
              │  • Tasks & Schedule   │
              │  • Chat History       │
              └──────────────────────┘
```



## 🛠️ Tech Stack

### Backend
| Component | Technology |
|-----------|-----------|
| Framework | **FastAPI** - High-performance async Python API |
| AI Orchestration | **AI SDK (Python)** - Agent framework with tool calling |
| LLM Provider | **OpenRouter** - Flexible model selection |
| Web Scraping | **Firecrawl** - Smart webpage content extraction |
| Email Integration | **Gmail API** - Email monitoring and fetching |
| Calendar Integration | **Google Calendar API** - Event management |
| Database | **Supabase** - PostgreSQL with real-time capabilities |

### Frontend
| Component | Technology |
|-----------|-----------|
| Framework | **Next.js** - React framework with SSR |
| UI/UX | Modern, responsive design with chat interface |

### Infrastructure
- **OAuth 2.0** for Google authentication
- **Cron jobs** for scheduled task execution
- **Environment-based configuration** with dotenv


## 📂 Project Structure

```
deadline_edger/
├── backend/
│   ├── agent.py                 # Main AI agent logic
│   ├── fastAPI.py               # FastAPI server and endpoints
│   ├── models.py                # Pydantic models for API
│   ├── database/
│   │   └── supabase_db.py       # Database operations
│   └── tools/
│       ├── firecrawl_client.py  # Web scraping tool
│       ├── calendar/            # Google Calendar tools
│       │   ├── get_events.py
│       │   ├── create_event.py
│       │   └── ...
│       └── email/               # Gmail integration
│           ├── tools.py
│           └── __init__.py
├── frontend/                    # Next.js frontend
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment variables template
└── README.md                    # This file
```


## 💡 Usage Examples

### Creating Recurring Tasks

**Chat with the agent:**
```
"Check the company job board daily and add any new openings to my schedule"
```

The agent will:
1. Create a WEB task that runs daily
2. Scrape the job board URL
3. Add new positions to your calendar with appropriate time slots

### Email-Based Task Tracking

```
"Monitor my university email for assignment deadlines"
```

The agent will:
1. Create an EMAIL task
2. Scan inbox for deadline keywords
3. Automatically schedule work sessions before due dates

### Manual Task Addition

```
"I need to do laundry twice a week and work out 4 times a week"
```

The agent will:
1. Create TODO tasks with appropriate frequency
2. Find optimal time slots in your schedule
3. Avoid conflicts with existing commitments

### Schedule Optimization

```
"I have 3 assignments due next week. Help me schedule them realistically."
```

The agent will:
1. Review your current calendar
2. Analyze your work capacity
3. Create a realistic schedule with buffers
4. Warn if you're overcommitting


## 🔧 API Endpoints

### Task Management
- `POST /api/task/create` - Create a new recurring task
- `GET /api/tasks` - Get all user tasks

### User Management
- `POST /api/users/onboard` - Onboard new user with preferences
- `GET /api/users/onboard` - Check onboarding status
- `POST /api/users/token` - Add Google OAuth token

### Agent Interaction
- `POST /api/agent/chat` - Chat with the scheduling agent

### Cron Jobs
- `POST /api/cron/run-tasks` - Execute scheduled tasks (called by cron)


## 🎯 How It Works

### Task Lifecycle

1. **User Creates Task**
   - Specifies type (WEB, EMAIL, TODO)
   - Sets recurrence interval (1 hour, 1 day, 1 week, etc.)
   - Provides context (URL, search terms, priority)

2. **Scheduled Execution**
   - Cron job triggers task at specified interval
   - Backend fetches tasks due to run

3. **Agent Processing**
   - Retrieves user context (preferences, chat history)
   - Fetches data from external sources (email, web, etc.)
   - Analyzes current calendar for conflicts
   - Determines optimal scheduling strategy

4. **Calendar Update**
   - Creates/updates Google Calendar events
   - Applies realistic time buffers
   - Ensures no overcommitment

5. **User Notification**
   - Returns summary of actions taken
   - Warns about conflicts or capacity issues


## 🌟 Design Philosophy

### Realistic Scheduling
Traditional todo apps assume you'll work 12 hours a day with perfect focus. Deadline Edger understands:
- You have limited energy (4-6 productive hours/day)
- Tasks take longer than estimated (20-30% buffer added)
- You need breaks between deep work sessions
- Procrastination is a feature, not a bug

### Proactive Intelligence
Instead of reactive task management:
- **Monitors** external sources automatically
- **Anticipates** upcoming deadlines
- **Adapts** to changing priorities
- **Warns** before conflicts arise

### High Agency Support
For people who want to do everything:
- Maximizes task throughput
- Schedules work as late as possible (safely)
- Prevents catastrophic overcommitment
- Enables informed decision-making


## 🚧 Challenges We Overcame

### Google API Integration
Gmail and Google Calendar APIs lack comprehensive documentation. OAuth2 flow for desktop applications required extensive debugging and experimentation with token refresh mechanisms.

### Model Selection
Finding the balance between speed and context window size was crucial. We needed a model that could:
- Process large amounts of context (user data, calendar, emails)
- Respond quickly for good UX
- Make intelligent scheduling decisions
- Stay within budget constraints

### Context Management
The agent needs to consider multiple data sources simultaneously:
- Current calendar state
- User preferences and habits
- Recent chat conversations
- External data (emails, web content)
- Task priorities and dependencies

We solved this by structuring prompts with clear sections and using JSON-based tool responses.


## 📞 Contact & Links

- **Project Repository**: [GitHub](https://github.com/yourusername/deadline_edger)
- **Devpost**: [Deadline Edger on Devpost](https://devpost.com/software/deadline-edger)
- **Demo Video**: [Watch Demo](#)
- **Documentation**: [Full Docs](#)
