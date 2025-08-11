import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on app start
    const savedUser = localStorage.getItem('portalTjaUser')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        localStorage.removeItem('portalTjaUser')
      }
    }
    setLoading(false)
  }, [])

  const login = (username, password) => {
    // Hardcoded authentication
    if (username === 'rafky' && password === 'Rafky@123') {
      const adminUser = { username: 'rafky', role: 'admin', name: 'Admin Rafky' }
      setUser(adminUser)
      localStorage.setItem('portalTjaUser', JSON.stringify(adminUser))
      return { success: true }
    } else if (username === 'user' && password === 'user') {
      const regularUser = { username: 'user', role: 'user', name: 'User' }
      setUser(regularUser)
      localStorage.setItem('portalTjaUser', JSON.stringify(regularUser))
      return { success: true }
    } else {
      return { success: false, error: 'Username atau password salah' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('portalTjaUser')
  }

  const value = {
    user,
    login,
    logout,
    loading,
    isAdmin: user?.role === 'admin',
    isUser: user?.role === 'user'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}