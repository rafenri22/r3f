import { useAuth } from '../contexts/AuthContext'
import LoginPage from './LoginPage'
import LoadingSpinner from './LoadingSpinner'

export default function AuthGuard({ children }) {
  const { user, loading, isSupabaseAuthenticated } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <LoginPage />
  }

  // Show loading while Supabase authentication is in progress
  if (!isSupabaseAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-slate-600 to-slate-500 rounded-xl mb-4 shadow-2xl">
            <span className="text-2xl font-bold text-white">TJA</span>
          </div>
          <div className="w-8 h-8 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Mengatur akses database...</p>
        </div>
      </div>
    )
  }

  return children
}