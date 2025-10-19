export interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  location?: string
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted'
  }>
  creator?: {
    email: string
    displayName?: string
  }
  organizer?: {
    email: string
    displayName?: string
  }
  status?: 'confirmed' | 'tentative' | 'cancelled'
  colorId?: string
  recurrence?: string[]
  reminders?: {
    useDefault: boolean
    overrides?: Array<{
      method: 'email' | 'popup'
      minutes: number
    }>
  }
}

export interface Calendar {
  id: string
  summary: string
  description?: string
  primary?: boolean
  accessRole: 'owner' | 'reader' | 'writer' | 'freeBusyReader'
  backgroundColor?: string
  foregroundColor?: string
}

export interface EventsListResponse {
  items: CalendarEvent[]
  nextPageToken?: string
  nextSyncToken?: string
}

export interface CreateEventRequest {
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone?: string
  }
  end: {
    dateTime: string
    timeZone?: string
  }
  location?: string
  attendees?: Array<{
    email: string
  }>
  reminders?: {
    useDefault: boolean
    overrides?: Array<{
      method: 'email' | 'popup'
      minutes: number
    }>
  }
}

export interface FreeBusyRequest {
  timeMin: string
  timeMax: string
  items: Array<{
    id: string
  }>
}

export interface FreeBusyResponse {
  calendars: {
    [calendarId: string]: {
      busy: Array<{
        start: string
        end: string
      }>
      errors?: Array<{
        domain: string
        reason: string
      }>
    }
  }
}

export class CalendarService {
  private isInitialized = false
  private onQuotaExceeded?: () => void
  private onApiError?: (error: string) => void

  setErrorHandlers(onQuotaExceeded?: () => void, onApiError?: (error: string) => void) {
    this.onQuotaExceeded = onQuotaExceeded
    this.onApiError = onApiError
  }

  async initialize() {
    if (this.isInitialized) return
    
    console.log('Initializing Calendar Service...')
    
    // Wait for GAPI to be loaded
    if (!window.gapi) {
      console.error('Google API client not loaded')
      throw new Error('Google API client not loaded')
    }
    
    // Wait for client to be initialized
    if (!window.gapi.client) {
      console.error('Google API client not initialized')
      throw new Error('Google API client not initialized')
    }
    
    // Check if Calendar API is available
    if (!window.gapi.client.calendar) {
      console.error('Calendar API not available. Trying to load it manually...')
      
      // Try to manually load the calendar API
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (window.gapi.client as any).load('calendar', 'v3')
        console.log('Calendar API loaded manually')
      } catch (error) {
        console.error('Failed to manually load Calendar API:', error)
        throw new Error('Calendar API not loaded. Make sure Google APIs are initialized with Calendar discovery docs.')
      }
    }
    
    // Check if user has valid auth token
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const token = (window.gapi.client as any).getToken()
    if (!token || !token.access_token) {
      console.error('No valid authentication token available')
      throw new Error('No valid authentication token. Please sign in with Google.')
    }
    
