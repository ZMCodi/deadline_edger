import { ReactNode } from 'react'

interface HeaderProps {
  title: string
  leftContent?: ReactNode
  rightContent?: ReactNode
}

export function Header({ title, leftContent, rightContent }: HeaderProps) {
  return (
    <header className="border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center space-x-3">
            {leftContent}
            <h1 className="text-base font-medium text-gray-900">{title}</h1>
          </div>
          {rightContent && (
            <div className="flex items-center space-x-2">
              {rightContent}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
