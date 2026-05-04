'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image' // Added for the new logo
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, UserCheck, BarChart3,
  Bell, ChevronLeft, ChevronRight, LogOut, Settings
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/lib/types'

interface NavItem {
  label:     string
  href:      string
  icon:      React.ReactNode
  roles:     UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href:  '/dashboard',
    icon:  <LayoutDashboard size={18} />,
    roles: ['sales_rep', 'team_lead', 'admin'],
  },
  {
    label: 'Leads',
    href:  '/leads',
    icon:  <BarChart3 size={18} />,
    roles: ['sales_rep', 'team_lead', 'admin'],
  },
  {
    label: 'Clients',
    href:  '/clients',
    icon:  <UserCheck size={18} />,
    roles: ['sales_rep', 'team_lead', 'admin'],
  },
  {
    label: 'Salespersons',
    href:  '/salespersons',
    icon:  <Users size={18} />,
    roles: ['team_lead', 'admin'],
  },
  {
    label: 'Users',
    href:  '/users',
    icon:  <Settings size={18} />,
    roles: ['admin'],
  },
  {
    label: 'Notifications',
    href:  '/notifications',
    icon:  <Bell size={18} />,
    roles: ['sales_rep', 'team_lead', 'admin'],
  },
]

interface SidebarProps {
  userRole: UserRole
  userName: string
}

export default function Sidebar({ userRole, userName }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(userRole))

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className={`
        relative flex flex-col h-screen bg-[#09090b] border-r border-zinc-800/60
        transition-all duration-300 ease-in-out flex-shrink-0 z-40 shadow-xl
        ${collapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Logo Section - Updated with Image */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-5'} py-6 border-b border-zinc-800/60`}>
        <div className="relative w-9 h-9 flex-shrink-0">
          <Image 
            src="/logo.png" 
            alt="Investor Sathi" 
            fill 
            className="object-contain"
            priority
          />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-semibold text-sm leading-tight tracking-wide truncate">
              Investor Sathi
            </p>
            <p className="text-gold text-[10px] font-bold tracking-widest uppercase mt-0.5">CRM</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto scrollbar-none">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-200
                ${isActive
                  ? 'bg-gradient-to-r from-gold/10 to-transparent text-gold border border-gold/20 shadow-inner'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                }
                ${collapsed ? 'justify-center px-0' : ''}
              `}
              title={collapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate tracking-wide">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-zinc-800/60 p-4 bg-[#09090b]">
        {!collapsed && (
          <div className="px-2 mb-4">
            <p className="text-sm text-white font-medium truncate">{userName}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                {userRole.replace('_', ' ')}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`
            flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium
            text-zinc-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20
            border border-transparent transition-all duration-200
            ${collapsed ? 'justify-center px-0' : ''}
          `}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-24 w-6 h-6 bg-[#18181b] border border-zinc-700
                   rounded-full flex items-center justify-center text-zinc-400
                   hover:text-gold hover:border-gold shadow-lg transition-colors z-50"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}