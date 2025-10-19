'use client'

import { useState, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Loader2 } from 'lucide-react'
import { createTask } from '@/lib/api'

interface AddTaskDialogProps {
  onTaskCreated?: () => void
  trigger?: React.ReactNode
}

export function AddTaskDialog({ onTaskCreated, trigger }: AddTaskDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    type: 'TODO' as 'EMAIL' | 'WEB' | 'TODO',
    prompt: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    period: '1 day',
    url: '',
  })

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.prompt.trim()) {
      return
    }

    setIsLoading(true)
    try {
      await createTask({
        title: formData.title,
        type: formData.type,
        context: {
          prompt: formData.prompt,
          priority: formData.priority,
          url: formData.url || undefined,
        },
        period: formData.period,
      })

      setFormData({
        title: '',
        type: 'TODO',
        prompt: '',
        priority: 'medium',
        period: '1 day',
        url: '',
      })
      setIsOpen(false)
      onTaskCreated?.()
    } catch (error) {
      console.error('Failed to create task:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <div className="space-y-2 mb-4">
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to your automation list. Specify what you want the task to do and how often it should run.
          </DialogDescription>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="e.g., Check daily news"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Task Type</label>
            <Select 
              value={formData.type} 
              onValueChange={(value: 'EMAIL' | 'WEB' | 'TODO') => 
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODO">Todo</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="WEB">Web</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Describe what this task should do..."
              className="resize-none"
              rows={3}
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select 
                value={formData.priority} 
                onValueChange={(value: 'high' | 'medium' | 'low') => 
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Period</label>
              <Input
                placeholder="e.g., 1 day, 2 hours"
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">URL (optional)</label>
            <Input
              placeholder="https://example.com"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            />
            <p className="text-xs text-gray-500">
              For web-based tasks, provide the URL to monitor or interact with.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Task'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}