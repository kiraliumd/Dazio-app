"use client"

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'

// Cache com TTL para evitar refetches desnecessários
const companyNameCache = {
  name: '',
  lastFetch: 0,
  ttl: 10 * 60 * 1000, // 10 minutos
};

export function useCompanyName() {
  const { user } = useAuth()
  const [companyName, setCompanyName] = useState<string>(
    typeof window !== 'undefined' ? (sessionStorage.getItem('company_name') || '') : ''
  )

  // Verificar se o cache ainda é válido
  const isCacheValid = useMemo(() => {
    return Date.now() - companyNameCache.lastFetch < companyNameCache.ttl;
  }, []);

  const updateLocal = useCallback((name: string) => {
    setCompanyName(name)
    try { 
      sessionStorage.setItem('company_name', name) 
      companyNameCache.name = name;
      companyNameCache.lastFetch = Date.now();
    } catch {}
  }, [])

  const refreshCompanyName = useCallback(async (forceRefresh = false) => {
    try {
      if (!user) return
      
      // Se não for refresh forçado e o cache for válido, usar dados em cache
      if (!forceRefresh && isCacheValid && companyNameCache.name) {
        updateLocal(companyNameCache.name);
        return;
      }

      // endpoint leve com nome unificado (settings -> profile -> email)
      const res = await fetch('/api/company/name', { 
        cache: forceRefresh ? 'no-store' : 'default' 
      })
      const json = await res.json()
      const name = json?.name
      if (name && typeof name === 'string') {
        updateLocal(name)
      }
    } catch {}
  }, [user, updateLocal, isCacheValid])

  // Carregar nome da empresa apenas uma vez quando usuário estiver disponível
  useEffect(() => {
    if (!companyName && user) {
      // busca em background sem flicker
      refreshCompanyName()
    }
  }, [user]) // Removida dependência de companyName e refreshCompanyName

  // Escutar mudanças de storage
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


