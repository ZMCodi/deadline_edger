// Google API client types and initialization
declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: any) => void
            error_callback?: (error: any) => void
          }) => {
            requestAccessToken: () => void
          }
          hasGrantedAllScopes: (tokenResponse: any, ...scopes: string[]) => boolean
          hasGrantedAnyScope: (tokenResponse: any, ...scopes: string[]) => boolean
          revoke: (accessToken: string, callback?: () => void) => void
        }
      }
    }
    gapi: {
      load: (api: string, callback: () => void) => void
      client: {
        init: (config: { apiKey?: string; discoveryDocs?: string[] }) => Promise<void>
        request: (config: { path: string; method?: string; body?: any }) => Promise<any>
        gmail?: any
        calendar?: any
      }
    }
  }
}

export const loadGoogleAPI = (): Promise<void> => {
  return new Promise((resolve) => {
    // Check if already loaded
    if (typeof window !== 'undefined' && window.google && window.gapi) {
      resolve()
      return
    }

    // Load Google Identity Services
    const gisScript = document.createElement('script')
    gisScript.src = 'https://accounts.google.com/gsi/client'
    gisScript.async = true
    gisScript.defer = true

    // Load Google API Client
    const gapiScript = document.createElement('script')
    gapiScript.src = 'https://apis.google.com/js/api.js'
    gapiScript.async = true
    gapiScript.defer = true

    let scriptsLoaded = 0
    const onScriptLoad = () => {
      scriptsLoaded++
      if (scriptsLoaded === 2) {
        // Initialize GAPI client
        if (window.gapi) {
          window.gapi.load('client', () => {
            resolve()
          })
        } else {
          resolve()
        }
      }
    }

    gisScript.onload = onScriptLoad
    gapiScript.onload = onScriptLoad

    document.head.appendChild(gisScript)
    document.head.appendChild(gapiScript)
  })
}

export const initializeGoogleClient = async () => {
  await window.gapi.client.init({
    discoveryDocs: [
      'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest',
      'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
    ]
  })
}