"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { clearCompanyIdCache } from './database/client-utils'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ data: any; error: any }>
  signOut: () => Promise<void>
  updateUser: (updates: Partial<User>) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sessão atual
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.log('AuthContext: Sessão inicial:', session?.user?.email)
        setSession(session)
        setUser(session?.user ?? null)

        // Sincronizar sessão inicial com o servidor
        try {
          await fetch('/auth/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'INITIAL_SESSION', session }),
          })
        } catch (e) {
          if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.warn('Falha ao sincronizar sessão inicial no servidor:', e)
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error('Erro ao obter sessão:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.log('AuthContext: Auth state changed:', event, session?.user?.email)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Enviar evento para o servidor atualizar cookies
        try {
          await fetch('/auth/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event, session }),
          })
        } catch (e) {
          if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.warn('Falha ao sincronizar evento de auth no servidor:', e)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.log('AuthContext: Tentando login com:', email)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error('AuthContext: Erro no login:', error)
    } else {
      if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.log('AuthContext: Login bem-sucedido')
      // Garantir sincronização imediata de cookies no servidor antes de navegar
      try {
        const { data: { session } } = await supabase.auth.getSession()
        await fetch('/auth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'SIGNED_IN', session }),
        })
      } catch (e) {
        if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.warn('Falha ao sincronizar sessão após login:', e)
      }
    }
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.log('AuthContext: Fazendo logout')
    
    // Limpar cache do company_id antes do logout
    clearCompanyIdCache()
    
    await supabase.auth.signOut()
    try {
      await fetch('/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'SIGNED_OUT', session: null }),
      })
    } catch (e) {
      if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.warn('Falha ao sincronizar logout no servidor:', e)
    }
  }

  const updateUser = async (updates: Partial<User>) => {
    const { error } = await supabase.auth.updateUser(updates)
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 