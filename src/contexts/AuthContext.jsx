import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

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
        const userData = JSON.parse(savedUser)
        // Verify user still exists in database
        verifyUser(userData.id).then(isValid => {
          if (isValid) {
            setUser(userData)
          } else {
            localStorage.removeItem('portalTjaUser')
          }
          setLoading(false)
        })
      } catch (error) {
        localStorage.removeItem('portalTjaUser')
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  async function verifyUser(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      return !error && data
    } catch (error) {
      return false
    }
  }

  async function login(username, password) {
    try {
      console.log('Attempting login for username:', username)
      
      // Get user from database
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single()

      console.log('Database query result:', { userData, error })

      if (error || !userData) {
        console.log('User not found or database error')
        return { success: false, error: 'Username atau password salah' }
      }

      console.log('Comparing passwords:', {
        inputPassword: password,
        dbPassword: userData.password,
        match: password === userData.password
      })

      // Simple string comparison for password (plain text)
      if (password !== userData.password) {
        console.log('Password mismatch')
        return { success: false, error: 'Username atau password salah' }
      }

      // Create user session
      const userSession = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        isAdmin: userData.is_admin,
        isEp3: userData.is_ep3,
        name: userData.is_admin ? 'Administrator' : userData.username
      }

      console.log('Login successful, creating session:', userSession)

      setUser(userSession)
      localStorage.setItem('portalTjaUser', JSON.stringify(userSession))
      
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Terjadi kesalahan sistem: ' + error.message }
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
    isAdmin: user?.isAdmin || false,
    isUser: !user?.isAdmin,
    isEp3: user?.isEp3 || false
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}