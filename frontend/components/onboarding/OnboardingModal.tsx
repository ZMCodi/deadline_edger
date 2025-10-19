'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useGoogleAuth } from '@/contexts/GoogleAuthContext'
import { GoogleConnect } from '@/components/google/GoogleConnect'
import { submitOnboarding } from '@/lib/api'
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'

interface OnboardingModalProps {
  isOpen: boolean
  onComplete: () => void
}

interface FormData {
  preferences: string[]
  calendar_url: string
  context: Record<string, any>
}

const PREFERENCE_OPTIONS = [
  { id: 'email_notifications', label: 'Email Notifications', description: 'Get notified about important updates' },
  { id: 'calendar_sync', label: 'Calendar Sync', description: 'Automatically sync with your calendar' },
  { id: 'task_reminders', label: 'Task Reminders', description: 'Receive reminders for upcoming tasks' },
  { id: 'weekly_reports', label: 'Weekly Reports', description: 'Get weekly productivity summaries' },
  { id: 'priority_alerts', label: 'Priority Alerts', description: 'Get alerts for high-priority items' }
]

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { tokens: googleTokens, isConnected: isGoogleConnected } = useGoogleAuth()
  
  const [formData, setFormData] = useState<FormData>({
    preferences: [],
    calendar_url: '',
    context: {}
  })

  const totalSteps = 4

  const handlePreferenceChange = (preferenceId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      preferences: checked 
        ? [...prev.preferences, preferenceId]
        : prev.preferences.filter(id => id !== preferenceId)
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const onboardingData = {
        context: formData.context,
        preferences: formData.preferences,
        calendar_url: formData.calendar_url,
        google_token: googleTokens ? {
          access_token: googleTokens.access_token,
          refresh_token: googleTokens.refresh_token,
          scope: googleTokens.scope,
          token_type: googleTokens.token_type,
          expiry_date: googleTokens.expiry_date.toString()
        } : null
      }

      await submitOnboarding(onboardingData)
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding')
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps))
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1))

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Welcome to Deadline Edger! 🎯</CardTitle>
              <CardDescription>
                Let's get you set up with a personalized experience. This will only take a minute.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">What we'll set up:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Your notification preferences</li>
                  <li>• Calendar integration</li>
                  <li>• Google account connection</li>
                  <li>• AI-powered task management</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Customize Your Experience</CardTitle>
              <CardDescription>
                Choose which features and notifications you'd like to enable
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {PREFERENCE_OPTIONS.map((option) => (
                <div key={option.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={option.id}
                    checked={formData.preferences.includes(option.id)}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange(option.id, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <label 
                      htmlFor={option.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {option.label}
                    </label>
                    <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Connect Your Google Account</CardTitle>
              <CardDescription>
                Connect your Google account to enable calendar and email features for AI assistance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleConnect />
              {isGoogleConnected && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <p className="text-sm text-green-800">Google account connected successfully!</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Calendar Integration</CardTitle>
              <CardDescription>
                Add your calendar URL for enhanced scheduling features (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="calendar-url" className="text-sm font-medium">
                  Calendar URL (Optional)
                </label>
                <Input
                  id="calendar-url"
                  type="url"
                  placeholder="https://calendar.google.com/calendar/..."
                  value={formData.calendar_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, calendar_url: e.target.value }))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This helps us provide better scheduling recommendations
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium mb-2">Setup Summary:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Preferences selected:</span>
                    <Badge variant="secondary">{formData.preferences.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Google connected:</span>
                    <Badge variant={isGoogleConnected ? "default" : "secondary"}>
                      {isGoogleConnected ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Calendar URL:</span>
                    <Badge variant="secondary">
                      {formData.calendar_url ? "Set" : "Not set"}
                    </Badge>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return true
      case 2:
        return true // Preferences are optional
      case 3:
        return true // Google connection is optional
      case 4:
        return true
      default:
        return false
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="sr-only">
            Onboarding - Step {step} of {totalSteps}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Complete the onboarding process to set up your Deadline Edger account
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Step {step} of {totalSteps}
            </div>
            <div className="flex space-x-1">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i + 1 <= step ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step content */}
          {renderStep()}

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            {step === totalSteps ? (
              <Button 
                onClick={handleSubmit} 
                disabled={!canProceed() || isSubmitting}
              >
                {isSubmitting ? 'Setting up...' : 'Complete Setup'}
              </Button>
            ) : (
              <Button 
                onClick={nextStep} 
                disabled={!canProceed()}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}