'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { chatWithAgent } from '@/lib/api'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  agentResponse?: {
    type_: 'create_task' | 'run_task' | 'reshuffle_calendar' | 'no_task'
    text: string
    tasks?: Array<{
      context: {
        prompt: string
        priority: string
        url?: string
      }
      period: string
      type_: 'EMAIL' | 'WEB' | 'TODO'
      title: string
    }>
  }
}

interface ChatContextType {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  sendMessage: (message: string) => Promise<void>
  clearMessages: () => void
  onTaskSuggest?: (tasks: any[]) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children, onTaskSuggest }: { children: ReactNode, onTaskSuggest?: (tasks: any[]) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return

    setIsLoading(true)
    setError(null)

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
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
        id: (Date.now() + 1).toString(),
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

  return (
    <ChatContext.Provider value={{
      messages,
      isLoading,
      error,
      sendMessage,
      clearMessages,
      onTaskSuggest
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