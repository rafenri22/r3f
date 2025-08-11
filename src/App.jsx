import React, { useState } from 'react'
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import AuthGuard from './components/AuthGuard'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './contexts/AuthContext'
import HomePage from './pages/HomePage'
import ModelsPage from './pages/ModelsPage'
import PosesPage from './pages/PosesPage'
import ArmadaPage from './pages/ArmadaPage'
import TestingLiveryPage from './pages/TestingLiveryPage'
import UsersPage from './pages/UsersPage'
import JoinMemberPage from './pages/JoinMemberPage'
import Footer from './components/Footer'
import { LogOut, User, Menu, X, Star } from 'lucide-react'

function AppContent() {
  const location = useLocation()
  const { user, logout, isAdmin, isEp3 } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  const navigationItems = [
    { path: '/', label: 'Home', shortLabel: 'Home' },
    ...(isAdmin ? [
      { path: '/models', label: 'Models', shortLabel: 'Models' },
      { path: '/poses', label: 'Poses', shortLabel: 'Poses' },
      { path: '/armada', label: 'Armada', shortLabel: 'Armada' },
      { path: '/users', label: 'Users', shortLabel: 'Users' },
    ] : []),
    { path: '/testing', label: 'Testing Livery', shortLabel: 'Testing' }
  ]

  const handleMobileLinkClick = () => {
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo dan Brand */}
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <div className="flex items-center justify-center">
                <img 
                  src="tja.png" 
                  alt="Logo TJA" 
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">Portal TJA</h1>
                <p className="text-xs text-slate-500 hidden sm:block">PT. Trijaya Agung Lestari</p>
              </div>
            </Link>
            
            {/* Desktop Navigation - Hidden on mobile */}
            <nav className="hidden lg:flex space-x-1">
              {navigationItems.map((item) => (
                <Link 
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                    isActive(item.path) 
                      ? 'bg-slate-100 text-slate-900' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Navigation Button & User Menu */}
            <div className="flex items-center space-x-1 sm:space-x-3">
              {/* User Menu - Simplified for mobile */}
              <div className="flex items-center space-x-1 sm:space-x-2 text-sm">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600" />
                </div>
                <div className="hidden md:block min-w-0">
                  <div className="flex items-center gap-1">
                    <div className="font-medium text-slate-900 text-xs sm:text-sm truncate">{user?.name}</div>
                    {isEp3 && <Star className="w-3 h-3 text-purple-500" title="EP3 Access" />}
                  </div>
                  <div className="text-xs text-slate-500 capitalize">
                    {isAdmin ? 'Administrator' : 'User'}
                  </div>
                </div>
              </div>
              
              <button
                onClick={logout}
                className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all flex-shrink-0"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all flex-shrink-0"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleMobileLinkClick}
                  className={`block px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    isActive(item.path)
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* User info in mobile menu */}
              <div className="pt-2 mt-2 border-t border-slate-100">
                <div className="px-3 py-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span>Logged in as <span className="font-medium text-slate-700">{user?.name}</span></span>
                    {isEp3 && <Star className="w-3 h-3 text-purple-500" />}
                  </div>
                  <span className="capitalize">({isAdmin ? 'Administrator' : 'User'})</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Routes>
          {/* Home route - accessible to all authenticated users */}
          <Route path="/" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          
          {/* Admin only routes */}
          <Route path="/models" element={
            <ProtectedRoute requireAdmin={true}>
              <div className="p-4 sm:p-6 lg:p-8">
                <ModelsPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/poses" element={
            <ProtectedRoute requireAdmin={true}>
              <div className="p-4 sm:p-6 lg:p-8">
                <PosesPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/armada" element={
            <ProtectedRoute requireAdmin={true}>
              <div className="p-4 sm:p-6 lg:p-8">
                <ArmadaPage />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute requireAdmin={true}>
              <div className="p-4 sm:p-6 lg:p-8">
                <UsersPage />
              </div>
            </ProtectedRoute>
          } />
          
          {/* Testing route - accessible to all authenticated users */}
          <Route path="/testing" element={
            <ProtectedRoute>
              <TestingLiveryPage />
            </ProtectedRoute>
          } />

          {/* Join Member route - public access (outside auth guard) */}
          <Route path="/join-member" element={<JoinMemberPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public route for join member */}
        <Route path="/join-member" element={<JoinMemberPage />} />
        
        {/* All other routes require authentication */}
        <Route path="/*" element={
          <AuthGuard>
            <AppContent />
          </AuthGuard>
        } />
      </Routes>
    </AuthProvider>
  )
}