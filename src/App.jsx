import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import ModelsPage from './pages/ModelsPage'
import PosesPage from './pages/PosesPage'
import ArmadaPage from './pages/ArmadaPage'

export default function App() {
  const location = useLocation()
  
  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-gray-900">TJA Admin Panel</h1>
            
            <nav className="flex space-x-8">
              <Link 
                to="/models" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/models') 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Models
              </Link>
              <Link 
                to="/poses" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/poses') 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Poses
              </Link>
              <Link 
                to="/armada" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/armada') 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Armada
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<ModelsPage />} />
          <Route path="/models" element={<ModelsPage />} />
          <Route path="/poses" element={<PosesPage />} />
          <Route path="/armada" element={<ArmadaPage />} />
        </Routes>
      </main>
    </div>
  )
}