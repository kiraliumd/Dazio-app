import { useCallback, useEffect, useRef, useState } from 'react';
import { dataService } from '../services/data-service';

interface UseOptimizedDataOptions {
  useCache?: boolean;
  ttl?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onError?: (error: Error) => void;
}

interface UseOptimizedDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: (force?: boolean) => Promise<void>;
  invalidateCache: () => void;
}

export function useOptimizedData<T>(
  dataType: 'clients' | 'equipments' | 'budgets' | 'rentals' | 'dashboard',
  params?: any,
  options: UseOptimizedDataOptions = {}
): UseOptimizedDataReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Log removido para produção - muito verboso

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      // Log removido para produção - muito verboso
      
      // Cancelar requisição anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Criar novo controller para esta requisição
      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        setError(null);

        // Log removido para produção - muito verboso

        // Buscar dados do serviço
        let result: any;
        switch (dataType) {
          case 'clients':
            result = await dataService.getClients(params?.limit);
            break;
          case 'equipments':
            result = await dataService.getEquipments();
            break;
          case 'budgets':
            result = await dataService.getBudgets(
              params?.limit,
              params?.startDate,
              params?.endDate,
              { useCache: !forceRefresh, ttl: options.ttl }
            );
            break;
          case 'rentals':
            result = await dataService.getRentals(params?.limit);
            break;
          case 'dashboard':
            result = await dataService.getDashboardMetrics();
            break;
          default:
            throw new Error(`Tipo de dados não suportado: ${dataType}`);
        }

        setData(result);
        setHasLoaded(true);
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('🔍 useOptimizedData: Erro na busca:', error);
          setError(error);
          if (options.onError) {
            options.onError(error);
          }
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [dataType, params, options.ttl, options.onError]
  );

  const refresh = useCallback(
    async (force = false) => {
      await fetchData(force);
    },
    [fetchData]
  );

  const invalidateCache = useCallback(() => {
    // Invalidar cache do serviço
    switch (dataType) {
      case 'clients':
        dataService.invalidateClientsCache();
        break;
      case 'equipments':
        dataService.invalidateEquipmentsCache();
        break;
      case 'budgets':
        dataService.invalidateBudgetsCache();
        break;
      case 'rentals':
        dataService.invalidateRentalsCache();
        break;
    }
  }, [dataType]);

  // Configurar auto-refresh se habilitado
  useEffect(() => {
    if (options.autoRefresh && options.refreshInterval) {
      refreshIntervalRef.current = setInterval(() => {
        refresh();
      }, options.refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [options.autoRefresh, options.refreshInterval, refresh]);

  // Buscar dados apenas uma vez na montagem
  useEffect(() => {
    if (!hasLoaded && !loading) {
      console.log('🔍 useOptimizedData: Iniciando busca de dados...', { dataType, hasLoaded, loading });
      fetchData();
    }
  }, [hasLoaded, loading, fetchData]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refresh,
    invalidateCache,
  };
}

// Hooks específicos para cada tipo de dados
export function useClients(limit?: number, options?: UseOptimizedDataOptions) {
  return useOptimizedData('clients', { limit }, options);
}

export function useEquipments(options?: UseOptimizedDataOptions) {
  return useOptimizedData('equipments', undefined, options);
}

export function useBudgets(
  limit?: number,
  startDate?: string,
  endDate?: string,
  options?: UseOptimizedDataOptions
) {
  return useOptimizedData('budgets', { limit, startDate, endDate }, options);
}

export function useRentals(limit?: number, options?: UseOptimizedDataOptions) {
  return useOptimizedData('rentals', { limit }, options);
}

export function useDashboardMetrics(options?: UseOptimizedDataOptions) {
  return useOptimizedData('dashboard', undefined, options);
}
