export interface GmailMessage {
  id: string
  threadId: string
  labelIds: string[]
  snippet: string
  historyId: string
  internalDate: string
  sizeEstimate: number
  payload: {
    partId: string
    mimeType: string
    filename: string
    headers: Array<{
      name: string
      value: string
    }>
    body?: {
      attachmentId?: string
      size: number
      data?: string
    }
    parts?: Array<{
      partId: string
      mimeType: string
      filename: string
      body?: {
        attachmentId?: string
        size: number
        data?: string
      }
      headers?: Array<{
        name: string
        value: string
      }>
    }>
  }
}

export interface GmailThread {
  id: string
  historyId: string
  messages: GmailMessage[]
}

export interface GmailLabel {
  id: string
  name: string
  messageListVisibility: string
  labelListVisibility: string
  type: string
  messagesTotal?: number
  messagesUnread?: number
  threadsTotal?: number
  threadsUnread?: number
  color?: {
    textColor: string
    backgroundColor: string
  }
}

export interface EmailListResponse {
  messages: Array<{
    id: string
    threadId: string
  }>
  nextPageToken?: string
  resultSizeEstimate: number
}

export interface GmailSearchQuery {
  q?: string
  labelIds?: string[]
  includeSpamTrash?: boolean
  maxResults?: number
  pageToken?: string
}

export class GmailService {
  private isInitialized = false
  private onQuotaExceeded?: () => void
  private onApiError?: (error: string) => void

  setErrorHandlers(onQuotaExceeded?: () => void, onApiError?: (error: string) => void) {
    this.onQuotaExceeded = onQuotaExceeded
    this.onApiError = onApiError
  }

  async initialize() {
    if (this.isInitialized) return
    
    // Wait for GAPI to be loaded
    if (!window.gapi) {
      throw new Error('Google API client not loaded')
    }
    
    // Wait for client to be initialized
    if (!window.gapi.client) {
      throw new Error('Google API client not initialized')
    }
    
    // Check if Gmail API is available
    if (!window.gapi.client.gmail) {
      throw new Error('Gmail API not loaded. Make sure Google APIs are initialized with Gmail discovery docs.')
    }
    
    // Check if user has valid auth token
    const token = window.gapi.client.getToken()
    if (!token || !token.access_token) {
      throw new Error('No valid authentication token. Please sign in with Google.')
    }
    
    this.isInitialized = true
  }

  private handleApiError(error: any) {
    console.error('Gmail API Error:', error)
    
    if (error.status === 429 || (error.result && error.result.error && error.result.error.code === 429)) {
      this.onQuotaExceeded?.()
      throw new Error('Gmail API quota exceeded. Please try again later.')
    }
    
    if (error.status === 403) {
      const errorMessage = 'Insufficient permissions for Gmail API. Please reconnect your account.'
      this.onApiError?.(errorMessage)
      throw new Error(errorMessage)
    }
    
    if (error.status === 401) {
      const errorMessage = 'Gmail API authentication failed. Please reconnect your account.'
      this.onApiError?.(errorMessage)
      throw new Error(errorMessage)
    }
    
    const errorMessage = error.result?.error?.message || error.message || 'Unknown Gmail API error'
    this.onApiError?.(errorMessage)
    throw new Error(errorMessage)
  }

