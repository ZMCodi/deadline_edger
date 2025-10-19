'use client'

import { useState, useEffect, useMemo } from 'react'
import { CalendarEvent } from '@/lib/calendar-service'
import { useGoogleAuth } from '@/contexts/GoogleAuthContext'
import { useCalendar } from '@/contexts/CalendarContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react'
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns'

interface CalendarWeekViewProps {
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
  onTimeSlotClick?: (date: Date, time: string) => void
  showHeader?: boolean
  compact?: boolean
  className?: string
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

export function CalendarWeekView({
  selectedDate = new Date(),
  onDateSelect,
  onEventClick,
  onTimeSlotClick,
  showHeader = true,
  compact = false,
  className = ''
}: CalendarWeekViewProps) {
  const { isConnected, isGoogleLoaded } = useGoogleAuth()
  const { events, loading, error, fetchEventsForRange } = useCalendar()
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(selectedDate, { weekStartsOn: 1 }))

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i))
  }, [currentWeek])

  useEffect(() => {
    if (isConnected && isGoogleLoaded) {
      const endDate = addDays(currentWeek, 6)
      fetchEventsForRange(currentWeek, endDate)
    }
  }, [isConnected, isGoogleLoaded, currentWeek, fetchEventsForRange])

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1))
  }

  const getEventsForDayAndHour = (day: Date, hour: number) => {
    return events.filter(event => {
      if (!event.start.dateTime) return false
      
      const eventStart = parseISO(event.start.dateTime)
      const eventEnd = parseISO(event.end.dateTime!)
      
      const slotStart = new Date(day)
      slotStart.setHours(hour, 0, 0, 0)
      
      const slotEnd = new Date(day)
      slotEnd.setHours(hour + 1, 0, 0, 0)
      
      return isSameDay(eventStart, day) && (
        (eventStart >= slotStart && eventStart < slotEnd) ||
        (eventEnd > slotStart && eventEnd <= slotEnd) ||
        (eventStart <= slotStart && eventEnd >= slotEnd)
      )
    })
  }

  const getEventPosition = (event: CalendarEvent, day: Date) => {
    if (!event.start.dateTime || !event.end.dateTime) return null
    
    const eventStart = parseISO(event.start.dateTime)
    const eventEnd = parseISO(event.end.dateTime)
    
    if (!isSameDay(eventStart, day)) return null
    
    const startMinutes = eventStart.getHours() * 60 + eventStart.getMinutes()
    const endMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes()
    const duration = endMinutes - startMinutes
    
    return {
      top: `${(startMinutes / 60) * (compact ? 40 : 60)}px`,
      height: `${(duration / 60) * (compact ? 40 : 60)}px`,
      startTime: format(eventStart, 'HH:mm'),
      endTime: format(eventEnd, 'HH:mm')
    }
  }

  const getEventColor = (event: CalendarEvent) => {
    // Simple color coding based on event properties
    if (event.summary.toLowerCase().includes('meeting')) return 'bg-blue-500'
    if (event.summary.toLowerCase().includes('task')) return 'bg-green-500'
    if (event.summary.toLowerCase().includes('deadline')) return 'bg-red-500'
    return 'bg-purple-500'
  }

  const handleTimeSlotClick = (day: Date, hour: number) => {
    const clickedTime = new Date(day)
    clickedTime.setHours(hour, 0, 0, 0)
    onTimeSlotClick?.(day, format(clickedTime, 'HH:mm'))
  }

  if (!isConnected) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Connect your Google account to view calendar</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`w-full ${className}`}>
      {showHeader && (
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold">
                {format(currentWeek, 'MMMM yyyy')}
              </h2>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateWeek('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateWeek('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            >
              Today
            </Button>
          </div>
        </div>
      )}

      <CardContent className="p-0">
        <div className="relative">
          {/* Header with dates */}
          <div className="grid grid-cols-8 border-b sticky top-0 bg-white z-10">
            <div className={`${compact ? 'p-2' : 'p-4'} border-r`}></div>
            {weekDays.map((day, index) => (
              <div
                key={day.toISOString()}
                className={`${compact ? 'p-2' : 'p-4'} border-r text-center cursor-pointer hover:bg-gray-50 ${
                  isSameDay(day, new Date()) ? 'bg-blue-50' : ''
                }`}
                onClick={() => onDateSelect?.(day)}
              >
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  {DAYS_OF_WEEK[index]}
                </div>
                <div className={`${compact ? 'text-lg' : 'text-xl'} font-semibold ${
                  isSameDay(day, new Date()) ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="relative">
            {HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-8 border-b relative">
                {/* Time column */}
                <div className={`${compact ? 'h-10 p-1' : 'h-15 p-2'} border-r text-xs text-gray-500 flex items-start justify-end pr-2`}>
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
                
                {/* Day columns */}
                {weekDays.map(day => {
                  const dayEvents = getEventsForDayAndHour(day, hour)
                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className={`${compact ? 'h-10' : 'h-15'} border-r relative cursor-pointer hover:bg-gray-50 group`}
                      onClick={() => handleTimeSlotClick(day, hour)}
                    >
                      {/* Time slot hover effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute top-1 right-1">
                          <Plus className="h-3 w-3 text-gray-400" />
                        </div>
                      </div>
                      
                      {/* Events */}
                      {dayEvents.map(event => {
                        const position = getEventPosition(event, day)
                        if (!position) return null
                        
                        return (
                          <div
                            key={event.id}
                            className={`absolute left-0.5 right-0.5 ${getEventColor(event)} text-white text-xs rounded px-1 cursor-pointer shadow-sm hover:shadow-md transition-shadow z-20`}
                            style={{
                              top: position.top,
                              height: position.height,
                              minHeight: compact ? '16px' : '20px'
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              onEventClick?.(event)
                            }}
                          >
                            <div className="truncate font-medium">
                              {event.summary}
                            </div>
                            {!compact && position.height && parseInt(position.height) > 30 && (
                              <div className="text-xs opacity-90">
                                {position.startTime} - {position.endTime}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-30">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="p-4 text-center">
            <p className="text-red-600 text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const endDate = addDays(currentWeek, 6)
                fetchEventsForRange(currentWeek, endDate)
              }}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}