'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { MessageCircleIcon, ArrowLeftIcon, ListTodo, Plus } from 'lucide-react'
import { createTask, chatWithAgent } from '@/lib/api'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { ChatInput } from '@/components/chat/ChatInput'
import { TaskList } from '@/components/tasks/TaskList'
import { AddTaskDialog } from '@/components/tasks/AddTaskDialog'

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
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0)
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false)
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

    console.log('🚀 [Chat] Sending message:', messageText)
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
      console.log('📡 [Chat] Calling chatWithAgent API...')
      const agentResponse = await chatWithAgent(messageText)
      
      console.log('✅ [Chat] Agent response received:', {
        type: agentResponse.type_,
        text: agentResponse.text,
        hasTasks: !!agentResponse.tasks,
        taskCount: agentResponse.tasks?.length || 0,
        tasks: agentResponse.tasks
      })
      
      // Add agent response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: agentResponse.text,
        timestamp: new Date(),
        agentResponse
      }

      setMessages(prev => [...prev, assistantMessage])
      
      // Log if we should show task suggestions
      if (agentResponse.type_ === 'create_task' && agentResponse.tasks) {
        console.log('🎯 [Chat] Task suggestions detected, will show inline creation UI')
      }
    } catch (err) {
      console.error('❌ [Chat] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsLoading(false)
      console.log('🏁 [Chat] Message handling complete')
    }
  }

  const handleCreateTask = async (task: any) => {
    console.log('🔨 [Task] Creating task:', {
      title: task.title,
      type: task.type,
      priority: task.context?.priority,
      period: task.period,
      fullTask: task
    })
    
    try {
      await createTask(task)
      console.log('✅ [Task] Created successfully:', task.title)
      
      // Refresh task list
      setTaskRefreshTrigger(prev => prev + 1)
      console.log('🔄 [Task] Task list refresh triggered')
      
      // Open the tasks sidebar
      setIsTaskSheetOpen(true)
      console.log('📋 [Task] Opening tasks sidebar')
    } catch (error) {
      console.error('❌ [Task] Failed to create:', error)
      throw error
    }
  }

  const handleTaskCreated = () => {
    // Refresh task list when a task is created via the dialog
    setTaskRefreshTrigger(prev => prev + 1)
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
            </div>
            <div className="flex items-center space-x-2">
              <AddTaskDialog
                onTaskCreated={handleTaskCreated}
                trigger={
                  <Button variant="ghost" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                }
              />
              
              <Sheet open={isTaskSheetOpen} onOpenChange={setIsTaskSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <ListTodo className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[400px] p-0">
                  <SheetTitle className="sr-only">Task Management</SheetTitle>
                  <TaskList refreshTrigger={taskRefreshTrigger} />
                </SheetContent>
              </Sheet>

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