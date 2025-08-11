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
  const [supabaseError, setSupabaseError] = useState(null)

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
        setSupabaseError('Invalid saved user data')
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
      setSupabaseError(null)
      
      const email = customUser.username === 'rafky' 
        ? 'admin@tja.local' 
        : 'user@tja.local'
      const password = 'supabase123' // Fixed password for Supabase auth
      
      console.log('Authenticating with Supabase:', email)
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Supabase authentication timeout')), 10000) // 10 second timeout
      })
      
      // Try to sign in first with timeout
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password
      })
      
      const { data, error } = await Promise.race([signInPromise, timeoutPromise])

      // If user doesn't exist, create account
      if (error && error.message?.includes('Invalid login credentials')) {
        console.log('User not found, creating account...')
        
        const signUpPromise = supabase.auth.signUp({
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
        
        const { data: signUpData, error: signUpError } = await Promise.race([signUpPromise, timeoutPromise])
        
        if (signUpError) {
          console.error('Error creating Supabase user:', signUpError)
          setSupabaseError(`Failed to create account: ${signUpError.message}`)
          return
        }
        
        console.log('Supabase user created successfully')
        
        if (signUpData.session) {
          setSupabaseSession(signUpData.session)
        } else if (signUpData.user && !signUpData.user.email_confirmed_at) {
          // For signup without email confirmation, try to sign in immediately
          console.log('Attempting immediate sign in after signup...')
          const { data: immediateSignIn, error: immediateError } = await supabase.auth.signInWithPassword({
            email,
            password
          })
          
          if (immediateSignIn?.session) {
            setSupabaseSession(immediateSignIn.session)
          } else {
            console.error('Immediate sign in failed:', immediateError)
            setSupabaseError('Account created but sign in failed')
          }
        }
        
      } else if (error) {
        console.error('Error signing in to Supabase:', error)
        setSupabaseError(`Sign in failed: ${error.message}`)
        return
      } else {
        // Successful sign in
        if (data.session) {
          setSupabaseSession(data.session)
          console.log('Supabase authentication successful')
        }
      }

    } catch (error) {
      console.error('Error authenticating with Supabase:', error)
      setSupabaseError(error.message || 'Authentication failed')
    }
  }

  const login = async (username, password) => {
    try {
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
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Login failed: ' + error.message }
    }
  }

  const logout = async () => {
    // Sign out from Supabase
    await supabase.auth.signOut()
    
    setUser(null)
    setSupabaseSession(null)
    setSupabaseError(null)
    localStorage.removeItem('portalTjaUser')
  }

  const value = {
    user,
    supabaseSession,
    supabaseError,
    login,
    logout,
    loading,
    isAdmin: user?.role === 'admin',
    isUser: user?.role === 'user',
    isSupabaseAuthenticated: !!supabaseSession || !!supabaseError // Allow access even if Supabase fails
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}