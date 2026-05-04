'use client'

import { Bell } from 'lucide-react'
import Link from 'next/link'
import type { UserRole } from '@/lib/types'
import { ROLE_LABELS } from '@/lib/types'

interface TopbarProps {
  userName: string
  userRole: UserRole
  unreadCount?: number
  pageTitle?: string
}

export default function Topbar({ userName, userRole, unreadCount = 0, pageTitle }: TopbarProps) {
  return (
    <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 flex-shrink-0">
      {/* Page title */}
      <h1 className="text-text-primary font-semibold text-base">
        {pageTitle ?? 'Dashboard'}
      </h1>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications bell */}
        <Link href="/notifications" className="relative text-text-secondary hover:text-text-primary transition-colors">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold rounded-full
                             flex items-center justify-center text-background text-[9px] font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User info */}
        <div className="flex items-center gap-2 pl-4 border-l border-border">
          <div className="w-7 h-7 bg-gold/20 border border-gold/30 rounded-full
                          flex items-center justify-center text-gold text-xs font-semibold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-text-primary text-sm font-medium leading-tight">{userName}</p>
            <p className="text-text-secondary text-xs">{ROLE_LABELS[userRole]}</p>
          </div>
        </div>
      </div>
    </header>
  )
}