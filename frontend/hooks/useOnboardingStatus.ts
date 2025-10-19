import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { checkOnboardingStatus } from '@/lib/api'

export function useOnboardingStatus() {
  const { user, loading: authLoading } = useAuth()
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkStatus = async () => {
    if (!user || authLoading) return

    setLoading(true)
    setError(null)

    try {
      const onboarded = await checkOnboardingStatus()
      setIsOnboarded(onboarded)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check onboarding status')
      setIsOnboarded(false) // Default to not onboarded on error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [user, authLoading])

  const refreshStatus = () => {
    checkStatus()
  }

  return {
    isOnboarded,
    loading,
    error,
    refreshStatus,
    needsOnboarding: user && !authLoading && isOnboarded === false
  }
}