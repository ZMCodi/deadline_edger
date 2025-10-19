'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { User, Bot } from 'lucide-react'
import { TaskSuggestion } from './TaskSuggestion'
import type { AgentResponse } from '@/lib/api'

interface ChatMessageProps {
  message: {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    agentResponse?: AgentResponse
  }
  onCreateTask?: (task: any) => Promise<void>
  className?: string
}

export function ChatMessage({ message, onCreateTask, className }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const hasTaskSuggestions = !isUser && 
    message.agentResponse?.type_ === 'create_task' && 
    message.agentResponse?.tasks && 
    message.agentResponse.tasks.length > 0

  return (
    <div
      className={cn(
        'flex w-full gap-2 py-2',
        isUser ? 'justify-end' : 'justify-start',
        className
      )}
    >
      {!isUser && (
        <Avatar className="h-7 w-7 shrink-0 mt-1">
          <AvatarImage src="/ai-avatar.png" alt="AI Assistant" />
          <AvatarFallback>
            <Bot className="h-3 w-3" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className="flex flex-col max-w-[80%] min-w-0 gap-2">
        <div className="flex flex-col">
          <Card
            className={cn(
              'px-3 py-2',
              isUser
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white border-gray-200'
            )}
          >
            <div className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </div>
          </Card>
          <div className={cn(
            'text-xs mt-1 px-1',
            isUser ? 'text-right text-gray-500' : 'text-left text-gray-500'
          )}>
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>

        {/* Inline Task Suggestions */}
        {hasTaskSuggestions && onCreateTask && (
          <TaskSuggestion
            tasks={message.agentResponse!.tasks!}
            onCreateTask={onCreateTask}
            onDismiss={() => {}} // No dismiss for inline suggestions
            className="mt-1"
          />
        )}
      </div>
      
      {isUser && (
        <Avatar className="h-7 w-7 shrink-0 mt-1">
          <AvatarImage src="/user-avatar.png" alt="You" />
          <AvatarFallback>
            <User className="h-3 w-3" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}