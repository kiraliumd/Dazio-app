import { supabase } from "../supabase"

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
  const { data, error } = await supabase
    .from("equipment_categories")
    .select("*")
    .order("name", { ascending: true })

  if (error) {
    console.error("Erro ao buscar categorias de equipamentos:", error)
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
  const { data, error } = await supabase
    .from("equipment_categories")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true })

  if (error) {
    console.error("Erro ao buscar categorias ativas:", error)
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
  const { data, error } = await supabase
    .from("equipment_categories")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Erro ao buscar categoria:", error)
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
  const { data, error } = await supabase
    .from("equipment_categories")
    .insert([{
      name: category.name,
      description: category.description || null,
    }])
    .select()
    .single()

  if (error) {
    console.error("Erro ao criar categoria:", error)
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
  const { data, error } = await supabase
    .from("equipment_categories")
    .update({
      name: category.name,
      description: category.description,
      is_active: category.isActive,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Erro ao atualizar categoria:", error)
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
  // Verificar se há equipamentos usando esta categoria
  const { data: equipments, error: equipmentsError } = await supabase
    .from("equipments")
    .select("id, name")
    .eq("category", (await getEquipmentCategoryById(id)).name)

  if (equipmentsError) {
    console.error("Erro ao verificar equipamentos:", equipmentsError)
    throw equipmentsError
  }

  if (equipments && equipments.length > 0) {
    throw new Error(`Não é possível deletar esta categoria. Existem ${equipments.length} equipamento(s) associado(s).`)
  }

  const { error } = await supabase
    .from("equipment_categories")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Erro ao deletar categoria:", error)
    throw error
  }

  return true
}

// Buscar categorias com filtro
export async function searchEquipmentCategories(searchTerm?: string) {
  let query = supabase
    .from("equipment_categories")
    .select("*")

  if (searchTerm) {
    query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
  }

  query = query.order("name", { ascending: true })

  const { data, error } = await query

  if (error) {
    console.error("Erro ao buscar categorias:", error)
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