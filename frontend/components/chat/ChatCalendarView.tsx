'use client'

import { useEffect, useState } from 'react'
import { calendarService, CalendarEvent } from '@/lib/calendar-service'
import { useGoogleAuth } from '@/contexts/GoogleAuthContext'
import { FileText, User, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format, parseISO } from 'date-fns'

interface ChatCalendarViewProps {
  date: Date
}

export function ChatCalendarView({ date }: ChatCalendarViewProps) {
  const { isConnected, isGoogleLoaded } = useGoogleAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      if (!isConnected || !isGoogleLoaded) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        await calendarService.initialize()
        const dayEvents = await calendarService.getEventsForDay(date, 'primary')
        setEvents(dayEvents)
      } catch (error) {
        console.error('Failed to fetch day events for chat:', error)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [isConnected, isGoogleLoaded, date])

  if (!isConnected) {
    return null
  }

  if (loading) {
    return (
      <div className="mt-6 p-6 border rounded-2xl bg-white">
        <div className="text-sm text-gray-400">Loading schedule...</div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="mt-6 p-6 border rounded-2xl bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-gray-900">Calendar</h3>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-400">No events scheduled for {format(date, 'MMMM do')}</p>
      </div>
    )
  }

  // Group events by hour
  const eventsByHour: { [hour: number]: CalendarEvent[] } = {}
  events.forEach(event => {
    if (event.start.dateTime) {
      const hour = parseISO(event.start.dateTime).getHours()
      if (!eventsByHour[hour]) {
        eventsByHour[hour] = []
      }
      eventsByHour[hour].push(event)
    }
  })

  return (
    <div className="mt-6 p-6 border rounded-2xl bg-white">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-semibold text-gray-900">Calendar</h3>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        {Object.entries(eventsByHour)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([hour, hourEvents]) => (
            <div key={hour} className="flex items-start gap-6">
              <div className="w-20 text-sm text-gray-400 pt-2">
                {format(new Date(0).setHours(parseInt(hour)), 'h a')}
              </div>
              <div className="flex-1 space-y-3 pb-6">
                {hourEvents.map(event => {
                  const startTime = event.start.dateTime ? parseISO(event.start.dateTime) : null
                  const endTime = event.end.dateTime ? parseISO(event.end.dateTime) : null
                  const isTask = event.summary?.toLowerCase().includes('task') || Math.random() > 0.5
                  
                  return (
                    <div
                      key={event.id}
                      className="bg-gray-100 rounded-xl p-3 flex items-start gap-3"
                    >
                      <div className="mt-0.5">
                        {isTask ? (
                          <FileText className="h-5 w-5 text-gray-600" />
                        ) : (
                          <User className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{event.summary}</p>
                        {startTime && endTime && (
                          <p className="text-xs text-gray-500 mt-1">
                            {format(startTime, 'h:mm')} - {format(endTime, 'h:mm')}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
