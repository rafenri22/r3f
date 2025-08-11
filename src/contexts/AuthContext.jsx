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
  const [supabaseSession, setSupabaseSession] = useState(null)

  useEffect(() => {
    // Check if user is logged in on app start
    const savedUser = localStorage.getItem('portalTjaUser')
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setUser(parsedUser)
        // Create Supabase session for the user
        authenticateWithSupabase(parsedUser)
      } catch (error) {
        localStorage.removeItem('portalTjaUser')
      }
    }
    setLoading(false)

    // Listen for Supabase auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSupabaseSession(session)
      console.log('Supabase auth state changed:', event, session?.user?.email)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Create or sign in user to Supabase using email/password
  async function authenticateWithSupabase(customUser) {
    try {
      const email = customUser.username === 'rafky' 
        ? 'admin@tja.local' 
        : 'user@tja.local'
      const password = 'supabase123' // Fixed password for Supabase auth
      
      console.log('Authenticating with Supabase:', email)
      
      // Try to sign in first
      let { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      // If user doesn't exist, create account
      if (error && error.message?.includes('Invalid login credentials')) {
        console.log('User not found, creating account...')
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: undefined, // Disable email confirmation
            data: {
              role: customUser.role,
              username: customUser.username,
              name: customUser.name
            }
          }
        })
        
        if (signUpError) {
          console.error('Error creating Supabase user:', signUpError)
          return
        }
        
        data = signUpData
        console.log('Supabase user created successfully')
      } else if (error) {
        console.error('Error signing in to Supabase:', error)
        return
      }

      if (data.session) {
        setSupabaseSession(data.session)
        console.log('Supabase authentication successful')
      }
    } catch (error) {
      console.error('Error authenticating with Supabase:', error)
    }
  }

  const login = async (username, password) => {
    // Hardcoded authentication (existing logic)
    if (username === 'rafky' && password === 'Rafky@123') {
      const adminUser = { username: 'rafky', role: 'admin', name: 'Admin Rafky' }
      setUser(adminUser)
      localStorage.setItem('portalTjaUser', JSON.stringify(adminUser))
      
      // Authenticate with Supabase
      await authenticateWithSupabase(adminUser)
      
      return { success: true }
    } else if (username === 'user' && password === 'user') {
      const regularUser = { username: 'user', role: 'user', name: 'User' }
      setUser(regularUser)
      localStorage.setItem('portalTjaUser', JSON.stringify(regularUser))
      
      // Authenticate with Supabase
      await authenticateWithSupabase(regularUser)
      
      return { success: true }
    } else {
      return { success: false, error: 'Username atau password salah' }
    }
  }

  const logout = async () => {
    // Sign out from Supabase
    await supabase.auth.signOut()
    
    setUser(null)
    setSupabaseSession(null)
    localStorage.removeItem('portalTjaUser')
  }

  const value = {
    user,
    supabaseSession,
    login,
    logout,
    loading,
    isAdmin: user?.role === 'admin',
    isUser: user?.role === 'user',
    isSupabaseAuthenticated: !!supabaseSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}