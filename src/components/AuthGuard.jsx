import { useAuth } from '../contexts/AuthContext'
import LoginPage from './LoginPage'
import LoadingSpinner from './LoadingSpinner'

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <LoginPage />
  }

  return children
}