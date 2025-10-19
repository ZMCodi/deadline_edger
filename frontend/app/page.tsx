
'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus'
import { AuthModal } from '@/components/auth/AuthModal'
import { UserMenu } from '@/components/auth/UserMenu'
import { GoogleConnect } from '@/components/google/GoogleConnect'
import { OnboardingModal } from '@/components/onboarding/OnboardingModal'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'

export default function Home() {
  const { user, loading } = useAuth()
  const { needsOnboarding, refreshStatus } = useOnboardingStatus()
  const [showAuthModal, setShowAuthModal] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header
        title="Deadline Edger"
        rightContent={
          user ? (
            <UserMenu />
          ) : (
            <Button variant="ghost" onClick={() => setShowAuthModal(true)}>Sign In</Button>
          )
        }
      />

      <main className="max-w-2xl mx-auto py-24 px-4">
        <div className="text-center space-y-6">
          <h2 className="text-4xl font-light tracking-tight text-gray-900">
            {!user ? 'Welcome' : needsOnboarding ? 'Get Started' : `Hello, ${user.email?.split('@')[0]}`}
          </h2>
          
          {!user ? (
            <div className="space-y-6 pt-4">
              <p className="text-sm text-gray-500">
                Sign in to continue
              </p>
              <Button variant="outline" onClick={() => setShowAuthModal(true)}>
                Get Started
              </Button>
            </div>
          ) : needsOnboarding ? (
            <div className="space-y-6 pt-4">
              <p className="text-sm text-gray-500">Complete onboarding to continue</p>
            </div>
          ) : (
            <div className="space-y-8 pt-4">
              <div className="flex flex-col items-center space-y-3">
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/chat'}
                  className="min-w-[200px]"
                >
                  Open Chat
                </Button>
                <GoogleConnect />
              </div>
            </div>
          )}
        </div>
      </main>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <OnboardingModal isOpen={!!needsOnboarding} onComplete={refreshStatus} />
    </div>
  )
}
