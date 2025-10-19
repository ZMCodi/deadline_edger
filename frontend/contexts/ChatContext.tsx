'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { nanoid } from 'nanoid'
import { chatWithAgent, AgentResponse } from '@/lib/api'
import { taskCalendarService } from '@/lib/task-calendar-integration'
import { CalendarEvent } from '@/lib/calendar-service'

export interface AgentTask {
  context: {
    prompt: string
    priority: string
    url?: string
  }
  period: string
  type: 'EMAIL' | 'WEB' | 'TODO'
  title: string
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentResponse?: AgentResponse;
  calendarEvent?: CalendarEvent;
  showCalendar?: boolean;
}

interface ChatContextType {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  sendMessage: (message: string) => Promise<void>
  clearMessages: () => void
  onTaskSuggest?: (tasks: AgentTask[]) => void
  addCalendarEvent: (event: CalendarEvent) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export { ChatContext }

export function ChatProvider({ children, onTaskSuggest }: { children: ReactNode, onTaskSuggest?: (tasks: AgentTask[]) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return

    setIsLoading(true)
    setError(null)

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: nanoid(),
      role: 'user',
      content: message,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])

    try {
      // Call the agent API
      const agentResponse = await chatWithAgent(message)
      
      // Add agent response
      const assistantMessage: ChatMessage = {
        id: nanoid(),
        role: 'assistant',
        content: agentResponse.text,
        timestamp: new Date(),
        agentResponse
      }

      setMessages(prev => [...prev, assistantMessage])

      // Auto-suggest tasks if any were returned
      if (agentResponse.type_ === 'create_task' && agentResponse.tasks && onTaskSuggest) {
        onTaskSuggest(agentResponse.tasks)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
      console.error('Chat error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, onTaskSuggest])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  const addCalendarEvent = useCallback((event: CalendarEvent) => {
    const eventDate = event.start.dateTime || event.start.date;
    const dateString = eventDate ? new Date(eventDate).toLocaleString() : 'the specified date';

    const calendarMessage: ChatMessage = {
      id: nanoid(),
      role: 'assistant',
      content: `✅ Task "${event.summary}" has been added to your calendar for ${dateString}.`,
      timestamp: new Date(),
      calendarEvent: event,
      showCalendar: true
    }

    setMessages(prev => [...prev, calendarMessage])
  }, [])

  // Set up calendar service callback
  useEffect(() => {
    taskCalendarService.setCalendarUpdateCallback(addCalendarEvent)
  }, [addCalendarEvent])

  return (
    <ChatContext.Provider value={{
      messages,
      isLoading,
      error,
      sendMessage,
      clearMessages,
      onTaskSuggest,
      addCalendarEvent
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}