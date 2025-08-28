"use client"

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { dataService } from '../services/data-service'

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
  // Novos métodos para invalidação automática
  notifyDataChange: (dataType: keyof DataCache, operation: 'create' | 'update' | 'delete') => void
  subscribeToChanges: (callback: (dataType: keyof DataCache, operation: string) => void) => () => void
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

  // Sistema de notificações para mudanças de dados
  const [changeSubscribers, setChangeSubscribers] = useState<Set<(dataType: keyof DataCache, operation: string) => void>>(new Set())

  // Conectar com o DataService
  useEffect(() => {
    dataService.setCacheContext({
      notifyDataChange: (dataType: keyof DataCache, operation: 'create' | 'update' | 'delete') => {
        console.log(`🔄 DataCacheContext: Recebendo notificação do DataService para ${dataType} (${operation})`)
        // Temporariamente desabilitado para correção de build
      }
    })
  }, [])

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

  const getCachedData = (key: keyof DataCache): any => {
    const item = cache[key]
    if (!item) return null
    
    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      // Dados expirados, remover do cache
      setCache(prev => ({ ...prev, [key]: null }))
      return null
    }
    
    return item.data
  }

  const setCachedData = (key: keyof DataCache, data: any, ttl?: number) => {
    const defaultTtl = TTL_CONFIG[key] || DEFAULT_TTL
    const item: CacheItem<any> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || defaultTtl,
    }
    
    setCache(prev => ({ ...prev, [key]: item }))
  }

  const invalidateCache = (key?: keyof DataCache) => {
    if (key) {
      setCache(prev => ({ ...prev, [key]: null }))
      console.log(`🗑️ DataCacheContext: Cache de ${key} invalidado`)
    } else {
      setCache({
        clients: null,
        equipments: null,
        budgets: null,
        rentals: null,
      })
      console.log('🗑️ DataCacheContext: Todo o cache invalidado')
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

  // Sistema de notificações para mudanças de dados
  const notifyDataChange = useCallback((dataType: keyof DataCache, operation: 'create' | 'update' | 'delete') => {
    console.log(`🔄 DataCacheContext: Notificando mudança em ${dataType} (${operation})`)
    
    // Invalidar cache imediatamente
    invalidateCache(dataType)
    
    // Notificar todos os subscribers
    changeSubscribers.forEach(callback => {
      try {
        callback(dataType, operation)
      } catch (error) {
        console.warn('Erro ao executar callback de mudança:', error)
      }
    })
  }, [changeSubscribers])

  const subscribeToChanges = useCallback((callback: (dataType: keyof DataCache, operation: string) => void) => {
    setChangeSubscribers(prev => new Set(prev).add(callback))
    
    // Retornar função para cancelar inscrição
    return () => {
      setChangeSubscribers(prev => {
        const newSet = new Set(prev)
        newSet.delete(callback)
        return newSet
      })
    }
  }, [])

  return (
    <DataCacheContext.Provider value={{
      cache,
      getCachedData,
      setCachedData,
      invalidateCache,
      isDataStale,
      clearCache,
      notifyDataChange,
      subscribeToChanges,
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
