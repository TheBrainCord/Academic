import { redirect } from 'next/navigation'

// Root redirects to login; middleware handles auth-aware routing
export default function RootPage() {
  redirect('/auth/login')
}
