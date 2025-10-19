'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RefreshCw, Clock, Globe, Mail, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTasks, type TaskResponse } from '@/lib/api'

interface TaskListProps {
  refreshTrigger?: number
  className?: string
}

export function TaskList({ refreshTrigger, className }: TaskListProps) {
  const [tasks, setTasks] = useState<TaskResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const userTasks = await getTasks()
      setTasks(userTasks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [refreshTrigger])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EMAIL':
        return <Mail className="h-3 w-3" />
      case 'WEB':
        return <Globe className="h-3 w-3" />
      case 'TODO':
        return <CheckCircle className="h-3 w-3" />
      default:
        return <CheckCircle className="h-3 w-3" />
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

  const formatLastRun = (timestamp: string) => {
    if (!timestamp) return 'Never'
    try {
      const date = new Date(timestamp)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } catch {
      return 'Invalid date'
    }
  }

  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-6 text-center', className)}>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchTasks} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center pr-10 justify-between gap-3 p-4 border-b shrink-0">
        <h3 className="font-semibold text-lg">Your Tasks</h3>
        <Button
          onClick={fetchTasks}
          variant="ghost"
          size="sm"
          disabled={isLoading}
          className="shrink-0 "
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {isLoading && tasks.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No tasks yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Create your first task to get started
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <Card key={task.id_} className="p-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm leading-tight">
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge
                        variant="outline"
                        className={cn('text-xs px-1 py-0', getTypeColor(task.type))}
                      >
                        <span className="mr-1">{getTypeIcon(task.type)}</span>
                        {task.type}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-2">
                    {task.context.prompt}
                  </p>

                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn('px-1 py-0', getPriorityColor(task.context.priority))}
                      >
                        {task.context.priority}
                      </Badge>
                      <span className="text-gray-500">
                        Every {task.period}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span className="truncate">
                        {formatLastRun(task.last_run_ts)}
                      </span>
                    </div>
                  </div>

                  {task.context.url && (
                    <div className="text-xs text-blue-600 truncate">
                      <Globe className="h-3 w-3 inline mr-1" />
                      {task.context.url}
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}