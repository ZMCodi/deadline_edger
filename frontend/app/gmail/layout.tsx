import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gmail - Deadline Edger',
  description: 'Access and manage your Gmail emails',
}

export default function GmailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}