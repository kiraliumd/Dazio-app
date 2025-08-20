import { useState, useEffect, useCallback, useRef } from 'react'
import { dataService, DataServiceOptions } from '../services/data-service'
import { useDataCache } from '../contexts/data-cache-context'

interface UseOptimizedDataOptions extends DataServiceOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  onError?: (error: Error) => void
}

interface UseOptimizedDataReturn<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refresh: (force?: boolean) => Promise<void>
  invalidateCache: () => void
}

export function useOptimizedData<T>(
  dataType: 'clients' | 'equipments' | 'budgets' | 'rentals' | 'dashboard',
  params?: any,
  options: UseOptimizedDataOptions = {}
): UseOptimizedDataReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { getCachedData, setCachedData, invalidateCache: invalidateContextCache } = useDataCache()
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Criar novo controller para esta requisição
    abortControllerRef.current = new AbortController()

    try {
      setLoading(true)
      setError(null)

      // Verificar cache do contexto primeiro
      if (!forceRefresh && options.useCache !== false) {
        const cachedData = getCachedData(dataType)
        if (cachedData) {
          setData(cachedData)
          setLoading(false)
          return
        }
      }

      // Buscar dados do serviço
      let result: T
      const serviceOptions: DataServiceOptions = {
        useCache: options.useCache,
        forceRefresh,
        ttl: options.ttl,
      }

      switch (dataType) {
        case 'clients':
          result = await dataService.getClients(params?.limit, serviceOptions) as T
          break
        case 'equipments':
          result = await dataService.getEquipments(serviceOptions) as T
          break
        case 'budgets':
          result = await dataService.getBudgets(
            params?.limit,
            params?.startDate,
            params?.endDate,
            serviceOptions
          ) as T
          break
        case 'rentals':
          result = await dataService.getRentals(params?.limit, serviceOptions) as T
          break
        case 'dashboard':
          result = await dataService.getDashboardMetrics(serviceOptions) as T
          break
        default:
          throw new Error(`Tipo de dados não suportado: ${dataType}`)
      }

      // Verificar se a requisição foi cancelada
      if (abortControllerRef.current.signal.aborted) {
        return
      }

      setData(result)
      
      // Armazenar no cache do contexto
      if (options.useCache !== false) {
        setCachedData(dataType, result)
      }

    } catch (err) {
      // Verificar se a requisição foi cancelada
      if (abortControllerRef.current?.signal.aborted) {
        return
      }

      const error = err instanceof Error ? err : new Error('Erro desconhecido')
      setError(error)
      
      if (options.onError) {
        options.onError(error)
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false)
      }
    }
  }, [dataType, params, options, getCachedData, setCachedData])

  const refresh = useCallback(async (force = false) => {
    await fetchData(force)
  }, [fetchData])

  const invalidateCache = useCallback(() => {
    // Invalidar cache do contexto
    invalidateContextCache(dataType)
    
    // Invalidar cache do serviço
    switch (dataType) {
      case 'clients':
        dataService.invalidateClientsCache()
        break
      case 'equipments':
        dataService.invalidateEquipmentsCache()
        break
      case 'budgets':
        dataService.invalidateBudgetsCache()
        break
      case 'rentals':
        dataService.invalidateRentalsCache()
        break
    }
  }, [dataType, invalidateContextCache])

  // Configurar auto-refresh se habilitado
  useEffect(() => {
    if (options.autoRefresh && options.refreshInterval) {
      refreshIntervalRef.current = setInterval(() => {
        refresh()
      }, options.refreshInterval)
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [options.autoRefresh, options.refreshInterval, refresh])

  // Buscar dados na montagem do componente
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [])

  return {
    data,
    loading,
    error,
    refresh,
    invalidateCache,
  }
}

// Hooks específicos para cada tipo de dados
export function useClients(limit?: number, options?: UseOptimizedDataOptions) {
  return useOptimizedData('clients', { limit }, options)
}

export function useEquipments(options?: UseOptimizedDataOptions) {
  return useOptimizedData('equipments', undefined, options)
}

export function useBudgets(limit?: number, startDate?: string, endDate?: string, options?: UseOptimizedDataOptions) {
  return useOptimizedData('budgets', { limit, startDate, endDate }, options)
}

export function useRentals(limit?: number, options?: UseOptimizedDataOptions) {
  return useOptimizedData('rentals', { limit }, options)
}

export function useDashboardMetrics(options?: UseOptimizedDataOptions) {
  return useOptimizedData('dashboard', undefined, options)
}

export function useRentalsForReports(startDate?: string, endDate?: string, options?: UseOptimizedDataOptions) {
  return useOptimizedData('rentals', { startDate, endDate, forReports: true }, options)
}

export function useBudgetsForReports(startDate?: string, endDate?: string, options?: UseOptimizedDataOptions) {
  return useOptimizedData('budgets', { startDate, endDate, forReports: true }, options)
}
