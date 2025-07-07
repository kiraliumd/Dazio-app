import { supabase } from "../supabase"
import type { Equipment } from "../supabase"

export async function getEquipments() {
  const { data, error } = await supabase.from("equipments").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Erro ao buscar equipamentos:", error)
    throw error
  }

  return data || []
}

export async function getEquipmentById(id: string) {
  const { data, error } = await supabase.from("equipments").select("*").eq("id", id).single()

  if (error) {
    console.error("Erro ao buscar equipamento:", error)
    throw error
  }

  return data
}

export async function createEquipment(equipment: Omit<Equipment, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase.from("equipments").insert([equipment]).select().single()

  if (error) {
    console.error("Erro ao criar equipamento:", error)
    throw error
  }

  return data
}

export async function updateEquipment(
  id: string,
  equipment: Partial<Omit<Equipment, "id" | "created_at" | "updated_at">>,
) {
  const { data, error } = await supabase.from("equipments").update(equipment).eq("id", id).select().single()

  if (error) {
    console.error("Erro ao atualizar equipamento:", error)
    throw error
  }

  return data
}

export async function deleteEquipment(id: string) {
  const { error } = await supabase.from("equipments").delete().eq("id", id)

  if (error) {
    console.error("Erro ao deletar equipamento:", error)
    throw error
  }

  return true
}

export async function searchEquipments(searchTerm?: string, categoryFilter?: string, statusFilter?: string) {
  let query = supabase.from("equipments").select("*")

  if (searchTerm) {
    query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
  }

  if (categoryFilter && categoryFilter !== "Todas") {
    query = query.eq("category", categoryFilter)
  }

  if (statusFilter && statusFilter !== "Todos") {
    query = query.eq("status", statusFilter)
  }

  query = query.order("created_at", { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error("Erro ao buscar equipamentos:", error)
    throw error
  }

  return data || []
}