    console.log('Calendar Service initialized successfully')
    this.isInitialized = true
  }

  private handleApiError(error: any) {
    console.error('Calendar API Error:', error)
    
    if (error.status === 429 || (error.result && error.result.error && error.result.error.code === 429)) {
      this.onQuotaExceeded?.()
      throw new Error('Calendar API quota exceeded. Please try again later.')
    }
    
    if (error.status === 403) {
      const errorMessage = 'Insufficient permissions for Calendar API. Please reconnect your account.'
      this.onApiError?.(errorMessage)
      throw new Error(errorMessage)
    }
    
    if (error.status === 401) {
      const errorMessage = 'Calendar API authentication failed. Please reconnect your account.'
      this.onApiError?.(errorMessage)
      throw new Error(errorMessage)
    }
    
    const errorMessage = error.result?.error?.message || error.message || 'Unknown Calendar API error'
    this.onApiError?.(errorMessage)
    throw new Error(errorMessage)
  }

  private async executeWithErrorHandling<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      this.handleApiError(error)
      throw error
    }
  }

  async getCalendars(): Promise<Calendar[]> {
    await this.initialize()
    
    return this.executeWithErrorHandling(async () => {
      console.log('Fetching calendars...')
      const response = await window.gapi.client.calendar.calendarList.list()
      console.log('Calendars response:', response.result.items)
      return response.result.items || []
    })
  }

  async getEvents(
    calendarId: string = 'primary',
    timeMin?: string,
    timeMax?: string,
    maxResults: number = 250
  ): Promise<CalendarEvent[]> {
    await this.initialize()
    
    return this.executeWithErrorHandling(async () => {
      const params: any = {
        calendarId,
        maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      }
      
      if (timeMin) params.timeMin = timeMin
      if (timeMax) params.timeMax = timeMax
      
      console.log(`Fetching events for calendar: ${calendarId}`)
      const response = await window.gapi.client.calendar.events.list(params)
      console.log(`Events for calendar ${calendarId}:`, response.result.items)
      return response.result.items || []
    })
  }

  async getEventsForWeek(startDate: Date, calendarId: string = 'primary'): Promise<CalendarEvent[]> {
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 7)
    
    return this.getEvents(
      calendarId,
      startDate.toISOString(),
      endDate.toISOString()
    )
  }

  async getAllEventsForWeek(startDate: Date): Promise<CalendarEvent[]> {
    await this.initialize()

    const calendars = await this.getCalendars()
    const allEvents: CalendarEvent[] = []

    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 7)
    const timeMin = startDate.toISOString()
    const timeMax = endDate.toISOString()

    const eventPromises = calendars.map(calendar => {
      return this.getEvents(calendar.id, timeMin, timeMax)
    })

    const eventsByCalendar = await Promise.all(eventPromises)
    
    for (const events of eventsByCalendar) {
      allEvents.push(...events)
    }

    return allEvents
  }

  async getEventsForDay(date: Date, calendarId: string = 'primary'): Promise<CalendarEvent[]> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
    
    return this.getEvents(
      calendarId,
      startOfDay.toISOString(),
      endOfDay.toISOString()
    )
  }

  async createEvent(eventData: CreateEventRequest, calendarId: string = 'primary'): Promise<CalendarEvent> {
    await this.initialize()
    
    return this.executeWithErrorHandling(async () => {
      const response = await window.gapi.client.calendar.events.insert({
        calendarId,
        resource: eventData
      })
      return response.result
    })
  }

  async updateEvent(
    eventId: string, 
    eventData: Partial<CreateEventRequest>, 
    calendarId: string = 'primary'
  ): Promise<CalendarEvent> {
    await this.initialize()
    
    return this.executeWithErrorHandling(async () => {
      const response = await window.gapi.client.calendar.events.patch({
        calendarId,
        eventId,
        resource: eventData
      })
      return response.result
    })
  }

  async deleteEvent(eventId: string, calendarId: string = 'primary'): Promise<void> {
    await this.initialize()
    
    return this.executeWithErrorHandling(async () => {
      await window.gapi.client.calendar.events.delete({
        calendarId,
        eventId
      })
    })
  }

  async getFreeBusy(request: FreeBusyRequest): Promise<FreeBusyResponse> {
    await this.initialize()
    
    return this.executeWithErrorHandling(async () => {
      const response = await window.gapi.client.calendar.freebusy.query({
        resource: request
      })
      return response.result
    })
  }

  // Helper methods for common operations
  createEventFromTask(
    title: string,
    description: string,
    startTime: Date,
    duration: number = 60, // minutes
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): CreateEventRequest {
    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + duration)
    
    const colorMap = {
      low: '11', // Green
      medium: '5', // Orange  
      high: '11' // Red
    }
    
    return {
      summary: title,
      description,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'email', minutes: 60 }
        ]
      }
    }
  }

  findAvailableSlot(
    events: CalendarEvent[],
    preferredStart: Date,
    duration: number = 60 // minutes
  ): Date | null {
    const sortedEvents = events
      .filter(event => event.start.dateTime && event.end.dateTime)
      .sort((a, b) => new Date(a.start.dateTime!).getTime() - new Date(b.start.dateTime!).getTime())
    
    let currentTime = new Date(preferredStart)
    
    for (const event of sortedEvents) {
      const eventStart = new Date(event.start.dateTime!)
      const eventEnd = new Date(event.end.dateTime!)
      
      // Check if there's enough time before this event
      if (currentTime.getTime() + (duration * 60000) <= eventStart.getTime()) {
        return currentTime
      }
      
      // Move to after this event
      currentTime = new Date(Math.max(currentTime.getTime(), eventEnd.getTime()))
    }
    
    // Return the time after all events
    return currentTime
  }

  formatEventTime(event: CalendarEvent): string {
    if (!event.start.dateTime) return 'All day'
    
    const start = new Date(event.start.dateTime)
    const end = new Date(event.end.dateTime!)
    
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
    
    return `${formatTime(start)} - ${formatTime(end)}`
  }

  isEventToday(event: CalendarEvent): boolean {
    if (!event.start.dateTime && !event.start.date) return false
    
    const eventDate = new Date(event.start.dateTime || event.start.date!)
    const today = new Date()
    
    return eventDate.toDateString() === today.toDateString()
  }

  getEventDuration(event: CalendarEvent): number {
    if (!event.start.dateTime || !event.end.dateTime) return 0
    
    const start = new Date(event.start.dateTime)
    const end = new Date(event.end.dateTime)
    
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60)) // minutes
  }
}

export const calendarService = new CalendarService()