import { supabase } from "../supabase"
import type { Rental, RentalItem } from "../supabase"
import { format } from "date-fns"
import { getCurrentUserCompanyId } from "./client-utils"

// Função para calcular a próxima data de ocorrência
function calculateNextOccurrenceDate(rental: any): string | null {
  if (!rental.is_recurring || !rental.recurrence_type || rental.recurrence_type === "none") {
    return null
  }

  try {
    const endDate = new Date(rental.end_date)
    const interval = rental.recurrence_interval || 1
    
    let nextDate = new Date(endDate)
    
    switch (rental.recurrence_type) {
      case "daily":
        nextDate.setDate(endDate.getDate() + interval)
        break
      case "weekly":
        nextDate.setDate(endDate.getDate() + (interval * 7))
        break
      case "monthly":
        nextDate.setMonth(endDate.getMonth() + interval)
        break
      case "yearly":
        nextDate.setFullYear(endDate.getFullYear() + interval)
        break
      default:
        return null
    }
    
    // Verificar se não ultrapassou a data de fim da recorrência
    if (rental.recurrence_end_date) {
      const endRecurrenceDate = new Date(rental.recurrence_end_date)
      if (nextDate > endRecurrenceDate) {
        return null
      }
    }
    
    return nextDate.toISOString() // Retorna como timestamp para compatibilidade com o banco
  } catch (error) {
    console.error("Erro ao calcular próxima ocorrência:", error)
    return null
  }
}

export async function getRentals(limit?: number) {
  const companyId = await getCurrentUserCompanyId()
  
  if (!companyId) {
    console.error('❌ getRentals: Company ID não encontrado')
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

  // Aplicar limite se fornecido
  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error("Erro ao buscar locações:", error)
    throw error
  }

  return data || []
}

export async function getRentalById(id: string) {
  const companyId = await getCurrentUserCompanyId()
  
  if (!companyId) {
    console.error('❌ getRentalById: Company ID não encontrado')
    throw new Error('Usuário não autenticado ou empresa não encontrada')
  }

  const { data, error } = await supabase
    .from("rentals")
    .select(`
      *,
      rental_items (*)
    `)
    .eq("id", id)
    .eq("company_id", companyId)
    .single()

  if (error) {
    console.error("Erro ao buscar locação:", error)
    throw error
  }

  return data
}

