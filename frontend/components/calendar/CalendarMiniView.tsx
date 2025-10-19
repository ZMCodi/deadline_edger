'use client'

import { useState, useEffect, useCallback } from 'react'
import { CalendarEvent, calendarService } from '@/lib/calendar-service'
import { useGoogleAuth } from '@/contexts/GoogleAuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  Plus, 
  ChevronRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'

interface CalendarMiniViewProps {
  showUpcoming?: boolean
  showToday?: boolean
  maxEvents?: number
  onEventClick?: (event: CalendarEvent) => void
  onCreateEvent?: (date: Date) => void
  newEventHighlight?: CalendarEvent | null
  className?: string
  title?: string
}

export function CalendarMiniView({
  showUpcoming = true,
  showToday = true,
  maxEvents = 5,
  onEventClick,
  onCreateEvent,
  newEventHighlight,
  className = '',
  title = 'Calendar'
}: CalendarMiniViewProps) {
  const { isConnected, isGoogleLoaded } = useGoogleAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadEvents = useCallback(async () => {
    if (!isConnected || !isGoogleLoaded) return

    setLoading(true)
    setError(null)

    try {
      await calendarService.initialize()
      
      const today = new Date()
      
      const calendarEvents = await calendarService.getAllEventsForWeek(today)
      
      // Filter and sort events
      const filteredEvents = calendarEvents
        .filter(event => {
          if (!event.start.dateTime && !event.start.date) return false
          
          const eventDate = parseISO(event.start.dateTime || event.start.date!)
          
          if (showToday && isToday(eventDate)) return true
          if (showUpcoming && eventDate > today) return true
          
          return false
        })
        .slice(0, maxEvents)
      
      setEvents(filteredEvents)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar events')
      console.error('Error loading calendar events:', err)
    } finally {
      setLoading(false)
    }
  }, [isConnected, isGoogleLoaded, showUpcoming, showToday, maxEvents])

  useEffect(() => {
    if (isConnected && isGoogleLoaded) {
      loadEvents()
    }
  }, [isConnected, isGoogleLoaded, loadEvents])

  // Add new event highlight if provided
  useEffect(() => {
    if (newEventHighlight) {
      setEvents(prev => {
        const exists = prev.some(event => event.id === newEventHighlight.id)
        if (!exists) {
          return [newEventHighlight, ...prev].slice(0, maxEvents)
        }
        return prev
      })
    }
  }, [newEventHighlight, maxEvents])

  const getEventTimeDisplay = (event: CalendarEvent) => {
    if (event.start.date) {
      return 'All day'
    }
    
    if (event.start.dateTime) {
      const startTime = parseISO(event.start.dateTime)
      return format(startTime, 'h:mm a')
    }
    
    return ''
  }

  const getEventDateDisplay = (event: CalendarEvent) => {
    const eventDate = parseISO(event.start.dateTime || event.start.date!)
    
    if (isToday(eventDate)) return 'Today'
    if (isTomorrow(eventDate)) return 'Tomorrow'
    return format(eventDate, 'MMM d')
  }

  const getEventColor = (event: CalendarEvent) => {
    if (event.id === newEventHighlight?.id) return 'bg-green-100 border-green-300'
    if (event.summary.toLowerCase().includes('meeting')) return 'bg-blue-50 border-blue-200'
    if (event.summary.toLowerCase().includes('task')) return 'bg-green-50 border-green-200'
    if (event.summary.toLowerCase().includes('deadline')) return 'bg-red-50 border-red-200'
    return 'bg-gray-50 border-gray-200'
  }

  if (!isConnected) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Connect Google to view calendar</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {title}
          </CardTitle>
          {onCreateEvent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCreateEvent(new Date())}
              className="text-xs"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="text-center py-6">
            <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No upcoming events</p>
            {onCreateEvent && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCreateEvent(new Date())}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Event
              </Button>
            )}
          </div>
        )}

        {!loading && !error && events.map((event) => (
          <div
            key={event.id}
            className={`p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow ${getEventColor(event)}`}
            onClick={() => onEventClick?.(event)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-medium text-sm truncate">{event.summary}</h3>
                  {event.id === newEventHighlight?.id && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      New
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-3 text-xs text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{getEventTimeDisplay(event)}</span>
                  </div>
                  <span>{getEventDateDisplay(event)}</span>
                </div>
                
                {event.location && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    📍 {event.location}
                  </p>
                )}
              </div>
              
              <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
            </div>
          </div>
        ))}

        {!loading && !error && events.length > 0 && showUpcoming && (
          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-gray-600"
              onClick={() => {
                // Navigate to full calendar view
                window.open('/calendar', '_blank')
              }}
            >
              View full calendar
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Specialized components for different use cases
export function TodayCalendarView(props: Omit<CalendarMiniViewProps, 'showUpcoming' | 'showToday'>) {
  return (
    <CalendarMiniView
      {...props}
      showUpcoming={false}
      showToday={true}
      title="Today's Schedule"
    />
  )
}

export function UpcomingCalendarView(props: Omit<CalendarMiniViewProps, 'showUpcoming' | 'showToday'>) {
  return (
    <CalendarMiniView
      {...props}
      showUpcoming={true}
      showToday={false}
      title="Upcoming Events"
    />
  )
}

export function TaskCreatedCalendarView({
  newEvent,
  ...props
}: Omit<CalendarMiniViewProps, 'newEventHighlight'> & { newEvent: CalendarEvent }) {
  return (
    <CalendarMiniView
      {...props}
      newEventHighlight={newEvent}
      title="Calendar Updated"
      className="border-green-200 bg-green-50"
    />
  )
}