  private async executeWithErrorHandling<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      this.handleApiError(error)
      throw error
    }
  }

  async getMessages(query: GmailSearchQuery = {}): Promise<EmailListResponse> {
    await this.initialize()
    
    return this.executeWithErrorHandling(async () => {
      const params: any = {
        userId: 'me',
        maxResults: query.maxResults || 10,
        includeSpamTrash: query.includeSpamTrash || false
      }
      
      if (query.q) params.q = query.q
      if (query.labelIds) params.labelIds = query.labelIds
      if (query.pageToken) params.pageToken = query.pageToken
      
      const response = await window.gapi.client.gmail.users.messages.list(params)
      return response.result
    })
  }

  async getMessage(messageId: string, format: 'minimal' | 'full' | 'raw' | 'metadata' = 'full'): Promise<GmailMessage> {
    await this.initialize()
    
    return this.executeWithErrorHandling(async () => {
      const response = await window.gapi.client.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: format
      })
      
      return response.result
    })
  }

  async getThread(threadId: string, format: 'minimal' | 'full' | 'metadata' = 'full'): Promise<GmailThread> {
    await this.initialize()
    
    const response = await window.gapi.client.gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: format
    })
    
    return response.result
  }

  async getLabels(): Promise<GmailLabel[]> {
    await this.initialize()
    
    return this.executeWithErrorHandling(async () => {
      const response = await window.gapi.client.gmail.users.labels.list({
        userId: 'me'
      })
      
      return response.result.labels || []
    })
  }

  async searchEmails(query: string, maxResults: number = 10, pageToken?: string): Promise<EmailListResponse> {
    return this.getMessages({
      q: query,
      maxResults,
      pageToken
    })
  }

  async getEmailsByLabel(labelId: string, maxResults: number = 10, pageToken?: string): Promise<EmailListResponse> {
    return this.getMessages({
      labelIds: [labelId],
      maxResults,
      pageToken
    })
  }

  async markAsRead(messageId: string): Promise<void> {
    await this.initialize()
    
    await window.gapi.client.gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      removeLabelIds: ['UNREAD']
    })
  }

  async markAsUnread(messageId: string): Promise<void> {
    await this.initialize()
    
    await window.gapi.client.gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      addLabelIds: ['UNREAD']
    })
  }

  async addLabels(messageId: string, labelIds: string[]): Promise<void> {
    await this.initialize()
    
    await window.gapi.client.gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      addLabelIds: labelIds
    })
  }

  async removeLabels(messageId: string, labelIds: string[]): Promise<void> {
    await this.initialize()
    
    await window.gapi.client.gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      removeLabelIds: labelIds
    })
  }

  getEmailHeader(message: GmailMessage, headerName: string): string | null {
    const header = message.payload.headers.find(h => 
      h.name.toLowerCase() === headerName.toLowerCase()
    )
    return header?.value || null
  }

  getEmailSubject(message: GmailMessage): string {
    return this.getEmailHeader(message, 'Subject') || '(No Subject)'
  }

  getEmailFrom(message: GmailMessage): string {
    return this.getEmailHeader(message, 'From') || 'Unknown Sender'
  }

  getEmailTo(message: GmailMessage): string {
    return this.getEmailHeader(message, 'To') || 'Unknown Recipient'
  }

  getEmailDate(message: GmailMessage): Date {
    const dateStr = this.getEmailHeader(message, 'Date')
    if (dateStr) {
      return new Date(dateStr)
    }
    return new Date(parseInt(message.internalDate))
  }

  getEmailBody(message: GmailMessage): string {
    if (message.payload.body?.data) {
      return this.decodeBase64Url(message.payload.body.data)
    }
    
    if (message.payload.parts) {
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return this.decodeBase64Url(part.body.data)
        }
      }
      
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          return this.decodeBase64Url(part.body.data)
        }
      }
    }
    
    return message.snippet || ''
  }

  private decodeBase64Url(data: string): string {
    let base64 = data.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) {
      base64 += '='
    }
    return decodeURIComponent(escape(atob(base64)))
  }

  formatEmailAddress(address: string): { name: string; email: string } {
    const match = address.match(/^(.*?)\s*<(.+)>$/)
    if (match) {
      return {
        name: match[1].trim().replace(/^["']|["']$/g, ''),
        email: match[2].trim()
      }
    }
    return {
      name: address.trim(),
      email: address.trim()
    }
  }

  isUnread(message: GmailMessage): boolean {
    return message.labelIds.includes('UNREAD')
  }

  isImportant(message: GmailMessage): boolean {
    return message.labelIds.includes('IMPORTANT')
  }

  isStarred(message: GmailMessage): boolean {
    return message.labelIds.includes('STARRED')
  }
}

export const gmailService = new GmailService()