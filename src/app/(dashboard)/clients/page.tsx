import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Mail, Phone, MapPin, Users, CheckCircle, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Clients | Investor Sathi CRM',
}

interface ClientProfile {
  id: string
  full_name: string
  phone: string
  email: string
  city: string | null
}

export default async function ClientsPage() {
  const supabase = await createClient()

  // Fetch onboarded clients. 
  // RLS (Row Level Security) automatically ensures sales reps only see their own,
  // team leads see their team's, and admins see all.
  const { data: clients, error } = await supabase
    .from('client_profiles')
    .select(`
      id,
      full_name,
      phone,
      email,
      city
    `)
    .order('full_name', { ascending: true })

  if (error) {
    console.error("Error fetching clients:", error)
  }

  // Safely cast the response to our TypeScript interface
  const typedClients = (clients as ClientProfile[]) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Clients</h1>
        <p className="text-sm text-zinc-400">
          Manage your onboarded clients, view KYC documents, and track payment milestones.
        </p>
      </div>

      {/* Main Content Card */}
      <div className="bg-[#121214] border border-zinc-800/60 rounded-xl overflow-hidden shadow-lg">
        {typedClients.length === 0 ? (
          <div className="py-20 px-6 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-zinc-800/30 rounded-full flex items-center justify-center mb-4 border border-zinc-800/60">
              <Users className="h-8 w-8 text-zinc-500" />
            </div>
            <h3 className="text-white font-medium text-lg mb-2">No Onboarded Clients Yet</h3>
            <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
              Clients only appear here <span className="text-zinc-300 font-semibold">after</span> they click their Magic Link and submit the KYC onboarding form. Changing a lead&apos;s stage to &quot;Converted&quot; is just step one!
            </p>
            <Link 
              href="/leads" 
              className="mt-6 text-sm text-gold hover:text-yellow-400 font-medium flex items-center gap-2 transition-colors border border-gold/20 bg-gold/5 px-4 py-2 rounded-lg hover:bg-gold/10"
            >
              Go to Leads Pipeline <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#18181b] border-b border-zinc-800/60 text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                <tr>
                  <th className="py-4 px-6">Client Name</th>
                  <th className="py-4 px-6">Contact Details</th>
                  <th className="py-4 px-6 hidden md:table-cell">Location</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {typedClients.map((client) => (
                  <tr key={client.id} className="hover:bg-zinc-800/20 transition-colors group">
                    {/* Name & Avatar */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/20 to-yellow-600/20 border border-gold/20 flex items-center justify-center text-gold font-semibold shadow-inner">
                          {client.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium group-hover:text-gold transition-colors">{client.full_name}</p>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">ID: {client.id.split('-')[0]}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="py-4 px-6 space-y-1.5">
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Phone size={13} className="text-zinc-500" />
                        <span className="text-xs">{client.phone}</span>
                      </div>
                      {client.email && (
                        <div className="flex items-center gap-2 text-zinc-300">
                          <Mail size={13} className="text-zinc-500" />
                          <span className="text-xs">{client.email}</span>
                        </div>
                      )}
                    </td>

                    {/* Location */}
                    <td className="py-4 px-6 hidden md:table-cell">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <MapPin size={13} className="text-zinc-500" />
                        <span className="text-xs">{client.city || 'Not provided'}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-6">
                      <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                        <CheckCircle size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                          Onboarded
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/clients/${client.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-gold hover:text-yellow-400 bg-gold/5 hover:bg-gold/10 border border-gold/10 hover:border-gold/30 px-3 py-1.5 rounded-lg transition-all"
                      >
                        View Details <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}