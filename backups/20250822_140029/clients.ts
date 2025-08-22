import { supabase } from "../supabase"
import type { Client } from "../supabase"
import { getCurrentUserCompanyId } from "./client-utils"

export async function getClients(limit?: number) {
  const companyId = await getCurrentUserCompanyId()
  
  if (!companyId) {
    if (process.env.NODE_ENV === "development") { console.error('❌ getClients: Company ID não encontrado')
    throw new Error('Usuário não autenticado ou empresa não encontrada')
  }

  let query = supabase
    .from("clients")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })

  // Aplicar limite se fornecido
  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    if (process.env.NODE_ENV === "development") { console.error("Erro ao buscar clientes:", error)
    throw error
  }

  return data || []
}

export async function getClientById(id: string) {
  const companyId = await getCurrentUserCompanyId()
  
  if (!companyId) {
    if (process.env.NODE_ENV === "development") { console.error('❌ getClientById: Company ID não encontrado')
    throw new Error('Usuário não autenticado ou empresa não encontrada')
  }

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("company_id", companyId)
    .single()

  if (error) {
    if (process.env.NODE_ENV === "development") { console.error("Erro ao buscar cliente:", error)
    throw error
  }

  return data
}

export async function createClient(client: Omit<Client, "id" | "created_at" | "updated_at">) {
  const companyId = await getCurrentUserCompanyId()
  
  if (!companyId) {
    if (process.env.NODE_ENV === "development") { console.error('❌ createClient: Company ID não encontrado')
    throw new Error('Usuário não autenticado ou empresa não encontrada')
  }

  const clientWithCompany = {
    ...client,
    company_id: companyId
  }

  const { data, error } = await supabase
    .from("clients")
    .insert([clientWithCompany])
    .select()
    .single()

  if (error) {
    if (process.env.NODE_ENV === "development") { console.error("Erro ao criar cliente:", error)
    throw error
  }

  return data
}

export async function updateClient(id: string, client: Partial<Omit<Client, "id" | "created_at" | "updated_at">>) {
  const companyId = await getCurrentUserCompanyId()
  
  if (!companyId) {
    if (process.env.NODE_ENV === "development") { console.error('❌ updateClient: Company ID não encontrado')
    throw new Error('Usuário não autenticado ou empresa não encontrada')
  }

  const { data, error } = await supabase
    .from("clients")
    .update(client)
    .eq("id", id)
    .eq("company_id", companyId)
    .select()
    .single()

  if (error) {
    if (process.env.NODE_ENV === "development") { console.error("Erro ao atualizar cliente:", error)
    throw error
  }

  return data
}

export async function deleteClient(id: string) {
  const companyId = await getCurrentUserCompanyId()
  
  if (!companyId) {
    if (process.env.NODE_ENV === "development") { console.error('❌ deleteClient: Company ID não encontrado')
    throw new Error('Usuário não autenticado ou empresa não encontrada')
  }

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId)

  if (error) {
    if (process.env.NODE_ENV === "development") { console.error("Erro ao deletar cliente:", error)
    throw error
  }

  return true
}

export async function searchClients(searchTerm: string, documentTypeFilter?: string) {
  const companyId = await getCurrentUserCompanyId()
  
  if (!companyId) {
    if (process.env.NODE_ENV === "development") { console.error('❌ searchClients: Company ID não encontrado')
    throw new Error('Usuário não autenticado ou empresa não encontrada')
  }

  let query = supabase
    .from("clients")
    .select("*")
    .eq("company_id", companyId)

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
    if (process.env.NODE_ENV === "development") { console.error("Erro ao buscar clientes:", error)
    throw error
  }

  return data || []
}
