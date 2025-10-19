'use client'

import { cn } from '@/lib/utils'
import { User, Bot } from 'lucide-react'
import type { AgentResponse } from '@/lib/api'
import { CalendarEvent } from '@/lib/calendar-service'

interface ChatMessageProps {
  message: {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    agentResponse?: AgentResponse
    calendarEvent?: CalendarEvent
    showCalendar?: boolean
  }
  className?: string
}

export function ChatMessage({ message, className }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'flex w-full gap-3 py-4',
        isUser ? 'justify-end' : 'justify-start',
        className
      )}
    >
      {!isUser && (
        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
          <Bot className="h-4 w-4 text-gray-600" />
        </div>
      )}
      
      <div className="flex flex-col max-w-[70%] min-w-0">
        <div
          className={cn(
            'px-4 py-3 rounded-2xl',
            isUser
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-900'
          )}
        >
          <div className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </div>
        </div>
        <div className={cn(
          'text-xs mt-1.5 px-2',
          isUser ? 'text-right text-gray-400' : 'text-left text-gray-400'
        )}>
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
      
      {isUser && (
        <div className="h-8 w-8 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
          <User className="h-4 w-4 text-white" />
        </div>
      )}
    </div>
  )
}