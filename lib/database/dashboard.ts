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
  const companyId = await getCurrentUserCompanyId()
  if (!companyId) {
    throw new Error('Usuário não autenticado ou empresa não encontrada')
  }

  const { data, error } = await supabase.rpc('get_dashboard_metrics', { p_company_id: companyId })
  if (error) {
    console.error('Erro ao obter métricas do dashboard (RPC):', error)
    throw error
  }

  const row = (data && data[0]) || {
    total_rentals: 0,
    active_rentals: 0,
    total_budgets: 0,
    approved_budgets: 0,
    pending_budgets: 0,
    monthly_rentals: 0,
    total_clients: 0,
    total_equipments: 0,
    monthly_revenue: 0,
    pending_installations: 0,
    scheduled_events: 0
  }

  return {
    totalRentals: Number(row.total_rentals || 0),
    activeRentals: Number(row.active_rentals || 0),
    totalBudgets: Number(row.total_budgets || 0),
    approvedBudgets: Number(row.approved_budgets || 0),
    pendingBudgets: Number(row.pending_budgets || 0),
    monthlyRentals: Number(row.monthly_rentals || 0),
    totalClients: Number(row.total_clients || 0),
    totalEquipments: Number(row.total_equipments || 0),
    monthlyRevenue: Number(row.monthly_revenue || 0),
    pendingInstallations: Number(row.pending_installations || 0),
    scheduledEvents: Number(row.scheduled_events || 0),
  }
}
