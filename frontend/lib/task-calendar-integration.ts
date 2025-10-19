import { calendarService, CreateEventRequest, CalendarEvent } from './calendar-service'
import { createTask } from './api'

interface TaskData {
  title: string
  type: 'EMAIL' | 'WEB' | 'TODO'
  context: {
    prompt: string
    priority: string
    url?: string
  }
  period: string
}

interface CalendarTaskIntegration {
  task: TaskData
  calendarEvent?: {
    id: string
    summary: string
    start: { dateTime: string }
    end: { dateTime: string }
    description?: string
  }
}

export class TaskCalendarService {
  private static instance: TaskCalendarService
  private onCalendarUpdate?: (event: CalendarEvent) => void

  static getInstance(): TaskCalendarService {
    if (!TaskCalendarService.instance) {
      TaskCalendarService.instance = new TaskCalendarService()
    }
    return TaskCalendarService.instance
  }

  setCalendarUpdateCallback(callback: (event: CalendarEvent) => void) {
    this.onCalendarUpdate = callback
  }

  async createTaskWithCalendar(taskData: TaskData): Promise<CalendarTaskIntegration> {
    try {
      // First create the task
      await createTask(taskData)
      
      // Then create calendar event if appropriate
      const calendarEvent = await this.createCalendarEventFromTask(taskData)
      
      // Notify calendar update
      if (calendarEvent && this.onCalendarUpdate) {
        this.onCalendarUpdate(calendarEvent)
      }

      return {
        task: taskData,
        calendarEvent
      }
    } catch (error) {
      console.error('Error creating task with calendar:', error)
      throw error
    }
  }

  private async createCalendarEventFromTask(taskData: TaskData): Promise<CalendarEvent | null> {
    try {
      // Only create calendar events for tasks that have time components
      if (!this.shouldCreateCalendarEvent(taskData)) {
        return null
      }

      await calendarService.initialize()

      const { startTime, duration } = this.parseTaskSchedule(taskData)
      
      if (!startTime) {
        return null
      }

      const eventRequest: CreateEventRequest = calendarService.createEventFromTask(
        taskData.title,
        this.formatTaskDescription(taskData),
        startTime,
        duration,
        this.getTaskPriority(taskData.context.priority)
      )

      const createdEvent = await calendarService.createEvent(eventRequest)
      
      return createdEvent
    } catch (error) {
      console.warn('Could not create calendar event for task:', error)
      return null
    }
  }

  private shouldCreateCalendarEvent(taskData: TaskData): boolean {
    // Create calendar events for tasks that have time-based periods or are high priority
    const period = taskData.period.toLowerCase()
    const priority = taskData.context.priority.toLowerCase()
    
    return (
      period.includes('today') ||
      period.includes('tomorrow') ||
      period.includes('this week') ||
      period.includes('next week') ||
      period.includes('deadline') ||
      priority === 'high' ||
      priority === 'urgent'
    )
  }

  private parseTaskSchedule(taskData: TaskData): { startTime: Date | null; duration: number } {
    const period = taskData.period.toLowerCase()
    const priority = taskData.context.priority.toLowerCase()
    
    let startTime: Date | null = null
    let duration = 60 // Default 1 hour

    if (period.includes('today')) {
      startTime = this.getNextAvailableSlot(new Date())
    } else if (period.includes('tomorrow')) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(9, 0, 0, 0) // 9 AM tomorrow
      startTime = tomorrow
    } else if (period.includes('this week')) {
      const nextWeekday = this.getNextWeekday()
      startTime = nextWeekday
    } else if (period.includes('next week')) {
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      nextWeek.setHours(9, 0, 0, 0)
      startTime = nextWeek
    } else if (period.includes('deadline')) {
      // Try to parse specific deadline dates
      const deadlineMatch = period.match(/(\d{1,2}\/\d{1,2}|\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))/i)
      if (deadlineMatch) {
        startTime = new Date(deadlineMatch[0])
        if (isNaN(startTime.getTime())) {
          startTime = this.getNextAvailableSlot(new Date())
        }
      } else {
        startTime = this.getNextAvailableSlot(new Date())
      }
    }

    // Adjust duration based on task type and priority
    if (taskData.type === 'EMAIL') {
      duration = 30 // 30 minutes for email tasks
    } else if (priority === 'high' || priority === 'urgent') {
      duration = 90 // 1.5 hours for high priority tasks
    }

    return { startTime, duration }
  }

  private getNextAvailableSlot(from: Date): Date {
    const now = new Date()
    const startTime = new Date(Math.max(from.getTime(), now.getTime()))
    
    // Round to next hour
    startTime.setMinutes(0, 0, 0)
    startTime.setHours(startTime.getHours() + 1)
    
    // Ensure it's during working hours (9 AM - 6 PM)
    if (startTime.getHours() < 9) {
      startTime.setHours(9, 0, 0, 0)
    } else if (startTime.getHours() >= 18) {
      // Move to next day 9 AM
      startTime.setDate(startTime.getDate() + 1)
      startTime.setHours(9, 0, 0, 0)
    }
    
    return startTime
  }

  private getNextWeekday(): Date {
    const date = new Date()
    const day = date.getDay()
    
    // If it's weekend, move to Monday
    if (day === 0 || day === 6) {
      const daysToAdd = day === 0 ? 1 : 2 // Sunday -> Monday, Saturday -> Monday
      date.setDate(date.getDate() + daysToAdd)
    } else {
      // If it's a weekday, move to next day
      date.setDate(date.getDate() + 1)
    }
    
    date.setHours(9, 0, 0, 0)
    return date
  }

  private formatTaskDescription(taskData: TaskData): string {
    let description = `Task: ${taskData.title}\n\n`
    description += `Type: ${taskData.type}\n`
    description += `Priority: ${taskData.context.priority}\n`
    description += `Period: ${taskData.period}\n\n`
    description += `Details: ${taskData.context.prompt}\n`
    
    if (taskData.context.url) {
      description += `\nURL: ${taskData.context.url}`
    }
    
    description += '\n\n🤖 Created automatically by Deadline Edger'
    
    return description
  }

  private getTaskPriority(priority: string): 'low' | 'medium' | 'high' {
    const p = priority.toLowerCase()
    if (p.includes('high') || p.includes('urgent') || p.includes('critical')) {
      return 'high'
    } else if (p.includes('low') || p.includes('optional')) {
      return 'low'
    }
    return 'medium'
  }

  async findOptimalTimeSlot(taskData: TaskData): Promise<Date | null> {
    try {
      await calendarService.initialize()
      
      const startDate = new Date()
      const events = await calendarService.getAllEventsForWeek(startDate)
      
      const { duration } = this.parseTaskSchedule(taskData)
      const preferredStart = this.getNextAvailableSlot(startDate)
      
      return calendarService.findAvailableSlot(events, preferredStart, duration)
    } catch (error) {
      console.error('Error finding optimal time slot:', error)
      return this.getNextAvailableSlot(new Date())
    }
  }

  async rescheduleTask(eventId: string, newStartTime: Date, duration: number = 60): Promise<CalendarEvent> {
    try {
      await calendarService.initialize()
      
      const endTime = new Date(newStartTime)
      endTime.setMinutes(endTime.getMinutes() + duration)
      
      const updatedEvent = await calendarService.updateEvent(eventId, {
        start: {
          dateTime: newStartTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      })
      
      return updatedEvent
    } catch (error) {
      console.error('Error rescheduling task:', error)
      throw error
    }
  }
}

export const taskCalendarService = TaskCalendarService.getInstance()