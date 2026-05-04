import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
// IMPORT THE STANDARD CLIENT FOR THE ADMIN BYPASS
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Used in Server Components, Server Actions, and API Routes (Subject to RLS)
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — safe to ignore
          }
        },
      },
    }
  )
}

// Service role client — BYPASSES RLS, use ONLY in trusted API routes
export async function createServiceClient() {
  // CRITICAL FIX: Do NOT use the SSR client or attach cookies here.
  // Using the pure supabase-js client with the Service Key guarantees 100% RLS bypass.
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    }
  )
}