'use client'

import { useGoogleAuth } from '@/contexts/GoogleAuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Mail, Calendar, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'

interface GoogleConnectProps {
  compact?: boolean
}

export function GoogleConnect({ compact = false }: GoogleConnectProps) {
  const { user, isConnected, isLoading, error, isGoogleLoaded, signInWithGoogle, signOut, hasScope, refreshTokens, isRefreshingTokens } = useGoogleAuth()

  const scopeStatus = [
    {
      name: 'Gmail (Read)',
      scope: 'https://www.googleapis.com/auth/gmail.readonly',
      icon: Mail,
      description: 'Read your emails'
    },
    {
      name: 'Calendar (Read)',
      scope: 'https://www.googleapis.com/auth/calendar.readonly',
      icon: Calendar,
      description: 'View your calendars'
    },
    {
      name: 'Calendar (Manage)',
      scope: 'https://www.googleapis.com/auth/calendar.events',
      icon: Calendar,
      description: 'Create and manage events'
    }
  ]

  if (isConnected && user) {
    if (compact) {
      return (
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.picture} alt={user.name} />
            <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-sm font-medium truncate max-w-[100px]">{user.name}</p>
            <p className="text-xs text-gray-500">Connected</p>
          </div>
          <Button onClick={signOut} variant="ghost" size="sm" className="text-xs">
            Sign Out
          </Button>
        </div>
      )
    }

    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Google Connected
          </CardTitle>
          <CardDescription>
            Your Google account is connected and ready to use
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={user.picture} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Connected Services:</h4>
            {scopeStatus.map((service) => {
              const isGranted = hasScope(service.scope)
              const Icon = service.icon
              return (
                <div key={service.scope} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{service.name}</span>
                  </div>
                  <Badge variant={isGranted ? "default" : "secondary"}>
                    {isGranted ? "Connected" : "Not Connected"}
                  </Badge>
                </div>
              )
            })}
          </div>

          <div className="space-y-2">
            <Button 
              onClick={refreshTokens} 
              variant="outline" 
              className="w-full"
              disabled={isRefreshingTokens}
            >
              {isRefreshingTokens ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing Tokens...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Tokens
                </>
              )}
            </Button>
            <Button onClick={signOut} variant="outline" className="w-full">
              Disconnect Google
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          Connect Google Account
        </CardTitle>
        <CardDescription>
          Connect your Google account to access Gmail and Calendar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">This will give access to:</h4>
          {scopeStatus.map((service) => {
            const Icon = service.icon
            return (
              <div key={service.scope} className="flex items-center space-x-2">
                <Icon className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{service.name}</p>
                  <p className="text-xs text-gray-500">{service.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-800 text-sm font-medium">Error:</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {!isGoogleLoaded && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-yellow-800 text-sm">Loading Google APIs...</p>
          </div>
        )}

        <Button 
          onClick={signInWithGoogle} 
          disabled={isLoading || !isGoogleLoaded}
          className="w-full"
        >
          {isLoading ? 'Connecting...' : !isGoogleLoaded ? 'Loading...' : 'Connect Google Account'}
        </Button>
      </CardContent>
    </Card>
  )
}