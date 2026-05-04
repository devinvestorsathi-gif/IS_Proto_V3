import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDateTime } from '@/lib/utils/formatters'
import type { Notification } from '@/lib/types'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifications = [] } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Mark all as read
  await supabase.from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id).eq('is_read', false)

  const typeColors: Record<string, string> = {
    info:    'border-blue-500/30 bg-blue-500/5',
    success: 'border-green-500/30 bg-green-500/5',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    error:   'border-red-500/30 bg-red-500/5',
  }
  const typeIcons: Record<string, string> = {
    info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌',
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">Notifications</h2>
        <p className="text-text-secondary text-sm mt-0.5">{notifications?.length ?? 0} notifications</p>
      </div>
      {!notifications || notifications.length === 0 ? (
        <div className="is-card py-16 text-center text-text-secondary text-sm">
          No notifications yet. You&apos;re all caught up! 🎉
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: Notification) => (
            <div key={n.id} className={`is-card border-l-2 ${typeColors[n.type] ?? typeColors.info} p-4 flex gap-3`}>
              <span className="text-lg flex-shrink-0">{typeIcons[n.type] ?? 'ℹ️'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-text-primary text-sm font-medium">{n.title}</p>
                  <span className="text-text-secondary text-xs flex-shrink-0">{formatDateTime(n.created_at)}</span>
                </div>
                <p className="text-text-secondary text-sm mt-0.5">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}