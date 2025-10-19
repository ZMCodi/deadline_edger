'use client'

import { useCalendar } from '@/contexts/CalendarContext'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export function CalendarList() {
  const { calendars, selectedCalendars, toggleCalendar } = useCalendar()

  return (
    <div className="p-4 border-t">
      <h3 className="font-semibold mb-2">My Calendars</h3>
      <div className="space-y-2">
        {calendars.map(calendar => (
          <div key={calendar.id} className="flex items-center space-x-2">
            <Checkbox
              id={calendar.id}
              checked={selectedCalendars[calendar.id] || false}
              onCheckedChange={() => toggleCalendar(calendar.id)}
            />
            <Label htmlFor={calendar.id} className="flex-1">
              {calendar.summary}
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}
