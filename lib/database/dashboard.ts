import { supabase } from "../supabase"

export interface DashboardMetrics {
  pendingBudgets: number
  activeRentals: number
  monthlyRevenue: number
  scheduledEvents: number
}

// Cache simples para métricas do dashboard (5 minutos)
let dashboardCache: { data: DashboardMetrics; timestamp: number } | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos em millisegundos

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  // Verificar cache
  if (dashboardCache && (Date.now() - dashboardCache.timestamp) < CACHE_DURATION) {
    return dashboardCache.data
  }

  try {
    // Executar todas as consultas em paralelo para melhor performance
    const [
      { count: pendingBudgets },
      { count: activeRentals },
      { data: monthlyData },
      { count: scheduledEvents }
    ] = await Promise.all([
      // Orçamentos pendentes
      supabase
        .from("budgets")
        .select("*", { count: "exact", head: true })
        .eq("status", "Pendente"),

      // Locações ativas
      supabase
        .from("rentals")
        .select("*", { count: "exact", head: true })
        .in("status", ["Instalação Pendente", "Ativo", "Concluído"]),

      // Faturamento do mês atual
      (async () => {
        const currentMonth = new Date().getMonth() + 1
        const currentYear = new Date().getFullYear()
        
        return supabase
          .from("rentals")
          .select("final_value")
          .gte("created_at", `${currentYear}-${currentMonth.toString().padStart(2, "0")}-01`)
          .lt("created_at", `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-01`)
          .eq("status", "Concluído")
      })(),

      // Eventos agendados (próximos 7 dias)
      (async () => {
        const today = new Date()
        const sevenDaysFromNow = new Date()
        sevenDaysFromNow.setDate(today.getDate() + 7)
        
        const startDate = today.toISOString().split('T')[0]
        const endDate = sevenDaysFromNow.toISOString().split('T')[0]
        
        return supabase
          .from("rental_logistics_events")
          .select("*", { count: "exact", head: true })
          .gte("event_date", startDate)
          .lte("event_date", endDate)
          .eq("status", "Agendado")
      })()
    ])

    // Calcular faturamento mensal
    const monthlyRevenue = monthlyData?.reduce((sum, rental) => sum + (rental.final_value || 0), 0) || 0

    const result = {
      pendingBudgets: pendingBudgets || 0,
      activeRentals: activeRentals || 0,
      monthlyRevenue,
      scheduledEvents: scheduledEvents || 0,
    }

    // Atualizar cache
    dashboardCache = {
      data: result,
      timestamp: Date.now()
    }

    return result
  } catch (error) {
    console.error("Erro ao buscar métricas do dashboard:", error)
    return {
      pendingBudgets: 0,
      activeRentals: 0,
      monthlyRevenue: 0,
      scheduledEvents: 0,
    }
  }
}

// Função para limpar cache (útil após operações que alteram dados)
export function clearDashboardCache() {
  dashboardCache = null
}
