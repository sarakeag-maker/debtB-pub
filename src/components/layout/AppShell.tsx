'use client'

import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface AppShellProps {
  userName: string
  role: string
  children: React.ReactNode
}

export function AppShell({ userName, role, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role={role} />
      <div className="ml-64 flex flex-col min-h-screen">
        <Topbar userName={userName} role={role} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
