'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Building,
  Upload,
  BarChart2,
  PieChart,
  Users,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['SOLICITOR', 'MANAGING_AGENT', 'CLIENT'] },
  { href: '/instructions', label: 'Instructions', icon: FileText, roles: ['SOLICITOR', 'MANAGING_AGENT', 'CLIENT'] },
  { href: '/properties', label: 'Properties', icon: Building, roles: ['SOLICITOR', 'MANAGING_AGENT', 'CLIENT'] },
  { href: '/import', label: 'Import', icon: Upload, roles: ['SOLICITOR', 'MANAGING_AGENT'] },
  { href: '/analytics', label: 'Analytics', icon: BarChart2, roles: ['SOLICITOR'] },
  { href: '/portfolio', label: 'Portfolio', icon: PieChart, roles: ['CLIENT'] },
  { href: '/admin/users', label: 'Users', icon: Users, roles: ['SOLICITOR'] },
  { href: '/admin/firm', label: 'Firm Settings', icon: Settings, roles: ['SOLICITOR'] },
]

interface SidebarProps {
  role: string
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role))

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <div className="fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-30">
      {/* Firm header */}
      <div className="px-6 py-5 border-b border-gray-200" style={{ backgroundColor: '#1e3a5f' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Harrison &amp; Partners</p>
            <p className="text-blue-200 text-xs">Debt Recovery</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    active
                      ? 'text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                  style={active ? { backgroundColor: '#1e3a5f' } : undefined}
                >
                  <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-white' : 'text-gray-400')} />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200">
        <p className="text-xs text-gray-400">DebtB v1.0</p>
      </div>
    </div>
  )
}
