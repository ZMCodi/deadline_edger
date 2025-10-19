'use client'

import { useState, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>
  disabled?: boolean
  isLoading?: boolean
  placeholder?: string
  className?: string
}

export function ChatInput({ 
  onSendMessage, 
  disabled = false, 
  isLoading = false,
  placeholder = "Ask me to create tasks, manage your calendar, or help with productivity...",
  className 
}: ChatInputProps) {
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() || disabled || isLoading) {
      return
    }

    const messageToSend = message.trim()
    setMessage('') // Clear input immediately
    
    try {
      await onSendMessage(messageToSend)
    } catch (error) {
      // If there's an error, restore the message
      setMessage(messageToSend)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex gap-2', className)}>
      <div className="flex-1 relative">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className="min-h-[60px] max-h-[120px] resize-none pr-12"
          rows={2}
        />
      </div>
      <Button
        type="submit"
        size="icon"
        disabled={!message.trim() || disabled || isLoading}
        className="shrink-0 h-[60px] w-[60px]"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  )
}