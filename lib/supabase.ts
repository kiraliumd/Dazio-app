import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Não persistir sessão para melhor performance
    autoRefreshToken: false,
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'precisa-admin'
    }
  }
})

// Tipos para as tabelas
export interface Client {
  id: string
  name: string
  phone: string
  email: string
  document_type: "CPF" | "CNPJ"
  document_number: string
  observations: string | null
  created_at: string
  updated_at: string
}

export interface Equipment {
  id: string
  name: string
  category: string
  description: string | null
  daily_rate: number
  quantity: number
  rented_quantity: number
  maintenance_quantity: number
  status: "Disponível" | "Alugado" | "Manutenção"
  created_at: string
  updated_at: string
}

export interface Budget {
  id: string
  number: string
  client_id: string
  client_name: string
  start_date: string
  end_date: string
  installation_time: string | null
  removal_time: string | null
  installation_location: string | null
  subtotal: number
  discount: number
  total_value: number
  status: "Pendente" | "Aprovado" | "Rejeitado"
  observations: string | null
  // Campos de recorrência
  is_recurring: boolean
  recurrence_type: "weekly" | "monthly" | "yearly"
  recurrence_interval: number
  recurrence_end_date: string | null
  created_at: string
  updated_at: string
}

export interface BudgetItem {
  id: string
  budget_id: string
  equipment_name: string
  quantity: number
  daily_rate: number
  days: number
  total: number
  created_at: string
}

export interface Rental {
  id: string
  client_id: string
  client_name: string
  start_date: string
  end_date: string
  installation_time: string
  removal_time: string
  installation_location: string | null
  total_value: number
  discount: number
  final_value: number
  budget_id: string | null
  
  // Novos campos para recorrência
  is_recurring: boolean
  recurrence_type: "weekly" | "monthly" | "yearly"
  recurrence_interval: number
  recurrence_end_date: string | null
  recurrence_status: "active" | "paused" | "cancelled" | "completed"
  parent_rental_id: string | null
  next_occurrence_date: string | null
  
  created_at: string
  updated_at: string
}

export interface RentalItem {
  id: string
  rental_id: string
  equipment_name: string
  quantity: number
  daily_rate: number
  days: number
  total: number
  created_at: string
}

// Nova interface para ocorrências recorrentes
export interface RecurringRentalOccurrence {
  id: string
  parent_rental_id: string
  occurrence_number: number
  start_date: string
  end_date: string
  installation_date: string | null
  removal_date: string | null
  created_at: string
  updated_at: string
}
