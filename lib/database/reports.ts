import { supabase } from '../supabase';
import { getCurrentUserCompanyId } from './client-utils';

interface RentalItem {
  equipment_name: string;
  quantity: number;
}

interface RentalData {
  id: string;
  client_name: string;
  start_date: string;
  end_date: string;
  event_start_date?: string;
  event_end_date?: string;
  final_value: number;
  status: string;
  rental_items: RentalItem[];
}

interface BudgetData {
  id: string;
  number?: string;
  client_name: string;
  created_at: string;
  total_value: number;
  status: string;
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
  status?: string;
}

export interface RentalReport {
  id: string;
  clientName: string;
  startDate: string;
  endDate: string;
  finalValue: number;
  status: string;
  items: {
    equipmentName: string;
    quantity: number;
  }[];
}

export interface BudgetReport {
  id: string;
  number?: string;
  clientName: string;
  createdAt: string;
  totalValue: number;
  status: string;
}

// Buscar locações para relatórios
export async function getRentalsForReports(
  filters: ReportFilters
): Promise<RentalReport[]> {
  try {
    const companyId = await getCurrentUserCompanyId();

    if (!companyId) {
      console.error('❌ getRentalsForReports: Company ID não encontrado');
      throw new Error('Usuário não autenticado ou empresa não encontrada');
    }

    const { data, error } = await supabase
      .from('rentals')
      .select(
        `
        *,
        rental_items (*)
      `
      )
      .eq('company_id', companyId)
      .gte('created_at', filters.startDate)
      .lte('created_at', filters.endDate)
      .in('status', ['Instalação Pendente', 'Concluído'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar locações para relatórios:', error);
      throw error;
    }

    // Transformar dados para o formato do relatório
    const rentals = (data || []).map((rental: RentalData) => ({
      id: rental.id,
      clientName: rental.client_name,
      startDate: rental.event_start_date || rental.start_date,
      endDate: rental.event_end_date || rental.end_date,
      finalValue: rental.final_value,
      status: rental.status,
      items: (rental.rental_items || []).map((item: RentalItem) => ({
        equipmentName: item.equipment_name,
        quantity: item.quantity,
      })),
    }));

    return rentals;
  } catch (error) {
    console.error('Erro ao buscar locações para relatórios:', error);
    return [];
  }
}

// Buscar orçamentos para relatórios
export async function getBudgetsForReports(
  filters: ReportFilters
): Promise<BudgetReport[]> {
  try {
    const companyId = await getCurrentUserCompanyId();

    if (!companyId) {
      console.error('❌ getBudgetsForReports: Company ID não encontrado');
      throw new Error('Usuário não autenticado ou empresa não encontrada');
    }

    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('company_id', companyId)
      .gte('created_at', filters.startDate)
      .lte('created_at', filters.endDate)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar orçamentos para relatórios:', error);
      throw error;
    }

    // Transformar dados para o formato do relatório
    const budgets: BudgetReport[] = (data || []).map((budget: BudgetData) => {
      return {
        id: budget.id,
        number: budget.number || budget.id,
        clientName: budget.client_name,
        createdAt: budget.created_at,
        totalValue: budget.total_value,
        status: budget.status,
      };
    });

    return budgets;
  } catch (error) {
    console.error('Erro ao buscar orçamentos para relatórios:', error);
    return [];
  }
}

// Buscar todas as locações (para análise completa)
export async function getAllRentalsForReports(): Promise<RentalReport[]> {
  try {
    const { data, error } = await supabase
      .from('rentals')
      .select(
        `
        *,
        rental_items (*)
      `
      )
      .in('status', ['Instalação Pendente', 'Concluído'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar todas as locações:', error);
      throw error;
    }

    // Transformar dados para o formato do relatório
    const rentals = (data || []).map((rental: RentalData) => ({
      id: rental.id,
      clientName: rental.client_name,
      startDate: rental.event_start_date || rental.start_date,
      endDate: rental.event_end_date || rental.end_date,
      finalValue: rental.final_value,
      status: rental.status,
      items: (rental.rental_items || []).map((item: RentalItem) => ({
        equipmentName: item.equipment_name,
        quantity: item.quantity,
      })),
    }));

    return rentals;
  } catch (error) {
    console.error('Erro ao buscar todas as locações:', error);
    return [];
  }
}

// Buscar todos os orçamentos (para análise completa)
export async function getAllBudgetsForReports(): Promise<BudgetReport[]> {
  try {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('status', 'Aprovado')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar todos os orçamentos:', error);
      throw error;
    }

    // Transformar dados para o formato do relatório
    const budgets = (data || []).map((budget: BudgetData) => ({
      id: budget.id,
      clientName: budget.client_name,
      createdAt: budget.created_at,
      totalValue: budget.total_value,
      status: budget.status,
    }));

    return budgets;
  } catch (error) {
    console.error('Erro ao buscar todos os orçamentos:', error);
    return [];
  }
}
