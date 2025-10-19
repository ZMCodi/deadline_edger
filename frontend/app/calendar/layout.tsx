import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Calendar - Deadline Edger',
  description: 'View and manage your calendar events and tasks',
}

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}