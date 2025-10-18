'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { loadGoogleAPI, initializeGoogleClient } from '@/lib/google-client'

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
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  hasScope: (scope: string) => boolean
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined)

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events'
].join(' ')

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null)
  const [tokens, setTokens] = useState<GoogleTokens | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)

  useEffect(() => {
    const initGoogle = async () => {
      try {
        await loadGoogleAPI()
        if (window.gapi) {
          await initializeGoogleClient()
        }
        setIsGoogleLoaded(true)
      } catch (error) {
        console.error('Error loading Google APIs:', error)
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
        console.error('Error loading saved tokens:', error)
        localStorage.removeItem('google_tokens')
      }
    }
  }, [])

  const loadUserInfo = async (accessToken: string) => {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
      
      if (response.ok) {
        const userInfo = await response.json()
        setUser({
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture
        })
      }
    } catch (error) {
      console.error('Error loading user info:', error)
    }
  }

  const signInWithGoogle = async () => {
    if (!isGoogleLoaded || !window.google) {
      console.error('Google APIs not loaded')
      return
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) {
      console.error('Google Client ID not configured')
      return
    }

    setIsLoading(true)
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            console.error('Google OAuth error:', tokenResponse.error)
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
          setIsLoading(false)
        },
        error_callback: (error: any) => {
          console.error('Google OAuth error:', error)
          setIsLoading(false)
        }
      })

      tokenClient.requestAccessToken()
    } catch (error) {
      console.error('Google sign in error:', error)
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

  const value = {
    user,
    tokens,
    isConnected: !!tokens && !!user,
    isLoading,
    signInWithGoogle,
    signOut,
    hasScope
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