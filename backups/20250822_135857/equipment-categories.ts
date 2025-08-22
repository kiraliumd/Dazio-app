import { supabase } from "../supabase"
import { getCurrentUserCompanyId } from "./client-utils"

export interface EquipmentCategory {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateEquipmentCategory {
  name: string
  description?: string
}

export interface UpdateEquipmentCategory {
  name?: string
  description?: string
  isActive?: boolean
}

// Buscar todas as categorias
export async function getEquipmentCategories() {
  const companyId = await getCurrentUserCompanyId()
  
  if (!companyId) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error('❌ getEquipmentCategories: Company ID não encontrado')
    throw new Error('Usuário não autenticado ou empresa não encontrada')
  }

  const { data, error } = await supabase
    .from("equipment_categories")
    .select("*")
    .eq("company_id", companyId)
    .order("name", { ascending: true })

  if (error) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error("Erro ao buscar categorias de equipamentos:", error)
    throw error
  }

  // Mapear dados do banco para a interface
  return (data || []).map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    isActive: item.is_active,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }))
}

// Buscar categorias ativas
export async function getActiveEquipmentCategories() {
  const companyId = await getCurrentUserCompanyId()
  
  if (!companyId) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error('❌ getActiveEquipmentCategories: Company ID não encontrado')
    throw new Error('Usuário não autenticado ou empresa não encontrada')
  }

  const { data, error } = await supabase
    .from("equipment_categories")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("name", { ascending: true })

  if (error) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error("Erro ao buscar categorias ativas:", error)
    throw error
  }

  // Mapear dados do banco para a interface
  return (data || []).map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    isActive: item.is_active,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }))
}

// Buscar categoria por ID
export async function getEquipmentCategoryById(id: string) {
  const companyId = await getCurrentUserCompanyId()
  
  if (!companyId) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error('❌ getEquipmentCategoryById: Company ID não encontrado')
    throw new Error('Usuário não autenticado ou empresa não encontrada')
  }

  const { data, error } = await supabase
    .from("equipment_categories")
    .select("*")
    .eq("id", id)
    .eq("company_id", companyId)
    .single()

  if (error) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error("Erro ao buscar categoria:", error)
    throw error
  }

  // Mapear dados do banco para a interface
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

// Criar nova categoria
export async function createEquipmentCategory(category: CreateEquipmentCategory) {
  const companyId = await getCurrentUserCompanyId()
  
  if (!companyId) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error('❌ createEquipmentCategory: Company ID não encontrado')
    throw new Error('Usuário não autenticado ou empresa não encontrada')
  }

  const { data, error } = await supabase
    .from("equipment_categories")
    .insert([{
      name: category.name,
      description: category.description || null,
      company_id: companyId
    }])
    .select()
    .single()

  if (error) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error("Erro ao criar categoria:", error)
    throw error
  }

  // Mapear dados do banco para a interface
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

// Atualizar categoria
export async function updateEquipmentCategory(id: string, category: UpdateEquipmentCategory) {
  const companyId = await getCurrentUserCompanyId()
  
  if (!companyId) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error('❌ updateEquipmentCategory: Company ID não encontrado')
    throw new Error('Usuário não autenticado ou empresa não encontrada')
  }

  const { data, error } = await supabase
    .from("equipment_categories")
    .update({
      name: category.name,
      description: category.description,
      is_active: category.isActive,
    })
    .eq("id", id)
    .eq("company_id", companyId)
    .select()
    .single()

  if (error) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error("Erro ao atualizar categoria:", error)
    throw error
  }

  // Mapear dados do banco para a interface
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

// Deletar categoria
export async function deleteEquipmentCategory(id: string) {
  const companyId = await getCurrentUserCompanyId()
  
  if (!companyId) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error('❌ deleteEquipmentCategory: Company ID não encontrado')
    throw new Error('Usuário não autenticado ou empresa não encontrada')
  }

  // Verificar se há equipamentos usando esta categoria
  const { data: equipments, error: equipmentsError } = await supabase
    .from("equipments")
    .select("id, name")
    .eq("category", (await getEquipmentCategoryById(id)).name)
    .eq("company_id", companyId)

  if (equipmentsError) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error("Erro ao verificar equipamentos:", equipmentsError)
    throw equipmentsError
  }

  if (equipments && equipments.length > 0) {
    throw new Error(`Não é possível deletar esta categoria. Existem ${equipments.length} equipamento(s) associado(s).`)
  }

  const { error } = await supabase
    .from("equipment_categories")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId)

  if (error) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error("Erro ao deletar categoria:", error)
    throw error
  }

  return true
}

// Buscar categorias com filtro
export async function searchEquipmentCategories(searchTerm?: string) {
  const companyId = await getCurrentUserCompanyId()
  
  if (!companyId) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error('❌ searchEquipmentCategories: Company ID não encontrado')
    throw new Error('Usuário não autenticado ou empresa não encontrada')
  }

  let query = supabase
    .from("equipment_categories")
    .select("*")
    .eq("company_id", companyId)

  if (searchTerm) {
    query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
  }

  query = query.order("name", { ascending: true })

  const { data, error } = await query

  if (error) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error("Erro ao buscar categorias:", error)
    throw error
  }

  // Mapear dados do banco para a interface
  return (data || []).map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    isActive: item.is_active,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }))
} 