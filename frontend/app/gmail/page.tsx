'use client'

import { useState } from 'react'
import { GmailMessage } from '@/lib/gmail-service'
import { EmailList } from '@/components/gmail/EmailList'
import { EmailDetail } from '@/components/gmail/EmailDetail'
import { EmailSearch } from '@/components/gmail/EmailSearch'
import { LabelManager } from '@/components/gmail/LabelManager'
import { GoogleConnect } from '@/components/google/GoogleConnect'
import { useGoogleAuth } from '@/contexts/GoogleAuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Mail, 
  Search, 
  Folder, 
  Settings,
  Menu,
  X
} from 'lucide-react'

export default function GmailPage() {
  const { isConnected } = useGoogleAuth()
  const [selectedEmail, setSelectedEmail] = useState<GmailMessage | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLabelId, setSelectedLabelId] = useState<string>('')
  const [selectedLabelName, setSelectedLabelName] = useState<string>('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [view, setView] = useState<'inbox' | 'search' | 'label'>('inbox')

  const handleEmailSelect = (email: GmailMessage) => {
    setSelectedEmail(email)
  }

  const handleBackToList = () => {
    setSelectedEmail(null)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setSelectedLabelId('')
    setSelectedLabelName('')
    setView('search')
    setSelectedEmail(null)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setView('inbox')
    setSelectedEmail(null)
  }

  const handleLabelSelect = (labelId: string, labelName: string) => {
    setSelectedLabelId(labelId)
    setSelectedLabelName(labelName)
    setSearchQuery('')
    setView('label')
    setSelectedEmail(null)
    setSidebarOpen(false)
  }

  const handleInboxClick = () => {
    setSelectedLabelId('')
    setSelectedLabelName('')
    setSearchQuery('')
    setView('inbox')
    setSelectedEmail(null)
    setSidebarOpen(false)
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gmail Integration</h1>
            <p className="text-gray-600">
              Connect your Google account to access your Gmail emails
            </p>
          </div>
          <GoogleConnect />
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-80 bg-white border-r transform transition-transform lg:translate-x-0 lg:static lg:inset-0 lg:flex lg:flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Gmail
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 flex-shrink-0">
              <Button
                variant={view === 'inbox' ? 'default' : 'ghost'}
                onClick={handleInboxClick}
                className="w-full justify-start"
              >
                <Mail className="h-4 w-4 mr-2" />
                Inbox
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <LabelManager
                onLabelSelect={handleLabelSelect}
                selectedLabelId={selectedLabelId}
                showEmailCounts={true}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b p-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 min-w-0 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden flex-shrink-0"
                >
                  <Menu className="h-4 w-4" />
                </Button>

                <div className="flex items-center space-x-2 min-w-0">
                  {view === 'search' && <Search className="h-5 w-5 text-gray-500 flex-shrink-0" />}
                  {view === 'label' && <Folder className="h-5 w-5 text-gray-500 flex-shrink-0" />}
                  {view === 'inbox' && <Mail className="h-5 w-5 text-gray-500 flex-shrink-0" />}
                  <h1 className="text-xl font-semibold truncate">
                    {view === 'search' && `Search: ${searchQuery}`}
                    {view === 'label' && selectedLabelName}
                    {view === 'inbox' && 'Inbox'}
                  </h1>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                <GoogleConnect compact />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {selectedEmail ? (
              <div className="h-full overflow-y-auto">
                <div className="p-4">
                  <EmailDetail
                    email={selectedEmail}
                    onBack={handleBackToList}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                {/* Search Bar */}
                <div className="p-4 bg-white border-b flex-shrink-0">
                  <EmailSearch
                    onSearch={handleSearch}
                    onClear={handleClearSearch}
                    initialQuery={searchQuery}
                  />
                </div>

                {/* Email List */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4">
                    <EmailList
                      query={view === 'search' ? searchQuery : undefined}
                      labelId={view === 'label' ? selectedLabelId : undefined}
                      onEmailSelect={handleEmailSelect}
                      maxResults={20}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}