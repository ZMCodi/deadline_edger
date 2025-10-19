'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircleIcon, ArrowLeftIcon } from 'lucide-react'
import { createTask, chatWithAgent } from '@/lib/api'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { ChatInput } from '@/components/chat/ChatInput'

import type { AgentResponse } from '@/lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  agentResponse?: AgentResponse
}

export default function ChatPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    // Scroll to bottom when new messages are added
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
        if (scrollElement) {
          scrollElement.scrollTop = scrollElement.scrollHeight
        }
      }
    }

    // Use setTimeout to ensure DOM has updated
    const timeoutId = setTimeout(scrollToBottom, 100)
    return () => clearTimeout(timeoutId)
  }, [messages])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

    setIsLoading(true)
    setError(null)

    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])

    try {
      // Call the agent API
      const agentResponse = await chatWithAgent(messageText)
      
      // Add agent response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: agentResponse.text,
        timestamp: new Date(),
        agentResponse
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
      console.error('Chat error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTask = async (task: any) => {
    try {
      await createTask(task)
      console.log('Task created successfully:', task.title)
    } catch (error) {
      console.error('Failed to create task:', error)
      throw error
    }
  }

  const clearMessages = () => {
    setMessages([])
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/')}
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <MessageCircleIcon className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  AI Assistant
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {messages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearMessages}
                >
                  Clear Chat
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>


      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-4xl mx-auto">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <MessageCircleIcon className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Start a conversation
                </h3>
                <p className="text-gray-600 max-w-md">
                  Ask me anything about managing your tasks, calendar, or getting things done!
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {messages.map((message) => (
                  <ChatMessage 
                    key={message.id} 
                    message={message} 
                    onCreateTask={handleCreateTask}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 bg-white border-t">
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            disabled={isLoading}
          />
        </div>
      </main>
    </div>
  )
}