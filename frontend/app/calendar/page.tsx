'use client'

import { useState } from 'react'
import { CalendarWeekView } from '@/components/calendar/CalendarWeekView'
import { CalendarEventCard } from '@/components/calendar/CalendarEventCard'
import { CalendarMiniView, TodayCalendarView } from '@/components/calendar/CalendarMiniView'
import { CalendarList } from '@/components/calendar/CalendarList'
import { GoogleConnect } from '@/components/google/GoogleConnect'
import { useGoogleAuth } from '@/contexts/GoogleAuthContext'
import { CalendarEvent } from '@/lib/calendar-service'
import { Button } from '@/components/ui/button'
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Grid3X3,
  List
} from 'lucide-react'

export default function CalendarPage() {
  const { isConnected } = useGoogleAuth()
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [view, setView] = useState<'week' | 'list'>('week')

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
  }

  const handleEventClose = () => {
    setSelectedEvent(null)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleTimeSlotClick = (date: Date, time: string) => {
    console.log('Time slot clicked:', date, time)
    // TODO: Open create event dialog
  }

  const handleCreateEvent = (date: Date) => {
    console.log('Create event for:', date)
    // TODO: Open create event dialog
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendar</h1>
            <p className="text-gray-600">
              Connect your Google account to view and manage your calendar
            </p>
          </div>
          <GoogleConnect />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r overflow-y-auto">
          <div className="p-4 border-b">
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendar
            </h1>
          </div>

          <div className="p-4 space-y-4">
            {/* Create Event Button */}
            <Button 
              onClick={() => handleCreateEvent(new Date())}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>

            {/* View Toggle */}
            <div className="flex rounded-lg border p-1">
              <Button
                variant={view === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('week')}
                className="flex-1"
              >
                <Grid3X3 className="h-4 w-4 mr-1" />
                Week
              </Button>
              <Button
                variant={view === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('list')}
                className="flex-1"
              >
                <List className="h-4 w-4 mr-1" />
                List
              </Button>
            </div>

            {/* Today's Events */}
            <TodayCalendarView
              onEventClick={handleEventClick}
              onCreateEvent={handleCreateEvent}
              maxEvents={5}
            />

            <CalendarList />

            {/* Account Info */}
            <div className="pt-4 border-t">
              <GoogleConnect compact />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Calendar View */}
          <div className="flex-1 overflow-hidden">
            {view === 'week' ? (
              <CalendarWeekView
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                onEventClick={handleEventClick}
                onTimeSlotClick={handleTimeSlotClick}
                showHeader={true}
                className="h-full"
              />
            ) : (
              <div className="p-4 h-full overflow-y-auto">
                <CalendarMiniView
                  showUpcoming={true}
                  showToday={true}
                  maxEvents={20}
                  onEventClick={handleEventClick}
                  onCreateEvent={handleCreateEvent}
                  className="max-w-2xl mx-auto"
                />
              </div>
            )}
          </div>

          {/* Event Detail Panel */}
          {selectedEvent && (
            <div className="w-96 border-l bg-white overflow-y-auto">
              <div className="p-4">
                <CalendarEventCard
                  event={selectedEvent}
                  onClose={handleEventClose}
                  showActions={true}
                  onEdit={(event) => {
                    console.log('Edit event:', event)
                    // TODO: Open edit dialog
                  }}
                  onDelete={(event) => {
                    console.log('Delete event:', event)
                    // TODO: Confirm and delete
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}