export async function createRental(
  rental: Omit<Rental, "id" | "created_at" | "updated_at">,
  items: Omit<RentalItem, "id" | "rental_id" | "created_at">[],
  logisticsData: { installation: Date; removal: Date },
) {
  const companyId = await getCurrentUserCompanyId()
  
  if (!companyId) {
    console.error('❌ createRental: Company ID não encontrado')
    throw new Error('Usuário não autenticado ou empresa não encontrada')
  }

  // Usar as colunas corretas baseado na estrutura real da tabela
  const rentalData: any = {
    client_id: rental.client_id,
    client_name: rental.client_name,
    // Período da locação (datas do contrato)
    event_start_date: rental.start_date, // Data de início do período contratado
    event_end_date: rental.end_date, // Data de fim do período contratado
    // Datas físicas de instalação/retirada
    installation_date: logisticsData.installation, // Data real de instalação
    removal_date: logisticsData.removal, // Data real de retirada
    pickup_date: logisticsData.removal, // Data de retirada (mesmo que removal_date)
    // Período da locação (duplicado para compatibilidade)
    start_date: rental.start_date, // Data de início do período contratado
    end_date: rental.end_date, // Data de fim do período contratado
    installation_location: rental.installation_location,
    total_value: rental.total_value,
    discount: rental.discount,
    final_value: rental.final_value,

    budget_id: rental.budget_id,
    
    // Campos de recorrência
    is_recurring: rental.is_recurring || false,
    recurrence_type: rental.recurrence_type || "none",
    recurrence_interval: rental.recurrence_interval || 1,
    recurrence_end_date: rental.recurrence_end_date || null,
    recurrence_status: rental.recurrence_status || "active",
    parent_rental_id: rental.parent_rental_id || null,
    company_id: companyId, // Adicionar company_id
  }

  // Calcular próxima ocorrência
  rentalData.next_occurrence_date = rental.next_occurrence_date || calculateNextOccurrenceDate(rental)

  // Adicionar horários se as colunas existirem

  // Essas colunas podem não existir na tabela, então não vamos incluí-las por padrão
  // Se você quiser usar horários separados, execute o script 044-add-time-columns-to-rentals.sql
  
  // Incluir horários na tabela rentals
  rentalData.installation_time = format(logisticsData.installation, "HH:mm")
  rentalData.removal_time = format(logisticsData.removal, "HH:mm")

  console.log("Dados a serem inseridos:", rentalData)
  console.log("Período da locação:", rental.start_date, "até", rental.end_date)
  console.log("Datas de logística:", logisticsData.installation, "e", logisticsData.removal)
  console.log("Dados de recorrência:", {
    is_recurring: rentalData.is_recurring,
    recurrence_type: rentalData.recurrence_type,
    recurrence_interval: rentalData.recurrence_interval,
    recurrence_status: rentalData.recurrence_status
  })

  // 1. Criar a locação
  console.log("Tentando inserir locação com dados:", JSON.stringify(rentalData, null, 2))
  
  const { data: createdRental, error: rentalError } = await supabase.from("rentals").insert([rentalData]).select().single()

  if (rentalError) {
    console.error("Erro detalhado ao criar locação:", {
      message: rentalError.message,
      details: rentalError.details,
      hint: rentalError.hint,
      code: rentalError.code
    })
    throw new Error(`Erro ao criar locação: ${rentalError.message} - ${rentalError.details || ''}`)
  }

  // 2. Criar os itens da locação
  if (items.length > 0) {
    const rentalItems = items.map((item) => ({
      ...item,
      rental_id: createdRental.id,
    }))

    const { error: itemsError } = await supabase.from("rental_items").insert(rentalItems)

    if (itemsError) {
      console.error("Erro ao criar itens da locação:", itemsError)
      // Opcional: deletar a locação criada se os itens falharem
      await supabase.from("rentals").delete().eq("id", createdRental.id)
      throw itemsError
    }
  }

  // 3. Criar eventos de logística (opcional)
  try {
    // Nova estrutura simplificada: event_date (DATE) + event_time (TIME)
    const logisticsEvents = [
      {
        rental_id: createdRental.id,
        company_id: companyId, // Adicionar company_id para multi-tenancy
        event_type: "Instalação",
        event_date: format(logisticsData.installation, "yyyy-MM-dd"), // Data formatada
        event_time: format(logisticsData.installation, "HH:mm"), // Hora formatada
        status: "Agendado", // Status padrão da nova tabela
        notes: "Evento de instalação criado automaticamente",
      },
      {
        rental_id: createdRental.id,
        company_id: companyId, // Adicionar company_id para multi-tenancy
        event_type: "Retirada",
        event_date: format(logisticsData.removal, "yyyy-MM-dd"), // Data formatada
        event_time: format(logisticsData.removal, "HH:mm"), // Hora formatada
        status: "Agendado", // Status padrão da nova tabela
        notes: "Evento de retirada criado automaticamente",
      },
    ]

    const { error: logisticsError } = await supabase
      .from("rental_logistics_events")
      .insert(logisticsEvents)

    if (logisticsError) {
      console.error("Erro ao criar eventos de logística:", logisticsError)
      // Não vamos falhar a criação da locação por causa dos eventos
    }
  } catch (error) {
    console.error("Erro ao criar eventos de logística:", error)
    // Não vamos falhar a criação da locação por causa dos eventos
  }

  return createdRental
}

