import { supabase } from "../supabase"
import { getCurrentUserCompanyId } from "./client-utils"

export interface DashboardMetrics {
  totalRentals: number
  activeRentals: number
  totalBudgets: number
  approvedBudgets: number
  pendingBudgets: number
  monthlyRentals: number
  totalClients: number
  totalEquipments: number
  monthlyRevenue: number
  pendingInstallations: number
  scheduledEvents: number
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const companyId = await getCurrentUserCompanyId()
    
    if (!companyId) {
      console.error('❌ getDashboardMetrics: Company ID não encontrado')
      throw new Error('Usuário não autenticado ou empresa não encontrada')
    }

    // Buscar métricas de locações
    const { data: rentals, error: rentalsError } = await supabase
      .from("rentals")
      .select("status, final_value, created_at")
      .eq("company_id", companyId)

    if (rentalsError) {
      console.error("Erro ao buscar locações:", rentalsError)
      throw rentalsError
    }

    // Buscar métricas de orçamentos
    const { data: budgets, error: budgetsError } = await supabase
      .from("budgets")
      .select("status, total_value, created_at")
      .eq("company_id", companyId)

    if (budgetsError) {
      console.error("Erro ao buscar orçamentos:", budgetsError)
      throw budgetsError
    }

    // Buscar total de clientes
    const { count: clientsCount, error: clientsError } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)

    if (clientsError) {
      console.error("Erro ao buscar clientes:", clientsError)
      throw clientsError
    }

    // Buscar total de equipamentos
    const { count: equipmentsCount, error: equipmentsError } = await supabase
      .from("equipments")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)

    if (equipmentsError) {
      console.error("Erro ao buscar equipamentos:", equipmentsError)
      throw equipmentsError
    }

    // Calcular métricas
    const totalRentals = rentals?.length || 0
    const activeRentals = rentals?.filter(r => r.status === "Ativo").length || 0
    const totalBudgets = budgets?.length || 0
    const approvedBudgets = budgets?.filter(b => b.status === "Aprovado").length || 0
    const pendingBudgets = budgets?.filter(b => b.status === "Pendente").length || 0
    const totalClients = clientsCount || 0
    const totalEquipments = equipmentsCount || 0

    // Calcular receita mensal (últimos 30 dias)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const monthlyRevenue = rentals
      ?.filter(r => new Date(r.created_at) >= thirtyDaysAgo)
      ?.reduce((sum, r) => sum + (r.final_value || 0), 0) || 0

    // Calcular locações do mês atual
    const currentMonth = new Date()
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    
    const monthlyRentals = rentals
      ?.filter(r => new Date(r.created_at) >= firstDayOfMonth)
      ?.length || 0

    // Buscar instalações pendentes
    const { count: pendingInstallations, error: pendingError } = await supabase
      .from("rentals")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "Instalação Pendente")

    if (pendingError) {
      console.error("Erro ao buscar instalações pendentes:", pendingError)
      throw pendingError
    }

    // Buscar eventos agendados para os próximos 7 dias
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    
    const { count: scheduledEvents, error: eventsError } = await supabase
      .from("rental_logistics_events")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .gte("event_date", new Date().toISOString().split('T')[0])
      .lte("event_date", sevenDaysFromNow.toISOString().split('T')[0])

    if (eventsError) {
      console.error("Erro ao buscar eventos agendados:", eventsError)
      // Não vamos falhar por causa dos eventos, usar 0 como padrão
    }

    return {
      totalRentals,
      activeRentals,
      totalBudgets,
      approvedBudgets,
      pendingBudgets,
      monthlyRentals,
      totalClients,
      totalEquipments,
      monthlyRevenue,
      pendingInstallations: pendingInstallations || 0,
      scheduledEvents: scheduledEvents || 0
    }
  } catch (error) {
    console.error("Erro ao buscar métricas do dashboard:", error)
    throw error
  }
}
