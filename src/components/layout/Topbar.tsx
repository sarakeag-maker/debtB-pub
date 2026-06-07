'use client'

import { signOut } from 'next-auth/react'
import { LogOut, ChevronDown } from 'lucide-react'

interface TopbarProps {
  userName: string
  role: string
}

const ROLE_LABELS: Record<string, string> = {
  SOLICITOR: 'Solicitor',
  MANAGING_AGENT: 'Managing Agent',
  CLIENT: 'Client',
}

export function Topbar({ userName, role }: TopbarProps) {
  function handleSignOut() {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-end px-6 gap-4">
      <div className="flex items-center gap-3">
        {/* Role badge */}
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {ROLE_LABELS[role] ?? role}
        </span>

        {/* User name */}
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-xs font-semibold text-gray-600">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-700">{userName}</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </header>
  )
}
