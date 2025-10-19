'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Mail, Globe, CheckSquare } from 'lucide-react'

interface AgentTask {
  context: {
    prompt: string
    priority: string
    url?: string
  }
  period: string
  type: 'EMAIL' | 'WEB' | 'TODO'
  title: string
}

interface InlineTaskSuggestionProps {
  tasks: AgentTask[]
  onCreateTask?: (task: any) => Promise<void>
}

const TaskTypeIcon = ({ type }: { type: 'EMAIL' | 'WEB' | 'TODO' }) => {
  switch (type) {
    case 'EMAIL':
      return <Mail className="h-4 w-4" />
    case 'WEB':
      return <Globe className="h-4 w-4" />
    case 'TODO':
      return <CheckSquare className="h-4 w-4" />
  }
}

const TaskTypeBadge = ({ type }: { type: 'EMAIL' | 'WEB' | 'TODO' }) => {
  const variants = {
    EMAIL: 'bg-blue-100 text-blue-800 border-blue-200',
    WEB: 'bg-green-100 text-green-800 border-green-200', 
    TODO: 'bg-purple-100 text-purple-800 border-purple-200'
  }
  
  return (
    <Badge variant="outline" className={variants[type]}>
      <TaskTypeIcon type={type} />
      <span className="ml-1">{type}</span>
    </Badge>
  )
}

export function InlineTaskSuggestion({ tasks, onCreateTask }: InlineTaskSuggestionProps) {
  const [creatingTasks, setCreatingTasks] = useState<Set<number>>(new Set())

  console.log('🎯 [InlineTaskSuggestion] Rendered with tasks:', {
    taskCount: tasks.length,
    hasOnCreateTask: !!onCreateTask,
    tasks: tasks.map(t => ({ title: t.title, type: t.type }))
  })

  const handleCreateTask = async (task: AgentTask, index: number) => {
    if (!onCreateTask) {
      console.warn('⚠️ [InlineTaskSuggestion] No onCreateTask function provided')
      return
    }
    
    console.log('🚀 [InlineTaskSuggestion] Starting task creation:', {
      index,
      title: task.title,
      type: task.type
    })
    
    setCreatingTasks(prev => new Set(prev).add(index))
    
    try {
      const taskPayload = {
        title: task.title,
        type: task.type,
        context: {
          prompt: task.context.prompt,
          priority: task.context.priority,
          url: task.context.url
        },
        period: task.period
      }
      
      console.log('📤 [InlineTaskSuggestion] Calling onCreateTask with:', taskPayload)
      await onCreateTask(taskPayload)
      console.log('✅ [InlineTaskSuggestion] Task creation completed for:', task.title)
    } catch (error) {
      console.error('❌ [InlineTaskSuggestion] Task creation failed:', error)
    } finally {
      setCreatingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(index)
        return newSet
      })
      console.log('🏁 [InlineTaskSuggestion] Task creation process finished for index:', index)
    }
  }

  if (!tasks || tasks.length === 0) {
    return null
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="text-sm text-gray-600 font-medium">
        Suggested Tasks:
      </div>
      
      {tasks.map((task, index) => (
        <Card key={index} className="border border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <CardTitle className="text-sm font-medium">
                  {task.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <TaskTypeBadge type={task.type} />
                  <Badge variant="outline" className="text-xs">
                    {task.period}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {task.context.priority} priority
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <CardDescription className="text-sm text-gray-600 mb-3">
              {task.context.prompt}
            </CardDescription>
            
            {task.context.url && (
              <div className="text-xs text-gray-500 mb-3 truncate">
                URL: {task.context.url}
              </div>
            )}
            
            <Button
              size="sm"
              onClick={() => handleCreateTask(task, index)}
              disabled={creatingTasks.has(index)}
              className="w-full"
            >
              {creatingTasks.has(index) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Task'
              )}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}