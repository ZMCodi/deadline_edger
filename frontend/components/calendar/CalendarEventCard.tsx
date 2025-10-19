'use client'

import { CalendarEvent, calendarService } from '@/lib/calendar-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Clock, 
  MapPin, 
  Users, 
  Edit, 
  Trash2, 
  ExternalLink,
  Calendar
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface CalendarEventCardProps {
  event: CalendarEvent
  onEdit?: (event: CalendarEvent) => void
  onDelete?: (event: CalendarEvent) => void
  onClose?: () => void
  compact?: boolean
  showActions?: boolean
}

export function CalendarEventCard({
  event,
  onEdit,
  onDelete,
  onClose,
  compact = false,
  showActions = true
}: CalendarEventCardProps) {
  const getEventTime = () => {
    if (event.start.date && event.end.date) {
      // All-day event
      const startDate = parseISO(event.start.date)
      const endDate = parseISO(event.end.date)
      
      if (format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd')) {
        return `All day • ${format(startDate, 'MMM d, yyyy')}`
      } else {
        return `All day • ${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
      }
    }
    
    if (event.start.dateTime && event.end.dateTime) {
      const startTime = parseISO(event.start.dateTime)
      const endTime = parseISO(event.end.dateTime)
      
      return `${format(startTime, 'MMM d, yyyy • h:mm a')} - ${format(endTime, 'h:mm a')}`
    }
    
    return 'Time not specified'
  }

  const getEventDuration = () => {
    if (!event.start.dateTime || !event.end.dateTime) return null
    
    const start = parseISO(event.start.dateTime)
    const end = parseISO(event.end.dateTime)
    const minutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60))
    
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const getEventStatus = () => {
    switch (event.status) {
      case 'confirmed':
        return { label: 'Confirmed', color: 'bg-green-100 text-green-800' }
      case 'tentative':
        return { label: 'Tentative', color: 'bg-yellow-100 text-yellow-800' }
      case 'cancelled':
        return { label: 'Cancelled', color: 'bg-red-100 text-red-800' }
      default:
        return null
    }
  }

  const getEventColor = () => {
    // Simple color coding based on event properties
    if (event.summary.toLowerCase().includes('meeting')) return 'border-l-blue-500'
    if (event.summary.toLowerCase().includes('task')) return 'border-l-green-500'
    if (event.summary.toLowerCase().includes('deadline')) return 'border-l-red-500'
    return 'border-l-purple-500'
  }

  const status = getEventStatus()
  const duration = getEventDuration()

  if (compact) {
    return (
      <Card className={`w-full border-l-4 ${getEventColor()}`}>
        <CardContent className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{event.summary}</h3>
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <Clock className="h-3 w-3 mr-1" />
                {getEventTime()}
              </div>
              {event.location && (
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
            </div>
            {showActions && (
              <div className="flex items-center space-x-1 ml-2">
                {onEdit && (
                  <Button variant="ghost" size="sm" onClick={() => onEdit(event)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
                {onDelete && (
                  <Button variant="ghost" size="sm" onClick={() => onDelete(event)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`w-full border-l-4 ${getEventColor()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg leading-tight">{event.summary}</CardTitle>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                {getEventTime()}
              </div>
              {duration && (
                <Badge variant="secondary" className="text-xs">
                  {duration}
                </Badge>
              )}
              {status && (
                <Badge className={status.color}>
                  {status.label}
                </Badge>
              )}
            </div>
          </div>
          
          {showActions && (
            <div className="flex items-center space-x-2">
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={() => onEdit(event)}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="sm" onClick={() => onDelete(event)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  ×
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {event.description && (
          <div>
            <h4 className="font-medium text-sm mb-2">Description</h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        )}

        {event.location && (
          <div className="flex items-start space-x-2">
            <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Location</p>
              <p className="text-sm text-gray-600">{event.location}</p>
            </div>
          </div>
        )}

        {event.attendees && event.attendees.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-4 w-4 text-gray-500" />
              <p className="text-sm font-medium">
                Attendees ({event.attendees.length})
              </p>
            </div>
            <div className="space-y-2">
              {event.attendees.slice(0, 5).map((attendee, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {attendee.displayName ? attendee.displayName.charAt(0).toUpperCase() : attendee.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      {attendee.displayName || attendee.email}
                    </p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      attendee.responseStatus === 'accepted' ? 'bg-green-50 text-green-700' :
                      attendee.responseStatus === 'declined' ? 'bg-red-50 text-red-700' :
                      attendee.responseStatus === 'tentative' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-gray-50 text-gray-700'
                    }`}
                  >
                    {attendee.responseStatus === 'accepted' ? 'Yes' :
                     attendee.responseStatus === 'declined' ? 'No' :
                     attendee.responseStatus === 'tentative' ? 'Maybe' :
                     'Pending'}
                  </Badge>
                </div>
              ))}
              {event.attendees.length > 5 && (
                <p className="text-xs text-gray-500">
                  +{event.attendees.length - 5} more attendees
                </p>
              )}
            </div>
          </div>
        )}

        {event.organizer && (
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Organizer</p>
              <p className="text-sm text-gray-600">
                {event.organizer.displayName || event.organizer.email}
              </p>
            </div>
          </div>
        )}

        {event.recurrence && event.recurrence.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-1">Recurring event</p>
            <p className="text-xs text-gray-500">
              {event.recurrence[0]}
            </p>
          </div>
        )}

        {/* Action buttons */}
        {showActions && (onEdit || onDelete) && (
          <div className="flex space-x-2 pt-2 border-t">
            {onEdit && (
              <Button variant="outline" onClick={() => onEdit(event)} className="flex-1">
                <Edit className="h-4 w-4 mr-2" />
                Edit Event
              </Button>
            )}
            {onDelete && (
              <Button variant="outline" onClick={() => onDelete(event)} className="flex-1">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Event
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}