'use client'

import { useEffect } from 'react'
import { useGoogleAuth } from '@/contexts/GoogleAuthContext'
import { gmailService } from '@/lib/gmail-service'

export function useGmailService() {
  const {
    isConnected,
    hasGmailReadAccess,
    hasGmailWriteAccess,
    quotaExceeded,
    lastApiError,
    clearApiError
  } = useGoogleAuth()

  useEffect(() => {
    if (isConnected) {
      // Set up error handlers for the Gmail service
      gmailService.setErrorHandlers(
        () => {
          // This will be handled by the context
          console.log('Gmail quota exceeded')
        },
        (error: string) => {
          // This will be handled by the context
          console.log('Gmail API error:', error)
        }
      )
    }
  }, [isConnected])

  return {
    gmailService,
    isConnected,
    hasGmailReadAccess,
    hasGmailWriteAccess,
    quotaExceeded,
    lastApiError,
    clearApiError,
    canReadEmails: isConnected && hasGmailReadAccess,
    canModifyEmails: isConnected && hasGmailWriteAccess
  }
}