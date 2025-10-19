
'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus'
import { AuthModal } from '@/components/auth/AuthModal'
import { UserMenu } from '@/components/auth/UserMenu'
import { GoogleConnect } from '@/components/google/GoogleConnect'
import { OnboardingModal } from '@/components/onboarding/OnboardingModal'
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

  const handleOnboardingComplete = () => {
    refreshStatus()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Deadline Edger
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <UserMenu />
              ) : (
                <Button onClick={() => setShowAuthModal(true)}>
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Deadline Edger
            </h2>
            {user ? (
              needsOnboarding ? (
                <div className="space-y-4">
                  <p className="text-lg text-gray-600">
                    Welcome! Let's get you set up.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-blue-800 text-sm">
                      Please complete the onboarding process to access all features.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-lg text-gray-600">
                    Hello, {user.email}! You're successfully signed in.
                  </p>
                  <div className="bg-white shadow rounded-lg p-6 max-w-md mx-auto">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Your Account
                    </h3>
                    <p className="text-sm text-gray-600">
                      Email: {user.email}
                    </p>
                    <p className="text-sm text-gray-600">
                      User ID: {user.id}
                    </p>
                  </div>
                  <div className="flex flex-col items-center space-y-4">
                    <Button 
                      onClick={() => window.location.href = '/chat'}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Chat with AI Assistant
                    </Button>
                    <GoogleConnect />
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-4">
                <p className="text-lg text-gray-600">
                  Please sign in to access your account.
                </p>
                <Button 
                  onClick={() => setShowAuthModal(true)}
                  size="lg"
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      
      <OnboardingModal
        isOpen={!!needsOnboarding}
        onComplete={handleOnboardingComplete}
      />
    </div>
  )
}
