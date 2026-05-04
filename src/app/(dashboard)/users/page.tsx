import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User, Mail, Shield, Send } from 'lucide-react'
import ResetPasswordButton from '@/components/users/ResetPasswordButton'

export const metadata = {
  title: 'User Management | Admin',
}

export default async function UsersPage() {
  const supabase = await createClient()

  // Verify Admin role one last time
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  // Fetch all 4 user accounts
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active')
    .order('role', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">User Management</h1>
        <p className="text-sm text-zinc-400">Manage account access and security for the CRM team.</p>
      </div>

      <div className="bg-[#121214] border border-zinc-800/60 rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#18181b] border-b border-zinc-800/60 text-zinc-400 text-xs uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-4 px-6">User</th>
              <th className="py-4 px-6">Role</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {users?.map((u) => (
              <tr key={u.id} className="hover:bg-zinc-800/20 transition-colors group">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-white font-medium">{u.full_name}</p>
                      <p className="text-xs text-zinc-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                    u.role === 'admin' ? 'bg-gold/10 text-gold border-gold/20' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                  }`}>
                    <Shield size={10} /> {u.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="text-xs text-zinc-400">{u.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-right">
                  <ResetPasswordButton userId={u.id} userEmail={u.email} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}