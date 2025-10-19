'use client'

import { useState, useEffect } from 'react'
import { gmailService, GmailLabel } from '@/lib/gmail-service'
import { useGoogleAuth } from '@/contexts/GoogleAuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { 
  Inbox, 
  Star, 
  Send, 
  Archive, 
  Trash2, 
  Tag, 
  Plus, 
  Search,
  Folder,
  Mail,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react'

interface LabelManagerProps {
  onLabelSelect?: (labelId: string, labelName: string) => void
  selectedLabelId?: string
  showEmailCounts?: boolean
}

const SYSTEM_LABELS = {
  'INBOX': { name: 'Inbox', icon: Inbox, color: 'blue' },
  'STARRED': { name: 'Starred', icon: Star, color: 'yellow' },
  'SENT': { name: 'Sent', icon: Send, color: 'green' },
  'DRAFT': { name: 'Drafts', icon: Mail, color: 'gray' },
  'SPAM': { name: 'Spam', icon: AlertCircle, color: 'red' },
  'TRASH': { name: 'Trash', icon: Trash2, color: 'red' },
  'IMPORTANT': { name: 'Important', icon: Tag, color: 'orange' },
  'CATEGORY_PERSONAL': { name: 'Personal', icon: Folder, color: 'purple' },
  'CATEGORY_SOCIAL': { name: 'Social', icon: Folder, color: 'blue' },
  'CATEGORY_PROMOTIONS': { name: 'Promotions', icon: Folder, color: 'green' },
  'CATEGORY_UPDATES': { name: 'Updates', icon: Folder, color: 'cyan' },
  'CATEGORY_FORUMS': { name: 'Forums', icon: Folder, color: 'indigo' },
}

export function LabelManager({ 
  onLabelSelect, 
  selectedLabelId, 
  showEmailCounts = true 
}: LabelManagerProps) {
  const { isConnected } = useGoogleAuth()
  const [labels, setLabels] = useState<GmailLabel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showUserLabels, setShowUserLabels] = useState(true)
  const [showSystemLabels, setShowSystemLabels] = useState(true)

  const loadLabels = async () => {
    if (!isConnected) return

    setLoading(true)
    setError(null)

    try {
      // Initialize Gmail service first
      await gmailService.initialize()
      const labelsData = await gmailService.getLabels()
      setLabels(labelsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load labels')
      console.error('Error loading labels:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isConnected) {
      loadLabels()
    }
  }, [isConnected])

  const filteredLabels = labels.filter(label => {
    const matchesSearch = label.name.toLowerCase().includes(searchTerm.toLowerCase())
    const isSystemLabel = Object.keys(SYSTEM_LABELS).includes(label.id)
    const isUserLabel = !isSystemLabel && label.type === 'user'
    
    if (!matchesSearch) return false
    if (isSystemLabel && !showSystemLabels) return false
    if (isUserLabel && !showUserLabels) return false
    
    return true
  })

  const systemLabels = filteredLabels.filter(label => Object.keys(SYSTEM_LABELS).includes(label.id))
  const userLabels = filteredLabels.filter(label => !Object.keys(SYSTEM_LABELS).includes(label.id) && label.type === 'user')

  const handleLabelClick = (label: GmailLabel) => {
    if (onLabelSelect) {
      onLabelSelect(label.id, label.name)
    }
  }

  const getLabelIcon = (label: GmailLabel) => {
    const systemLabel = SYSTEM_LABELS[label.id as keyof typeof SYSTEM_LABELS]
    if (systemLabel) {
      const IconComponent = systemLabel.icon
      return <IconComponent className="h-4 w-4" />
    }
    return <Tag className="h-4 w-4" />
  }

  const getLabelColor = (label: GmailLabel) => {
    const systemLabel = SYSTEM_LABELS[label.id as keyof typeof SYSTEM_LABELS]
    if (systemLabel) {
      return systemLabel.color
    }
    if (label.color) {
      return 'custom'
    }
    return 'gray'
  }

  const formatCount = (count: number = 0) => {
    if (count === 0) return ''
    if (count > 999) return '999+'
    return count.toString()
  }

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Connect your Google account to view labels</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Labels
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadLabels}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search labels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center space-x-4 text-sm">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showSystemLabels}
              onChange={(e) => setShowSystemLabels(e.target.checked)}
              className="rounded"
            />
            <span>System</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showUserLabels}
              onChange={(e) => setShowUserLabels(e.target.checked)}
              className="rounded"
            />
            <span>Custom</span>
          </label>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading labels...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-800 text-sm font-medium">Error:</p>
            <p className="text-red-700 text-sm">{error}</p>
            <Button size="sm" variant="outline" onClick={loadLabels} className="mt-2">
              Try Again
            </Button>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {systemLabels.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">System Labels</h4>
                <div className="space-y-1">
                  {systemLabels.map((label) => (
                    <Button
                      key={label.id}
                      variant={selectedLabelId === label.id ? "default" : "ghost"}
                      className="w-full justify-between h-auto py-2"
                      onClick={() => handleLabelClick(label)}
                    >
                      <div className="flex items-center space-x-2">
                        {getLabelIcon(label)}
                        <span className="text-sm">{label.name}</span>
                      </div>
                      {showEmailCounts && (
                        <div className="flex items-center space-x-1">
                          {label.messagesUnread !== undefined && label.messagesUnread > 0 && (
                            <Badge variant="destructive" className="text-xs px-1 min-w-[20px] h-5">
                              {formatCount(label.messagesUnread)}
                            </Badge>
                          )}
                          {label.messagesTotal !== undefined && (
                            <Badge variant="secondary" className="text-xs px-1 min-w-[20px] h-5">
                              {formatCount(label.messagesTotal)}
                            </Badge>
                          )}
                        </div>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {systemLabels.length > 0 && userLabels.length > 0 && <Separator />}

            {userLabels.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Custom Labels</h4>
                <div className="space-y-1">
                  {userLabels.map((label) => (
                    <Button
                      key={label.id}
                      variant={selectedLabelId === label.id ? "default" : "ghost"}
                      className="w-full justify-between h-auto py-2"
                      onClick={() => handleLabelClick(label)}
                    >
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: label.color?.backgroundColor || '#6b7280',
                          }}
                        />
                        <span className="text-sm">{label.name}</span>
                      </div>
                      {showEmailCounts && (
                        <div className="flex items-center space-x-1">
                          {label.messagesUnread !== undefined && label.messagesUnread > 0 && (
                            <Badge variant="destructive" className="text-xs px-1 min-w-[20px] h-5">
                              {formatCount(label.messagesUnread)}
                            </Badge>
                          )}
                          {label.messagesTotal !== undefined && (
                            <Badge variant="secondary" className="text-xs px-1 min-w-[20px] h-5">
                              {formatCount(label.messagesTotal)}
                            </Badge>
                          )}
                        </div>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {filteredLabels.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No labels found</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}