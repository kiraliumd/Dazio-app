import { supabase } from '../supabase'
import { getCurrentUserCompanyId } from '../database/client-utils'

export interface DataServiceOptions {
  useCache?: boolean
  forceRefresh?: boolean
  ttl?: number
}

export class DataService {
  private static instance: DataService
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private cacheContext: any = null

  private constructor() {}

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService()
    }
    return DataService.instance
  }

  // Método para conectar com o DataCacheContext
  setCacheContext(context: any) {
    this.cacheContext = context
  }

  private getCacheKey(operation: string, params?: any): string {
    const companyId = this.getCurrentCompanyId()
    const paramsStr = params ? JSON.stringify(params) : ''
    return `${companyId}:${operation}:${paramsStr}`
  }

  private getCurrentCompanyId(): string {
    // Esta função será sobrescrita pelo contexto
    return 'temp'
  }

  setCompanyId(companyId: string) {
    // Método para definir o company ID atual
    this.getCurrentCompanyId = () => companyId
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key)
    if (!cached) return false
    
    const now = Date.now()
    return (now - cached.timestamp) < cached.ttl
  }

  private setCache(key: string, data: any, ttl: number = 5 * 60 * 1000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  private getCache(key: string): any | null {
    if (!this.isCacheValid(key)) {
      this.cache.delete(key)
      return null
    }
    return this.cache.get(key)?.data || null
  }

  // Método para notificar mudanças e invalidar cache
  notifyDataChange(dataType: 'clients' | 'equipments' | 'budgets' | 'rentals', operation: 'create' | 'update' | 'delete') {
    if (process.env.NODE_ENV === "development") { console.log(`🔄 DataService: Notificando mudança em ${dataType} (${operation})`)
    
    // Invalidar cache local
    this.invalidateCacheByType(dataType)
    
    // Notificar contexto se disponível
    if (this.cacheContext?.notifyDataChange) {
      this.cacheContext.notifyDataChange(dataType, operation)
    }
  }

  // Método para invalidar cache por tipo
  private invalidateCacheByType(dataType: 'clients' | 'equipments' | 'budgets' | 'rentals') {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(dataType))
    keysToDelete.forEach(key => this.cache.delete(key))
    if (process.env.NODE_ENV === "development") { console.log(`🗑️ DataService: Cache de ${dataType} invalidado localmente`)
  }

  async getClients(limit?: number, options: DataServiceOptions = {}): Promise<any[]> {
    const cacheKey = this.getCacheKey('clients', { limit })
    
    // Verificar cache se habilitado
    if (options.useCache !== false && !options.forceRefresh) {
      const cached = this.getCache(cacheKey)
      if (cached) {
        if (process.env.NODE_ENV === "development") { console.log('📦 DataService: Clientes carregados do cache')
        return cached
      }
    }

    try {
      const companyId = await getCurrentUserCompanyId()
      if (!companyId) {
        throw new Error('Usuário não autenticado ou empresa não encontrada')
      }

      let query = supabase
        .from("clients")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) {
        if (process.env.NODE_ENV === "development") { console.error("Erro ao buscar clientes:", error)
        throw error
      }

      const result = data || []
      
      // Armazenar no cache
      if (options.useCache !== false) {
        this.setCache(cacheKey, result, options.ttl || 10 * 60 * 1000) // 10 minutos para clientes
      }

      if (process.env.NODE_ENV === "development") { console.log('🗄️ DataService: Clientes carregados do banco')
      return result
    } catch (error) {
      if (process.env.NODE_ENV === "development") { console.error('DataService: Erro ao buscar clientes:', error)
      throw error
    }
  }

  async getEquipments(options: DataServiceOptions = {}): Promise<any[]> {
    const cacheKey = this.getCacheKey('equipments')
    
    // Verificar cache se habilitado
    if (options.useCache !== false && !options.forceRefresh) {
      const cached = this.getCache(cacheKey)
      if (cached) {
        if (process.env.NODE_ENV === "development") { console.log('📦 DataService: Equipamentos carregados do cache')
        return cached
      }
    }

    try {
      const companyId = await getCurrentUserCompanyId()
      if (!companyId) {
        throw new Error('Usuário não autenticado ou empresa não encontrada')
      }

      const { data, error } = await supabase
        .from("equipments")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })

      if (error) {
        if (process.env.NODE_ENV === "development") { console.error("Erro ao buscar equipamentos:", error)
        throw error
      }

      const result = data || []
      
      // Armazenar no cache
      if (options.useCache !== false) {
        this.setCache(cacheKey, result, options.ttl || 15 * 60 * 1000) // 15 minutos para equipamentos
      }

      if (process.env.NODE_ENV === "development") { console.log('🗄️ DataService: Equipamentos carregados do banco')
      return result
    } catch (error) {
      if (process.env.NODE_ENV === "development") { console.error('DataService: Erro ao buscar equipamentos:', error)
      throw error
    }
  }

  async getBudgets(limit?: number, startDate?: string, endDate?: string, options: DataServiceOptions = {}): Promise<any[]> {
    const cacheKey = this.getCacheKey('budgets', { limit, startDate, endDate })
    
    // Verificar cache se habilitado
    if (options.useCache !== false && !options.forceRefresh) {
      const cached = this.getCache(cacheKey)
      if (cached) {
        if (process.env.NODE_ENV === "development") { console.log('📦 DataService: Orçamentos carregados do cache')
        return cached
      }
    }

    try {
      const companyId = await getCurrentUserCompanyId()
      if (!companyId) {
        throw new Error('Usuário não autenticado ou empresa não encontrada')
      }

      let query = supabase
        .from("budgets")
        .select(`
          *,
          budget_items (*)
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })

      if (startDate && endDate) {
        query = query.gte("created_at", `${startDate}T00:00:00`)
        query = query.lte("created_at", `${endDate}T23:59:59`)
      }

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) {
        if (process.env.NODE_ENV === "development") { console.error("Erro ao buscar orçamentos:", error)
        throw error
      }

      const result = data || []
      
      // Armazenar no cache
      if (options.useCache !== false) {
        this.setCache(cacheKey, result, options.ttl || 2 * 60 * 1000) // 2 minutos para orçamentos
      }

      if (process.env.NODE_ENV === "development") { console.log('🗄️ DataService: Orçamentos carregados do banco')
      return result
    } catch (error) {
      if (process.env.NODE_ENV === "development") { console.error('DataService: Erro ao buscar orçamentos:', error)
      throw error
    }
  }

  async getRentals(limit?: number, options: DataServiceOptions = {}): Promise<any[]> {
    const cacheKey = this.getCacheKey('rentals', { limit })
    
    // Verificar cache se habilitado
    if (options.useCache !== false && !options.forceRefresh) {
      const cached = this.getCache(cacheKey)
      if (cached) {
        if (process.env.NODE_ENV === "development") { console.log('📦 DataService: Locações carregadas do cache')
        return cached
      }
    }

    try {
      const companyId = await getCurrentUserCompanyId()
      if (!companyId) {
        throw new Error('Usuário não autenticado ou empresa não encontrada')
      }

      let query = supabase
        .from("rentals")
        .select(`
          *,
          rental_items (*)
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) {
        if (process.env.NODE_ENV === "development") { console.error("Erro ao buscar locações:", error)
        throw error
      }

      const result = data || []
      
      // Armazenar no cache
      if (options.useCache !== false) {
        this.setCache(cacheKey, result, options.ttl || 2 * 60 * 1000) // 2 minutos para locações
      }

      if (process.env.NODE_ENV === "development") { console.log('🗄️ DataService: Locações carregadas do banco')
      return result
    } catch (error) {
      if (process.env.NODE_ENV === "development") { console.error('DataService: Erro ao buscar locações:', error)
      throw error
    }
  }

  async getDashboardMetrics(options: DataServiceOptions = {}): Promise<any> {
    const cacheKey = this.getCacheKey('dashboard')
    
    // Verificar cache se habilitado
    if (options.useCache !== false && !options.forceRefresh) {
      const cached = this.getCache(cacheKey)
      if (cached) {
        if (process.env.NODE_ENV === "development") { console.log('📦 DataService: Métricas do dashboard carregadas do cache')
        return cached
      }
    }

    try {
      const companyId = await getCurrentUserCompanyId()
      if (!companyId) {
        throw new Error('Usuário não autenticado ou empresa não encontrada')
      }

      // Importar dinamicamente para evitar dependência circular
      const { getDashboardMetrics } = await import('../database/dashboard')
      const result = await getDashboardMetrics()
      
      // Armazenar no cache
      if (options.useCache !== false) {
        this.setCache(cacheKey, result, options.ttl || 1 * 60 * 1000) // 1 minuto para métricas
      }

      if (process.env.NODE_ENV === "development") { console.log('🗄️ DataService: Métricas do dashboard carregadas do banco')
      return result
    } catch (error) {
      if (process.env.NODE_ENV === "development") { console.error('DataService: Erro ao buscar métricas do dashboard:', error)
      throw error
    }
  }

  // Métodos para invalidar cache quando dados são modificados
  invalidateClientsCache(): void {
    this.invalidateCacheByType('clients')
    this.notifyDataChange('clients', 'update')
  }

  invalidateEquipmentsCache(): void {
    this.invalidateCacheByType('equipments')
    this.notifyDataChange('equipments', 'update')
  }

  invalidateBudgetsCache(): void {
    this.invalidateCacheByType('budgets')
    this.notifyDataChange('budgets', 'update')
  }

  invalidateRentalsCache(): void {
    this.invalidateCacheByType('rentals')
    this.notifyDataChange('rentals', 'update')
  }

  // Método para limpar todo o cache
  clearCache(): void {
    this.cache.clear()
    if (process.env.NODE_ENV === "development") { console.log('🗑️ DataService: Cache limpo completamente')
  }

  // Método para obter estatísticas do cache
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// Exportar instância singleton
export const dataService = DataService.getInstance()
