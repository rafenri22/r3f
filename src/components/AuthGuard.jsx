import { useAuth } from '../contexts/AuthContext'
import LoginPage from './LoginPage'
import LoadingSpinner from './LoadingSpinner'

export default function AuthGuard({ children }) {
  const { user, loading, isSupabaseAuthenticated, supabaseError } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <LoginPage />
  }

  // Show loading while Supabase authentication is in progress, but not indefinitely
  if (!isSupabaseAuthenticated && !supabaseError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-slate-600 to-slate-500 rounded-xl mb-4 shadow-2xl">
            <span className="text-2xl font-bold text-white">TJA</span>
          </div>
          <div className="w-8 h-8 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 mb-2">Mengatur akses database...</p>
          <p className="text-slate-400 text-sm">Proses ini membutuhkan beberapa detik</p>
        </div>
      </div>
    )
  }

  // Show error if Supabase authentication failed but still allow access
  if (supabaseError) {
    console.warn('Supabase authentication failed, but allowing access:', supabaseError)
  }

  return children
}