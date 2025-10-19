'use client'

import { useEffect, useState, useMemo } from 'react'
import { calendarService, CalendarEvent, Calendar } from '@/lib/calendar-service'
import { useGoogleAuth } from '@/contexts/GoogleAuthContext'
import { format, parseISO, startOfDay, endOfDay } from 'date-fns'
import { ChevronLeft, ChevronRight, FileText, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChatCalendarTimelineProps {
  date: Date
}

export function ChatCalendarTimeline({ date }: ChatCalendarTimelineProps) {
  const { isConnected, isGoogleLoaded } = useGoogleAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCalendars = async () => {
      if (!isConnected || !isGoogleLoaded) return
      try {
        const fetchedCalendars = await calendarService.getCalendars()
        setCalendars(fetchedCalendars)
      } catch (error) {
        console.error('Failed to fetch calendars for chat timeline:', error)
      }
    }
    fetchCalendars()
  }, [isConnected, isGoogleLoaded])

  useEffect(() => {
    const fetchEvents = async () => {
      if (!isConnected || !isGoogleLoaded || calendars.length === 0) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        await calendarService.initialize()
        const timeMin = startOfDay(date).toISOString()
        const timeMax = endOfDay(date).toISOString()

        const eventPromises = calendars.map(c => calendarService.getEvents(c.id, timeMin, timeMax))
        
        const eventsByCalendar = await Promise.all(eventPromises)
        setEvents(eventsByCalendar.flat().sort((a, b) => 
          new Date(a.start.dateTime || a.start.date!).getTime() - new Date(b.start.dateTime || b.start.date!).getTime()
        ))
      } catch (error) {
        console.error('Failed to fetch day events for chat timeline:', error)
        setLoading(false)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [isConnected, isGoogleLoaded, date, calendars])

  const hourlyEvents = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const grouped: { [hour: number]: CalendarEvent[] } = {}

    for (const hour of hours) {
      grouped[hour] = []
    }

    for (const event of events) {
      if (event.start.dateTime) {
        const startHour = parseISO(event.start.dateTime).getHours()
        if (grouped[startHour]) {
          grouped[startHour].push(event)
        }
      }
    }
    return grouped
  }, [events])

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
        {Object.entries(hourlyEvents).map(([hour, hourEvents]) => (
          hourEvents.length > 0 && (
            <div key={hour} className="flex items-start gap-6">
              <div className="w-20 text-sm text-gray-400 pt-2">
                {format(new Date(0).setHours(parseInt(hour)), 'h a')}
              </div>
              <div className="flex-1 space-y-3 pb-6">
                {hourEvents.map(event => {
                  const startTime = parseISO(event.start.dateTime!)
                  const endTime = parseISO(event.end.dateTime!)
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
                        <p className="text-xs text-gray-500 mt-1">
                          {format(startTime, 'h:mm')} - {format(endTime, 'h:mm')}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  )
}
