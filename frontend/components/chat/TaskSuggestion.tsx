'use client'

import { useState, useContext } from 'react'
import { Button } from '@/components/ui/button'
import { X, Check, Loader2, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { taskCalendarService } from '@/lib/task-calendar-integration'
import { ChatContext } from '@/contexts/ChatContext'

interface Task {
  context: {
    prompt: string
    priority: string
    url?: string
  }
  period: string
  type_: 'EMAIL' | 'WEB' | 'TODO'
  title: string
}

interface TaskSuggestionProps {
  tasks: Task[]
  onCreateTask: (task: Task) => Promise<void>
  onDismiss: () => void
  className?: string
  enableCalendar?: boolean
  onCalendarEvent?: (event: unknown) => void
}

export function TaskSuggestion({ 
  tasks, 
  onCreateTask, 
  onDismiss, 
  className,
  enableCalendar = true,
  onCalendarEvent
}: TaskSuggestionProps) {
  const [creatingTasks, setCreatingTasks] = useState<Set<number>>(new Set())
  const [createdTasks, setCreatedTasks] = useState<Set<number>>(new Set())
  const chatContext = useContext(ChatContext)

  if (tasks.length === 0) {
    return null
  }

  const handleCreateTask = async (task: Task, index: number) => {
    if (creatingTasks.has(index) || createdTasks.has(index)) {
      return
    }

    setCreatingTasks(prev => new Set(prev).add(index))
    
    try {
      if (enableCalendar) {
        // Use integrated task-calendar service
        try {
          const result = await taskCalendarService.createTaskWithCalendar(task)
          
          // Show calendar update in chat if event was created
          if (result.calendarEvent) {
            if (chatContext?.addCalendarEvent) {
              chatContext.addCalendarEvent(result.calendarEvent)
            } else if (onCalendarEvent) {
              onCalendarEvent(result.calendarEvent)
            }
          } else {
            // Fallback: show mock calendar event if real one failed
            const fallbackEvent = {
              id: `task-${Date.now()}`,
              summary: task.title,
              start: {
                dateTime: new Date(Date.now() + 3600000).toISOString()
              },
              end: {
                dateTime: new Date(Date.now() + 7200000).toISOString()
              },
              description: `Task: ${task.context.prompt}`
            }
            
            if (chatContext?.addCalendarEvent) {
              chatContext.addCalendarEvent(fallbackEvent)
            }
          }
        } catch (error) {
          console.error('Calendar integration failed, showing fallback UI:', error)
          
          // Create the task anyway
          await onCreateTask(task)
          
          // Show fallback calendar UI
          const fallbackEvent = {
            id: `task-${Date.now()}`,
            summary: task.title,
            start: {
              dateTime: new Date(Date.now() + 3600000).toISOString()
            },
            end: {
              dateTime: new Date(Date.now() + 7200000).toISOString()
            },
            description: `Task: ${task.context.prompt}`
          }
          
          if (chatContext?.addCalendarEvent) {
            chatContext.addCalendarEvent(fallbackEvent)
          }
        }
      } else {
        // Just create the task without calendar
        await onCreateTask(task)
      }
      
      setCreatedTasks(prev => new Set(prev).add(index))
    } catch (error) {
      console.error('Failed to create task:', error)
    } finally {
      setCreatingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(index)
        return newSet
      })
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'EMAIL':
        return 'Email'
      case 'WEB':
        return 'Web'
      case 'TODO':
        return 'Todo'
      default:
        return type
    }
  }

  return (
    <div className={cn('border rounded-xl p-4 bg-white', className)}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-900">
          I can help you create these commitments:
        </p>
        {onDismiss !== (() => {}) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="h-6 w-6 text-gray-400 hover:text-gray-900"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="space-y-2">
        {tasks.map((task, index) => (
          <div key={index} className="border rounded-lg p-3 bg-gray-50">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-900">New Commitment</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                    {getTypeLabel(task.type_)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {task.context.priority}
                  </span>
                </div>
                
                <p className="text-sm text-gray-900 mb-2">
                  {task.title}
                </p>
                
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Every {task.period} at 4pm</span>
                  {enableCalendar && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>+ Calendar</span>
                    </span>
                  )}
                </div>
              </div>
              
              <Button
                size="sm"
                onClick={() => handleCreateTask(task, index)}
                disabled={creatingTasks.has(index) || createdTasks.has(index)}
                variant={createdTasks.has(index) ? "default" : "outline"}
                className={cn(
                  'shrink-0 min-w-[80px]',
                  createdTasks.has(index) && 'bg-gray-900 hover:bg-gray-800 text-white'
                )}
              >
                {creatingTasks.has(index) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : createdTasks.has(index) ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Created
                  </>
                ) : (
                  'Create'
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}