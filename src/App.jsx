import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import AuthGuard from './components/AuthGuard'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './contexts/AuthContext'
import ModelsPage from './pages/ModelsPage'
import PosesPage from './pages/PosesPage'
import ArmadaPage from './pages/ArmadaPage'
import TestingLiveryPage from './pages/TestingLiveryPage'
import Footer from './components/Footer'
import { LogOut, User } from 'lucide-react'

function AppContent() {
  const location = useLocation()
  const { user, logout, isAdmin } = useAuth()
  
  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-500 rounded-xl flex items-center justify-center">
                <span className="text-lg font-bold text-white">TJA</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Portal TJA</h1>
                <p className="text-xs text-slate-500">PT. Trijaya Agung Lestari</p>
              </div>
            </div>
            
            {/* Navigation - Only show for admin */}
            <nav className="flex space-x-1">
              {isAdmin && (
                <>
                  <Link 
                    to="/models" 
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      isActive('/models') 
                        ? 'bg-slate-100 text-slate-900' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Models
                  </Link>
                  <Link 
                    to="/poses" 
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      isActive('/poses') 
                        ? 'bg-slate-100 text-slate-900' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Poses
                  </Link>
                  <Link 
                    to="/armada" 
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      isActive('/armada') 
                        ? 'bg-slate-100 text-slate-900' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Armada
                  </Link>
                </>
              )}
              <Link 
                to="/testing" 
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  isActive('/testing') 
                    ? 'bg-slate-100 text-slate-900' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Testing Livery
              </Link>
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-600" />
                </div>
                <div className="hidden sm:block">
                  <div className="font-medium text-slate-900">{user?.name}</div>
                  <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
                </div>
              </div>
              
              <button
                onClick={logout}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Routes>
          <Route path="/" element={
            <ProtectedRoute requireAdmin={true}>
              <ModelsPage />
            </ProtectedRoute>
          } />
          <Route path="/models" element={
            <ProtectedRoute requireAdmin={true}>
              <ModelsPage />
            </ProtectedRoute>
          } />
          <Route path="/poses" element={
            <ProtectedRoute requireAdmin={true}>
              <PosesPage />
            </ProtectedRoute>
          } />
          <Route path="/armada" element={
            <ProtectedRoute requireAdmin={true}>
              <ArmadaPage />
            </ProtectedRoute>
          } />
          <Route path="/testing" element={
            <ProtectedRoute>
              <TestingLiveryPage />
            </ProtectedRoute>
          } />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGuard>
        <AppContent />
      </AuthGuard>
    </AuthProvider>
  )
}