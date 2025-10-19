'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { calendarService, Calendar, CalendarEvent } from '@/lib/calendar-service'
import { useGoogleAuth } from './GoogleAuthContext'

interface CalendarContextType {
  calendars: Calendar[]
  selectedCalendars: { [key: string]: boolean }
  toggleCalendar: (calendarId: string) => void
  events: CalendarEvent[]
  loading: boolean
  error: string | null
  fetchEventsForRange: (startDate: Date, endDate: Date) => void
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined)

export function CalendarProvider({ children }: { children: ReactNode }) {
  const { isConnected, isGoogleLoaded } = useGoogleAuth()
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [selectedCalendars, setSelectedCalendars] = useState<{ [key: string]: boolean }>({})
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCalendars = async () => {
      if (isConnected && isGoogleLoaded) {
        try {
          const fetchedCalendars = await calendarService.getCalendars()
          setCalendars(fetchedCalendars)
          const initialSelection = fetchedCalendars.reduce((acc, calendar) => {
            acc[calendar.id] = true // Select all by default
            return acc
          }, {} as { [key: string]: boolean })
          setSelectedCalendars(initialSelection)
        } catch {
          setError('Failed to load calendars')
        }
      }
    }
    loadCalendars()
  }, [isConnected, isGoogleLoaded])

  const toggleCalendar = (calendarId: string) => {
    setSelectedCalendars(prev => ({ ...prev, [calendarId]: !prev[calendarId] }))
  }

  const fetchEventsForRange = useCallback(async (startDate: Date, endDate: Date) => {
    if (!isConnected || !isGoogleLoaded || calendars.length === 0) return

    setLoading(true)
    setError(null)
    try {
      const timeMin = startDate.toISOString()
      const timeMax = endDate.toISOString()

      const eventPromises = calendars
        .filter(c => selectedCalendars[c.id])
        .map(c => calendarService.getEvents(c.id, timeMin, timeMax))
      
      const eventsByCalendar = await Promise.all(eventPromises)
      setEvents(eventsByCalendar.flat().sort((a, b) => 
        new Date(a.start.dateTime || a.start.date!).getTime() - new Date(b.start.dateTime || b.start.date!).getTime()
      ))
    } catch {
      setError('Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [isConnected, isGoogleLoaded, calendars, selectedCalendars])

  const value = {
    calendars,
    selectedCalendars,
    toggleCalendar,
    events,
    loading,
    error,
    fetchEventsForRange
  }

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  )
}

export function useCalendar() {
  const context = useContext(CalendarContext)
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider')
  }
  return context
}
