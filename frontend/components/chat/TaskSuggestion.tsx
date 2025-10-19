'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

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
}

export function TaskSuggestion({ 
  tasks, 
  onCreateTask, 
  onDismiss, 
  className 
}: TaskSuggestionProps) {
  const [creatingTasks, setCreatingTasks] = useState<Set<number>>(new Set())
  const [createdTasks, setCreatedTasks] = useState<Set<number>>(new Set())

  if (tasks.length === 0) {
    return null
  }

  const handleCreateTask = async (task: Task, index: number) => {
    if (creatingTasks.has(index) || createdTasks.has(index)) {
      return
    }

    setCreatingTasks(prev => new Set(prev).add(index))
    
    try {
      await onCreateTask(task)
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

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'EMAIL':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'WEB':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'TODO':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Card className={cn('p-3 border-blue-200 bg-blue-50', className)}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-blue-900 text-sm">
          I can help you create these tasks:
        </h3>
        {onDismiss !== (() => {}) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      <div className="space-y-2">
        {tasks.map((task, index) => (
          <Card key={index} className="p-2 bg-white border-gray-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1">
                  <h4 className="font-medium text-xs truncate">{task.title}</h4>
                  <Badge 
                    variant="outline" 
                    className={cn('text-xs px-1 py-0', getTypeColor(task.type_))}
                  >
                    {task.type_}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={cn('text-xs px-1 py-0', getPriorityColor(task.context.priority))}
                  >
                    {task.context.priority}
                  </Badge>
                </div>
                
                <p className="text-xs text-gray-600 mb-1">
                  {task.context.prompt}
                </p>
                
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Every {task.period}</span>
                  {task.context.url && (
                    <span className="truncate">URL: {task.context.url}</span>
                  )}
                </div>
              </div>
              
              <Button
                size="sm"
                onClick={() => handleCreateTask(task, index)}
                disabled={creatingTasks.has(index) || createdTasks.has(index)}
                className={cn(
                  'shrink-0',
                  createdTasks.has(index) && 'bg-green-600 hover:bg-green-700'
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
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Task
                  </>
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  )
}