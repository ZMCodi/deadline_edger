import { createClient } from '@/lib/supabase/client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface OnboardingData {
  context: Record<string, any>
  preferences: string[]
  calendar_url: string
  google_token: Record<string, any> | null
}

async function getAuthHeaders() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    throw new Error('No authentication token available')
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }
}

export async function checkOnboardingStatus(): Promise<boolean> {
  try {
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${API_BASE_URL}/api/users/onboard`, {
      method: 'GET',
      headers
    })

    if (!response.ok) {
      throw new Error(`Failed to check onboarding status: ${response.statusText}`)
    }

    const responseText = await response.text()
    console.log('Onboarding status response text:', responseText)
    
    // Check if response is HTML (ngrok warning page)
    if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html')) {
      console.error('Received HTML response instead of JSON - backend may not be accessible')
      throw new Error('Backend API not accessible - received HTML response')
    }
    
    // Try to parse as JSON, fallback to boolean interpretation
    try {
      return JSON.parse(responseText)
    } catch {
      // If not valid JSON, interpret as boolean
      return responseText.toLowerCase() === 'true'
    }
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return false
  }
}

export async function submitOnboarding(data: OnboardingData): Promise<boolean> {
  try {
    console.log('Submitting onboarding data:', data)
    console.log('API URL:', API_BASE_URL)
    
    const headers = await getAuthHeaders()
    console.log('Auth headers:', headers)
    
    const response = await fetch(`${API_BASE_URL}/api/users/onboard`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    })

    console.log('Response status:', response.status)
    console.log('Response ok:', response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Response error text:', errorText)
      throw new Error(`Failed to submit onboarding: ${response.status} ${response.statusText} - ${errorText}`)
    }

    // The onboard endpoint doesn't return any content (204 No Content expected)
    // Just check if we got a successful status code
    console.log('Onboarding submitted successfully')
    return true
  } catch (error) {
    console.error('Error submitting onboarding:', error)
    throw error
  }
}

export async function submitGoogleToken(tokenData: Record<string, any>): Promise<boolean> {
  try {
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${API_BASE_URL}/api/users/token`, {
      method: 'POST',
      headers,
      body: JSON.stringify(tokenData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to submit token: ${response.statusText} - ${errorText}`)
    }

    return true
  } catch (error) {
    console.error('Error submitting token:', error)
    throw error
  }
}

interface ChatRequest {
  message: string
}

export interface AgentResponse {
  type_: 'create_task' | 'run_task' | 'reshuffle_calendar' | 'no_task'
  text: string
  tasks?: Array<{
    context: {
      prompt: string
      priority: string
      url?: string
    }
    period: string
    type_: 'EMAIL' | 'WEB' | 'TODO'
    title: string
  }> | null
}

export async function chatWithAgent(message: string): Promise<AgentResponse> {
  try {
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${API_BASE_URL}/api/agent/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message } as ChatRequest)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to chat with agent: ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    return data as AgentResponse
  } catch (error) {
    console.error('Error chatting with agent:', error)
    throw error
  }
}

export interface TaskCreateRequest {
  title: string
  type_: 'EMAIL' | 'WEB' | 'TODO'
  context: {
    prompt: string
    priority: string
    url?: string
  }
  period: string
}

export async function createTask(task: TaskCreateRequest): Promise<boolean> {
  try {
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${API_BASE_URL}/api/task/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(task)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to create task: ${response.statusText} - ${errorText}`)
    }

    return true
  } catch (error) {
    console.error('Error creating task:', error)
    throw error
  }
}

export interface TaskResponse {
  id_: number
  type_: 'EMAIL' | 'WEB' | 'TODO'
  title: string
  context: {
    prompt: string
    priority: string
    url?: string
  }
  period: string
  last_run_ts: string
}

export async function getTasks(): Promise<TaskResponse[]> {
  try {
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${API_BASE_URL}/api/tasks`, {
      method: 'GET',
      headers
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to get tasks: ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    return data as TaskResponse[]
  } catch (error) {
    console.error('Error getting tasks:', error)
    throw error
  }
}