'use client'

import { useState, useEffect } from 'react'
import { gmailService, GmailMessage } from '@/lib/gmail-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Star, 
  Mail, 
  MailOpen, 
  Clock, 
  Reply, 
  ReplyAll, 
  Forward, 
  Archive,
  Trash2,
  MoreHorizontal,
  Paperclip
} from 'lucide-react'
import { format } from 'date-fns'

interface EmailDetailProps {
  email: GmailMessage
  onBack?: () => void
  onMarkAsRead?: (messageId: string) => void
  onMarkAsUnread?: (messageId: string) => void
  onStar?: (messageId: string) => void
  onUnstar?: (messageId: string) => void
}

export function EmailDetail({ 
  email, 
  onBack, 
  onMarkAsRead, 
  onMarkAsUnread, 
  onStar, 
  onUnstar 
}: EmailDetailProps) {
  const [emailBody, setEmailBody] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [isHtml, setIsHtml] = useState(false)

  const isUnread = gmailService.isUnread(email)
  const isStarred = gmailService.isStarred(email)
  const subject = gmailService.getEmailSubject(email)
  const from = gmailService.getEmailFrom(email)
  const to = gmailService.getEmailTo(email)
  const date = gmailService.getEmailDate(email)
  const sender = gmailService.formatEmailAddress(from)
  const recipient = gmailService.formatEmailAddress(to)

  useEffect(() => {
    const loadEmailBody = async () => {
      setLoading(true)
      try {
        let body = gmailService.getEmailBody(email)
        
        if (email.payload.parts) {
          const htmlPart = email.payload.parts.find(part => part.mimeType === 'text/html')
          const textPart = email.payload.parts.find(part => part.mimeType === 'text/plain')
          
          if (htmlPart && htmlPart.body?.data) {
            body = gmailService['decodeBase64Url'](htmlPart.body.data)
            setIsHtml(true)
          } else if (textPart && textPart.body?.data) {
            body = gmailService['decodeBase64Url'](textPart.body.data)
            setIsHtml(false)
          }
        } else if (email.payload.body?.data) {
          body = gmailService['decodeBase64Url'](email.payload.body.data)
          setIsHtml(email.payload.mimeType === 'text/html')
        }
        
        setEmailBody(body || email.snippet)
      } catch (error) {
        console.error('Error loading email body:', error)
        setEmailBody(email.snippet)
      } finally {
        setLoading(false)
      }
    }

    loadEmailBody()

    if (isUnread && onMarkAsRead) {
      onMarkAsRead(email.id)
    }
  }, [email, isUnread, onMarkAsRead])

  const handleStar = async () => {
    try {
      if (isStarred) {
        await gmailService.removeLabels(email.id, ['STARRED'])
        onUnstar?.(email.id)
      } else {
        await gmailService.addLabels(email.id, ['STARRED'])
        onStar?.(email.id)
      }
    } catch (error) {
      console.error('Error toggling star:', error)
    }
  }

  const handleMarkAsRead = async () => {
    try {
      if (isUnread) {
        await gmailService.markAsRead(email.id)
        onMarkAsRead?.(email.id)
      } else {
        await gmailService.markAsUnread(email.id)
        onMarkAsUnread?.(email.id)
      }
    } catch (error) {
      console.error('Error toggling read status:', error)
    }
  }

  const getAttachments = () => {
    const attachments: Array<{ filename: string; size: number; mimeType: string }> = []
    
    if (email.payload.parts) {
      email.payload.parts.forEach(part => {
        if (part.filename && part.filename.length > 0) {
          attachments.push({
            filename: part.filename,
            size: part.body?.size || 0,
            mimeType: part.mimeType
          })
        }
      })
    }
    
    return attachments
  }

  const attachments = getAttachments()

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button variant="ghost" onClick={onBack} className="flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="flex items-center space-x-2 flex-wrap">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleStar}
            className={isStarred ? 'text-yellow-500' : ''}
          >
            <Star className={`h-4 w-4 ${isStarred ? 'fill-current' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleMarkAsRead}>
            {isUnread ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm">
            <Archive className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <CardTitle className="text-xl leading-tight flex-1 min-w-0 break-words">{subject}</CardTitle>
              <div className="flex items-center space-x-1 flex-shrink-0">
                {isUnread && <Badge variant="default">Unread</Badge>}
                {isStarred && <Badge variant="secondary">Starred</Badge>}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {sender.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{sender.name}</p>
                  <p className="text-xs text-gray-500 truncate">{sender.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1 text-xs text-gray-500 flex-shrink-0">
                <Clock className="h-3 w-3" />
                <span>{format(date, 'PPp')}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p><span className="font-medium">From:</span> {from}</p>
            <p><span className="font-medium">To:</span> {to}</p>
            {email.labelIds.length > 0 && (
              <div className="flex items-center space-x-2 mt-2">
                <span className="font-medium">Labels:</span>
                <div className="flex flex-wrap gap-1">
                  {email.labelIds
                    .filter(labelId => !['INBOX', 'UNREAD', 'IMPORTANT', 'STARRED'].includes(labelId))
                    .map(labelId => (
                      <Badge key={labelId} variant="outline" className="text-xs">
                        {labelId.replace(/^Label_/, '')}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </div>

          {attachments.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Paperclip className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Attachments ({attachments.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachments.map((attachment, index) => (
                  <div 
                    key={index}
                    className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <Paperclip className="h-4 w-4 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{attachment.filename}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div className="prose prose-sm max-w-none">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : isHtml ? (
              <div 
                dangerouslySetInnerHTML={{ __html: emailBody }}
                className="email-content"
              />
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {emailBody}
              </pre>
            )}
          </div>

          <Separator />

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Reply className="h-4 w-4 mr-2" />
              Reply
            </Button>
            <Button variant="outline" size="sm">
              <ReplyAll className="h-4 w-4 mr-2" />
              Reply All
            </Button>
            <Button variant="outline" size="sm">
              <Forward className="h-4 w-4 mr-2" />
              Forward
            </Button>
          </div>
        </CardContent>
      </Card>

      <style jsx global>{`
        .email-content {
          line-height: 1.6;
        }
        .email-content img {
          max-width: 100%;
          height: auto;
        }
        .email-content table {
          width: 100%;
          border-collapse: collapse;
        }
        .email-content td, .email-content th {
          border: 1px solid #ddd;
          padding: 8px;
        }
        .email-content blockquote {
          border-left: 4px solid #ddd;
          margin: 0;
          padding-left: 1em;
          color: #666;
        }
      `}</style>
    </div>
  )
}