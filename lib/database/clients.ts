import { supabase } from "../supabase"
import type { Client } from "../supabase"

export async function getClients(limit?: number) {
  let query = supabase.from("clients").select("*").order("created_at", { ascending: false })

  // Aplicar limite se fornecido
  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error("Erro ao buscar clientes:", error)
    throw error
  }

  return data || []
}

export async function getClientById(id: string) {
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).single()

  if (error) {
    console.error("Erro ao buscar cliente:", error)
    throw error
  }

  return data
}

export async function createClient(client: Omit<Client, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase.from("clients").insert([client]).select().single()

  if (error) {
    console.error("Erro ao criar cliente:", error)
    throw error
  }

  return data
}

export async function updateClient(id: string, client: Partial<Omit<Client, "id" | "created_at" | "updated_at">>) {
  const { data, error } = await supabase.from("clients").update(client).eq("id", id).select().single()

  if (error) {
    console.error("Erro ao atualizar cliente:", error)
    throw error
  }

  return data
}

export async function deleteClient(id: string) {
  const { error } = await supabase.from("clients").delete().eq("id", id)

  if (error) {
    console.error("Erro ao deletar cliente:", error)
    throw error
  }

  return true
}

export async function searchClients(searchTerm: string, documentTypeFilter?: string) {
  let query = supabase.from("clients").select("*")

  if (searchTerm) {
    query = query.or(
      `name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,document_number.ilike.%${searchTerm}%`,
    )
  }

  if (documentTypeFilter && documentTypeFilter !== "Todos") {
    query = query.eq("document_type", documentTypeFilter)
  }

  query = query.order("created_at", { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error("Erro ao buscar clientes:", error)
    throw error
  }

  return data || []
}
