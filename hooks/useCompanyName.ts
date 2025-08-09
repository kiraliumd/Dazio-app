"use client"

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'

export function useCompanyName() {
  const { user } = useAuth()
  const [companyName, setCompanyName] = useState<string>(
    typeof window !== 'undefined' ? (sessionStorage.getItem('company_name') || '') : ''
  )

  const updateLocal = useCallback((name: string) => {
    setCompanyName(name)
    try { sessionStorage.setItem('company_name', name) } catch {}
  }, [])

  const refreshCompanyName = useCallback(async () => {
    try {
      if (!user) return
      const res = await fetch('/api/company/profile', { cache: 'no-store' })
      const json = await res.json()
      const name = json?.data?.company_name
      if (name && typeof name === 'string') {
        updateLocal(name)
      }
    } catch {}
  }, [user, updateLocal])

  useEffect(() => {
    if (!companyName && user) {
      // busca em background sem flicker
      refreshCompanyName()
    }
  }, [companyName, user, refreshCompanyName])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'company_name' && typeof e.newValue === 'string') {
        setCompanyName(e.newValue)
      }
    }
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail
      if (typeof detail === 'string') updateLocal(detail)
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('companyNameChanged', onCustom as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('companyNameChanged', onCustom as EventListener)
    }
  }, [updateLocal])

  return { companyName, setCompanyName: updateLocal, refreshCompanyName }
}


