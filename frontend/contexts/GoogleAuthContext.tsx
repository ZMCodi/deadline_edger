'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { loadGoogleAPI, initializeGoogleClient } from '@/lib/google-client'
import { submitGoogleToken } from '@/lib/api'

interface GoogleTokens {
  access_token: string
  refresh_token?: string | null
  scope: string
  token_type: string
  expiry_date: number
}

interface GoogleUser {
  id: string
  email: string
  name: string
  picture: string
}

interface GoogleAuthContextType {
  user: GoogleUser | null
  tokens: GoogleTokens | null
  isConnected: boolean
  isLoading: boolean
  error: string | null
  isGoogleLoaded: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  hasScope: (scope: string) => boolean
  refreshTokens: () => Promise<void>
  isRefreshingTokens: boolean
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined)

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events'
].join(' ')

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null)
  const [tokens, setTokens] = useState<GoogleTokens | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshingTokens, setIsRefreshingTokens] = useState(false)

  useEffect(() => {
    const initGoogle = async () => {
      try {
        await loadGoogleAPI()
        
        if (window.gapi) {
          await initializeGoogleClient()
        }
        
        setIsGoogleLoaded(true)
      } catch (error) {
        setError(`Failed to load Google APIs: ${error}`)
      }
    }

    initGoogle()

    // Load saved tokens from localStorage on mount
    const savedTokens = localStorage.getItem('google_tokens')
    if (savedTokens) {
      try {
        const parsedTokens = JSON.parse(savedTokens)
        // Check if token is expired
        if (parsedTokens.expiry_date && Date.now() < parsedTokens.expiry_date) {
          setTokens(parsedTokens)
          loadUserInfo(parsedTokens.access_token)
        } else {
          localStorage.removeItem('google_tokens')
        }
      } catch (error) {
        localStorage.removeItem('google_tokens')
      }
    }
  }, [])

  const loadUserInfo = async (accessToken: string) => {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      })
      
      if (response.ok) {
        const userInfo = await response.json()
        setUser({
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name || userInfo.email,
          picture: userInfo.picture || ''
        })
      } else {
        await loadUserInfoAlternative(accessToken)
      }
    } catch (error) {
      await loadUserInfoAlternative(accessToken)
    }
  }

  const loadUserInfoAlternative = async (accessToken: string) => {
    try {
      if (window.gapi?.client) {
        const response = await window.gapi.client.request({
          path: 'https://www.googleapis.com/oauth2/v2/userinfo',
          method: 'GET'
        })
        
        if (response.body) {
          const userInfo = JSON.parse(response.body)
          setUser({
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name || userInfo.email,
            picture: userInfo.picture || ''
          })
        }
      }
    } catch (error) {
      // Fallback: create minimal user object
      setUser({
        id: 'unknown',
        email: 'user@gmail.com',
        name: 'Google User',
        picture: ''
      })
    }
  }

  const sendTokensToBackend = async (googleTokens: GoogleTokens) => {
    try {
      // Format tokens to match backend UserToken model
      const tokenData = {
        access_token: googleTokens.access_token,
        refresh_token: googleTokens.refresh_token || '', // Backend expects string, not null
        scope: googleTokens.scope,
        token_type: googleTokens.token_type,
        expiry_date: googleTokens.expiry_date.toString()
      }
      
      await submitGoogleToken(tokenData)
      console.log('Tokens successfully sent to backend')
    } catch (error) {
      console.error('Failed to send tokens to backend:', error)
      // Don't throw here - we still want the frontend connection to work
    }
  }

  const signInWithGoogle = async () => {
    setError(null)
    
    if (!isGoogleLoaded || !window.google) {
      const errorMsg = 'Google APIs not loaded yet'
      setError(errorMsg)
      return
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    
    if (!clientId) {
      const errorMsg = 'Google Client ID not configured'
      setError(errorMsg)
      return
    }

    setIsLoading(true)
    
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            const errorMsg = `OAuth error: ${tokenResponse.error}`
            setError(errorMsg)
            setIsLoading(false)
            return
          }

          const googleTokens: GoogleTokens = {
            access_token: tokenResponse.access_token,
            refresh_token: null, // Browser flow doesn't provide refresh tokens
            scope: tokenResponse.scope,
            token_type: 'Bearer',
            expiry_date: Date.now() + (tokenResponse.expires_in * 1000)
          }

          setTokens(googleTokens)
          localStorage.setItem('google_tokens', JSON.stringify(googleTokens))
          
          await loadUserInfo(googleTokens.access_token)
          
          // Send tokens to backend
          await sendTokensToBackend(googleTokens)
          
          setIsLoading(false)
        },
        error_callback: (error: any) => {
          const errorMsg = `OAuth error: ${error}`
          setError(errorMsg)
          setIsLoading(false)
        }
      })

      tokenClient.requestAccessToken()
    } catch (error) {
      const errorMsg = `Sign in error: ${error}`
      setError(errorMsg)
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    // Revoke the token if possible
    if (tokens?.access_token && window.google?.accounts?.oauth2) {
      try {
        window.google.accounts.oauth2.revoke(tokens.access_token)
      } catch (error) {
        console.error('Error revoking token:', error)
      }
    }
    
    setUser(null)
    setTokens(null)
    localStorage.removeItem('google_tokens')
  }

  const hasScope = (scope: string) => {
    return tokens?.scope.includes(scope) || false
  }

  const refreshTokens = async () => {
    if (!tokens) {
      setError('No tokens available to refresh')
      return
    }

    setIsRefreshingTokens(true)
    setError(null)

    try {
      await sendTokensToBackend(tokens)
      console.log('Tokens refreshed successfully')
    } catch (error) {
      const errorMsg = `Failed to refresh tokens: ${error}`
      setError(errorMsg)
      console.error(errorMsg)
    } finally {
      setIsRefreshingTokens(false)
    }
  }

  const value = {
    user,
    tokens,
    isConnected: !!tokens && !!user,
    isLoading,
    error,
    isGoogleLoaded,
    signInWithGoogle,
    signOut,
    hasScope,
    refreshTokens,
    isRefreshingTokens
  }

  return (
    <GoogleAuthContext.Provider value={value}>
      {children}
    </GoogleAuthContext.Provider>
  )
}

export function useGoogleAuth() {
  const context = useContext(GoogleAuthContext)
  if (context === undefined) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider')
  }
  return context
}