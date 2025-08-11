import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { LogIn, User, Lock, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!username || !password) {
      setError('Mohon lengkapi username dan password')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      console.log('Attempting login with:', { username, password })
      
      const result = await login(username, password)
      
      console.log('Login result:', result)
      
      if (!result.success) {
        setError(result.error)
      }
      // Jika sukses, AuthContext akan mengupdate user state dan redirect otomatis
      
    } catch (error) {
      console.error('Login error:', error)
      setError('Terjadi kesalahan sistem. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent)] pointer-events-none"></div>
      
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center">
                  <img 
                    src="tja.png" 
                    alt="Logo TJA" 
                    className="w-20 h-20 sm:w-20 sm:h-20 object-contain"
                  />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Portal TJA</h1>
          <p className="text-slate-400">Masuk ke sistem terintegrasi PT. Trijaya Agung Lestari</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all duration-200"
                  placeholder="Masukkan username"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all duration-200"
                  placeholder="Masukkan password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3 text-red-200 text-sm">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-slate-600 to-slate-500 hover:from-slate-500 hover:to-slate-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>Masuk</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-400 text-sm">
          © 2025 PT. Trijaya Agung Lestari
        </div>
      </div>
    </div>
  )
}