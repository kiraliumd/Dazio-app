"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../supabase'

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number // Time to live em milissegundos
}

interface DataCache {
  clients: CacheItem<any[]> | null
  equipments: CacheItem<any[]> | null
  budgets: CacheItem<any[]> | null
  rentals: CacheItem<any[]> | null
}

interface DataCacheContextType {
  cache: DataCache
  getCachedData: <T>(key: keyof DataCache) => T | null
  setCachedData: <T>(key: keyof DataCache, data: T, ttl?: number) => void
  invalidateCache: (key?: keyof DataCache) => void
  isDataStale: (key: keyof DataCache) => boolean
  clearCache: () => void
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined)

// TTL padrão: 5 minutos
const DEFAULT_TTL = 5 * 60 * 1000

// TTL específicos para diferentes tipos de dados
const TTL_CONFIG = {
  clients: 10 * 60 * 1000,      // 10 minutos
  equipments: 15 * 60 * 1000,   // 15 minutos
  budgets: 2 * 60 * 1000,       // 2 minutos
  rentals: 2 * 60 * 1000,       // 2 minutos
}

export function DataCacheProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<DataCache>({
    clients: null,
    equipments: null,
    budgets: null,
    rentals: null,
  })

  // Carregar cache do localStorage na inicialização
  useEffect(() => {
    try {
      const savedCache = localStorage.getItem('dazio-data-cache')
      if (savedCache) {
        const parsedCache = JSON.parse(savedCache)
        // Verificar se os dados não expiraram
        const now = Date.now()
        const validCache: DataCache = {
          clients: parsedCache.clients && (now - parsedCache.clients.timestamp) < parsedCache.clients.ttl ? parsedCache.clients : null,
          equipments: parsedCache.equipments && (now - parsedCache.equipments.timestamp) < parsedCache.equipments.ttl ? parsedCache.equipments : null,
          budgets: parsedCache.budgets && (now - parsedCache.budgets.timestamp) < parsedCache.budgets.ttl ? parsedCache.budgets : null,
          rentals: parsedCache.rentals && (now - parsedCache.rentals.timestamp) < parsedCache.rentals.ttl ? parsedCache.rentals : null,
        }
        setCache(validCache)
      }
    } catch (error) {
      console.warn('Erro ao carregar cache do localStorage:', error)
    }
  }, [])

  // Salvar cache no localStorage sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem('dazio-data-cache', JSON.stringify(cache))
    } catch (error) {
      console.warn('Erro ao salvar cache no localStorage:', error)
    }
  }, [cache])

  const getCachedData = <T>(key: keyof DataCache): T | null => {
    const item = cache[key]
    if (!item) return null
    
    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      // Dados expirados, remover do cache
      setCache(prev => ({ ...prev, [key]: null }))
      return null
    }
    
    return item.data as T
  }

  const setCachedData = <T>(key: keyof DataCache, data: T, ttl?: number) => {
    const defaultTtl = TTL_CONFIG[key] || DEFAULT_TTL
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || defaultTtl,
    }
    
    setCache(prev => ({ ...prev, [key]: item }))
  }

  const invalidateCache = (key?: keyof DataCache) => {
    if (key) {
      setCache(prev => ({ ...prev, [key]: null }))
    } else {
      setCache({
        clients: null,
        equipments: null,
        budgets: null,
        rentals: null,
      })
    }
  }

  const isDataStale = (key: keyof DataCache): boolean => {
    const item = cache[key]
    if (!item) return true
    
    const now = Date.now()
    return (now - item.timestamp) > item.ttl
  }

  const clearCache = () => {
    setCache({
      clients: null,
      equipments: null,
      budgets: null,
      rentals: null,
    })
    try {
      localStorage.removeItem('dazio-data-cache')
    } catch (error) {
      console.warn('Erro ao limpar cache do localStorage:', error)
    }
  }

  return (
    <DataCacheContext.Provider value={{
      cache,
      getCachedData,
      setCachedData,
      invalidateCache,
      isDataStale,
      clearCache,
    }}>
      {children}
    </DataCacheContext.Provider>
  )
}

export function useDataCache() {
  const context = useContext(DataCacheContext)
  if (context === undefined) {
    throw new Error('useDataCache deve ser usado dentro de um DataCacheProvider')
  }
  return context
}