export async function updateRental(
  id: string,
  rental: Partial<Omit<Rental, "id" | "created_at" | "updated_at">>,
  items?: Omit<RentalItem, "id" | "rental_id" | "created_at">[],
) {
  const companyId = await getCurrentUserCompanyId()
  
  if (!companyId) {
    console.error('❌ updateRental: Company ID não encontrado')
    throw new Error('Usuário não autenticado ou empresa não encontrada')
  }

  // Mapear os campos para as colunas corretas do banco
  const updateData: any = {}
  
  if (rental.client_id !== undefined) updateData.client_id = rental.client_id
  if (rental.client_name !== undefined) updateData.client_name = rental.client_name
  if (rental.start_date !== undefined) {
    updateData.event_start_date = rental.start_date
    updateData.start_date = rental.start_date
  }
  if (rental.end_date !== undefined) {
    updateData.event_end_date = rental.end_date
    updateData.end_date = rental.end_date
  }
  if (rental.installation_location !== undefined) updateData.installation_location = rental.installation_location
  if (rental.total_value !== undefined) updateData.total_value = rental.total_value
  if (rental.discount !== undefined) updateData.discount = rental.discount
  if (rental.final_value !== undefined) updateData.final_value = rental.final_value

  if (rental.budget_id !== undefined) updateData.budget_id = rental.budget_id

  // Atualizar a locação
  const { data: rentalData, error: rentalError } = await supabase
    .from("rentals")
    .update(updateData)
    .eq("id", id)
    .eq("company_id", companyId) // Adicionar company_id na condição
    .select()
    .single()

  if (rentalError) {
    console.error("Erro ao atualizar locação:", rentalError)
    throw rentalError
  }

  // Se itens foram fornecidos, atualizar os itens
  if (items) {
    // Deletar itens existentes
    await supabase.from("rental_items").delete().eq("rental_id", id)

    // Inserir novos itens
    if (items.length > 0) {
      const rentalItems = items.map((item) => ({
        ...item,
        rental_id: id,
      }))

      const { error: itemsError } = await supabase.from("rental_items").insert(rentalItems)

      if (itemsError) {
        console.error("Erro ao atualizar itens da locação:", itemsError)
        throw itemsError
      }
    }
  }

  return rentalData
}

export async function deleteRental(id: string) {
  const companyId = await getCurrentUserCompanyId()
  
  if (!companyId) {
    console.error('❌ deleteRental: Company ID não encontrado')
    throw new Error('Usuário não autenticado ou empresa não encontrada')
  }

  // Os itens serão deletados automaticamente devido ao CASCADE
  const { error } = await supabase.from("rentals").delete().eq("id", id).eq("company_id", companyId) // Adicionar company_id na condição

  if (error) {
    console.error("Erro ao deletar locação:", error)
    throw error
  }

  return true
}

export async function searchRentals(searchTerm?: string, statusFilter?: string) {
  const companyId = await getCurrentUserCompanyId()
  
  if (!companyId) {
    console.error('❌ searchRentals: Company ID não encontrado')
    throw new Error('Usuário não autenticado ou empresa não encontrada')
  }

  let query = supabase.from("rentals").select(`
      *,
      rental_items (*)
    `)
    .eq("company_id", companyId) // Adicionar company_id na condição

  if (searchTerm) {
    query = query.or(`client_name.ilike.%${searchTerm}%,status.ilike.%${searchTerm}%`)
  }

  if (statusFilter && statusFilter !== "Todos") {
    query = query.eq("status", statusFilter)
  }

  query = query.order("created_at", { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error("Erro ao buscar locações:", error)
    throw error
  }

  return data || []
}

export async function getLogisticsEvents() {
  const companyId = await getCurrentUserCompanyId()
  
  if (!companyId) {
    console.error('❌ getLogisticsEvents: Company ID não encontrado')
    throw new Error('Usuário não autenticado ou empresa não encontrada')
  }

  const { data, error } = await supabase
    .from("rental_logistics_events")
    .select(`
      *,
      rentals (
        id,
        client_name,
        installation_location,
        total_value,
        rental_items (
          equipment_name
        )
      )
    `)
    .eq("company_id", companyId) // Filtrar diretamente pelo company_id da tabela rental_logistics_events
    .order("event_date, event_time", { ascending: true })

  if (error) {
    console.error("Erro ao buscar eventos de logística:", error)
    throw error
  }

  return data || []
}



