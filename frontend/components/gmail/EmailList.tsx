'use client'

import { useState, useEffect } from 'react'
import { gmailService, GmailMessage, EmailListResponse } from '@/lib/gmail-service'
import { useGoogleAuth } from '@/contexts/GoogleAuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Mail, 
  MailOpen, 
  Star, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface EmailListProps {
  query?: string
  labelId?: string
  onEmailSelect?: (message: GmailMessage) => void
  maxResults?: number
}

export function EmailList({ query, labelId, onEmailSelect, maxResults = 20 }: EmailListProps) {
  const { isConnected } = useGoogleAuth()
  const [emails, setEmails] = useState<GmailMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextPageToken, setNextPageToken] = useState<string | undefined>()
  const [hasMore, setHasMore] = useState(false)

  const loadEmails = async (pageToken?: string, append = false) => {
    if (!isConnected) return

    setLoading(true)
    setError(null)

    try {
      // Initialize Gmail service first
      await gmailService.initialize()
      
      let response: EmailListResponse

      if (query) {
        response = await gmailService.searchEmails(query, maxResults, pageToken)
      } else if (labelId) {
        response = await gmailService.getEmailsByLabel(labelId, maxResults, pageToken)
      } else {
        response = await gmailService.getMessages({ maxResults, pageToken })
      }

      if (response.messages && response.messages.length > 0) {
        const detailedEmails = await Promise.all(
          response.messages.map(msg => gmailService.getMessage(msg.id, 'metadata'))
        )

        if (append) {
          setEmails(prev => [...prev, ...detailedEmails])
        } else {
          setEmails(detailedEmails)
        }
      } else if (!append) {
        setEmails([])
      }

      setNextPageToken(response.nextPageToken)
      setHasMore(!!response.nextPageToken)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load emails')
      console.error('Error loading emails:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isConnected) {
      loadEmails()
    }
  }, [query, labelId, isConnected])

  const handleLoadMore = () => {
    if (nextPageToken && !loading) {
      loadEmails(nextPageToken, true)
    }
  }

  const handleEmailClick = async (email: GmailMessage) => {
    if (onEmailSelect) {
      try {
        const fullEmail = await gmailService.getMessage(email.id, 'full')
        onEmailSelect(fullEmail)
      } catch (err) {
        console.error('Error loading full email:', err)
        onEmailSelect(email)
      }
    }
  }

  const formatSender = (email: GmailMessage) => {
    const from = gmailService.getEmailFrom(email)
    const parsed = gmailService.formatEmailAddress(from)
    return parsed.name || parsed.email
  }

  const getAvatarText = (email: GmailMessage) => {
    const sender = formatSender(email)
    return sender.charAt(0).toUpperCase()
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Connect your Google account to view emails</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => loadEmails()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {loading && emails.length === 0 && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading emails...</span>
        </div>
      )}

      {emails.length === 0 && !loading && (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No emails found</p>
          </div>
        </div>
      )}

      {emails.map((email) => {
        const isUnread = gmailService.isUnread(email)
        const isStarred = gmailService.isStarred(email)
        const subject = gmailService.getEmailSubject(email)
        const sender = formatSender(email)
        const date = gmailService.getEmailDate(email)

        return (
          <Card 
            key={email.id} 
            className={`cursor-pointer transition-colors hover:bg-gray-50 ${
              isUnread ? 'border-l-4 border-l-blue-500' : ''
            }`}
            onClick={() => handleEmailClick(email)}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start space-x-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarFallback className="text-sm">
                    {getAvatarText(email)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1 gap-2">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <p className={`text-sm truncate ${isUnread ? 'font-semibold' : 'font-medium'}`}>
                        {sender}
                      </p>
                      {isStarred && <Star className="h-4 w-4 text-yellow-500 fill-current flex-shrink-0" />}
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-500 flex-shrink-0">
                      <Clock className="h-3 w-3" />
                      <span className="hidden sm:inline">{formatDistanceToNow(date, { addSuffix: true })}</span>
                      <span className="sm:hidden">{formatDistanceToNow(date, { addSuffix: true }).replace(' ago', '')}</span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between mb-2 gap-2">
                    <h3 className={`text-sm truncate flex-1 ${isUnread ? 'font-semibold' : 'font-normal'}`}>
                      {subject}
                    </h3>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {isUnread ? (
                        <Mail className="h-4 w-4 text-blue-500" />
                      ) : (
                        <MailOpen className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {email.snippet}
                  </p>

                  {email.labelIds.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {email.labelIds
                        .filter(labelId => !['INBOX', 'UNREAD', 'IMPORTANT', 'STARRED'].includes(labelId))
                        .slice(0, 2)
                        .map(labelId => (
                          <Badge key={labelId} variant="secondary" className="text-xs">
                            {labelId.replace(/^Label_/, '')}
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {hasMore && (
        <div className="flex justify-center">
          <Button 
            onClick={handleLoadMore} 
            disabled={loading}
            variant="outline"
            className="w-full max-w-xs"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ChevronRight className="h-4 w-4 mr-2" />
                Load More
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}