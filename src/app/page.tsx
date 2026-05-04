import { redirect } from 'next/navigation'

// Root page — middleware handles redirect, but this is the fallback
export default function RootPage() {
  redirect('/login')
}

