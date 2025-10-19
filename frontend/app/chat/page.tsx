'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { MessageCircleIcon, ArrowLeftIcon, ListTodo, Plus } from 'lucide-react'
import { useChat } from '@/contexts/ChatContext'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { ChatInput } from '@/components/chat/ChatInput'
import { TaskList } from '@/components/tasks/TaskList'
import { AddTaskDialog } from '@/components/tasks/AddTaskDialog'


export default function ChatPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { messages, isLoading, error, sendMessage, clearMessages } = useChat()
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0)
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

  const refreshTasks = () => setTaskRefreshTrigger(prev => prev + 1)


  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header
        title=""
        leftContent={
          <>
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
          </>
        }
        rightContent={
          <>
            <AddTaskDialog
              onTaskCreated={refreshTasks}
              trigger={
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              }
            />
            
            <Sheet>
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
              <Button variant="outline" size="sm" onClick={clearMessages}>
                Clear Chat
              </Button>
            )}
          </>
        }
      />

      {error && (
        <div className="border-b px-4 py-3">
          <div className="max-w-4xl mx-auto">
            <p className="text-gray-900 text-sm">{error}</p>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <MessageCircleIcon className="h-10 w-10 text-gray-300 mb-6" />
                <h3 className="text-lg font-light text-gray-900 mb-2">
                  Start a conversation
                </h3>
                <p className="text-sm text-gray-500 max-w-md">
                  Ask about tasks, calendar, or productivity
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <ChatInput onSendMessage={sendMessage} isLoading={isLoading} disabled={isLoading} />
        </div>
      </main>
    </div>
  )
}