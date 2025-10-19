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
  placeholder = "Create commitments, manage calendar, or get help...",
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
    } catch {
      // If there's an error, restore the message
      setMessage(messageToSend)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as FormEvent)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex gap-3', className)}>
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        className="flex-1 min-h-[48px] max-h-[120px] resize-none rounded-xl border-gray-200 focus:border-gray-400 focus:ring-0"
        rows={1}
      />
      <Button
        type="submit"
        size="icon"
        disabled={!message.trim() || disabled || isLoading}
        variant="ghost"
        className="shrink-0 h-12 w-12 rounded-xl hover:bg-gray-100"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
        ) : (
          <Send className="h-5 w-5 text-gray-600" />
        )}
      </Button>
    </form>
  )
}