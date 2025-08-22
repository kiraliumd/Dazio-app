import { supabase } from "../supabase"
import type { Equipment } from "../supabase"
import { getCurrentUserCompanyId } from "./client-utils"

export async function getEquipments() {
  const companyId = await getCurrentUserCompanyId()
  
  if (!companyId) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error('❌ getEquipments: Company ID não encontrado')
    throw new Error('Usuário não autenticado ou empresa não encontrada')
  }

  const { data, error } = await supabase
    .from("equipments")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })

  if (error) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error("Erro ao buscar equipamentos:", error)
    throw error
  }

  return data || []
}

export async function getEquipmentById(id: string) {
  const companyId = await getCurrentUserCompanyId()
  
  if (!companyId) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error('❌ getEquipmentById: Company ID não encontrado')
    throw new Error('Usuário não autenticado ou empresa não encontrada')
  }

  const { data, error } = await supabase
    .from("equipments")
    .select("*")
    .eq("id", id)
    .eq("company_id", companyId)
    .single()

  if (error) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error("Erro ao buscar equipamento:", error)
    throw error
  }

  return data
}

export async function createEquipment(equipment: Omit<Equipment, "id" | "created_at" | "updated_at">) {
  const companyId = await getCurrentUserCompanyId()
  
  if (!companyId) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error('❌ createEquipment: Company ID não encontrado')
    throw new Error('Usuário não autenticado ou empresa não encontrada')
  }

  const equipmentWithCompany = {
    ...equipment,
    company_id: companyId
  }

  const { data, error } = await supabase
    .from("equipments")
    .insert([equipmentWithCompany])
    .select()
    .single()

  if (error) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error("Erro ao criar equipamento:", error)
    throw error
  }

  return data
}

export async function updateEquipment(
  id: string,
  equipment: Partial<Omit<Equipment, "id" | "created_at" | "updated_at">>,
) {
  const companyId = await getCurrentUserCompanyId()
  
  if (!companyId) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error('❌ updateEquipment: Company ID não encontrado')
    throw new Error('Usuário não autenticado ou empresa não encontrada')
  }

  const { data, error } = await supabase
    .from("equipments")
    .update(equipment)
    .eq("id", id)
    .eq("company_id", companyId)
    .select()
    .single()

  if (error) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error("Erro ao atualizar equipamento:", error)
    throw error
  }

  return data
}

export async function deleteEquipment(id: string) {
  const companyId = await getCurrentUserCompanyId()
  
  if (!companyId) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error('❌ deleteEquipment: Company ID não encontrado')
    throw new Error('Usuário não autenticado ou empresa não encontrada')
  }

  const { error } = await supabase
    .from("equipments")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId)

  if (error) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error("Erro ao deletar equipamento:", error)
    throw error
  }

  return true
}

export async function searchEquipments(searchTerm?: string, categoryFilter?: string, statusFilter?: string) {
  const companyId = await getCurrentUserCompanyId()
  
  if (!companyId) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error('❌ searchEquipments: Company ID não encontrado')
    throw new Error('Usuário não autenticado ou empresa não encontrada')
  }

  let query = supabase
    .from("equipments")
    .select("*")
    .eq("company_id", companyId)

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
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error("Erro ao buscar equipamentos:", error)
    throw error
  }

  return data || []
}

// Verificar disponibilidade de equipamentos para um período
export async function checkEquipmentAvailability(
  equipmentName: string, 
  requiredQuantity: number, 
  startDate: string, 
  endDate: string,
  excludeRentalId?: string
) {
  const companyId = await getCurrentUserCompanyId()
  if (!companyId) {
    return { available: false, message: "Usuário não autenticado ou empresa não encontrada" }
  }
  // Buscar quantidade total disponível do equipamento
  const { data: equipment, error: equipmentError } = await supabase
    .from("equipments")
    .select("quantity, rented_quantity, maintenance_quantity")
    .eq("name", equipmentName)
    .eq('company_id', companyId)
    .single()

  if (equipmentError || !equipment) {
    return { available: false, message: "Equipamento não encontrado" }
  }

  const totalAvailable = equipment.quantity - equipment.rented_quantity - equipment.maintenance_quantity

  // Buscar locações ativas no período
  const { data: activeRentals, error: rentalsError } = await supabase
    .from("rentals")
    .select("id")
    .in("status", ["Instalação Pendente", "Ativo"])
    .lte('start_date', endDate)
    .gte('end_date', startDate)
    .eq('company_id', companyId)

  if (rentalsError) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error("Erro ao buscar locações ativas:", rentalsError)
    return { available: false, message: "Erro ao verificar disponibilidade" }
  }

  const rentalIds = activeRentals?.map(r => r.id) || []
  
  if (rentalIds.length === 0) {
    return {
      available: totalAvailable >= requiredQuantity,
      availableQuantity: totalAvailable,
      requiredQuantity,
      message: totalAvailable >= requiredQuantity 
        ? "Equipamento disponível" 
        : `Quantidade insuficiente. Disponível: ${totalAvailable}, Necessário: ${requiredQuantity}`
    }
  }

  // Buscar quantidade já alugada no período
  let query = supabase
    .from("rental_items")
    .select("quantity")
    .eq("equipment_name", equipmentName)
    .in("rental_id", rentalIds)

  if (excludeRentalId) {
    query = query.neq("rental_id", excludeRentalId)
  }

  const { data: rentedItems, error: rentedError } = await query

  if (rentedError) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error("Erro ao verificar equipamentos alugados:", rentedError)
    return { available: false, message: "Erro ao verificar disponibilidade" }
  }

  const currentlyRented = rentedItems?.reduce((sum, item) => sum + item.quantity, 0) || 0
  const actuallyAvailable = totalAvailable - currentlyRented

  return {
    available: actuallyAvailable >= requiredQuantity,
    availableQuantity: actuallyAvailable,
    requiredQuantity,
    message: actuallyAvailable >= requiredQuantity 
      ? "Equipamento disponível" 
      : `Quantidade insuficiente. Disponível: ${actuallyAvailable}, Necessário: ${requiredQuantity}`
  }
}

// Buscar equipamentos com informações de disponibilidade
export async function getEquipmentsWithAvailability() {
  const companyId = await getCurrentUserCompanyId()
  if (!companyId) {
    throw new Error('Usuário não autenticado ou empresa não encontrada')
  }

  const { data, error } = await supabase
    .from("equipments")
    .select("*")
    .eq('company_id', companyId)
    .order("name", { ascending: true })

  if (error) {
    if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error("Erro ao buscar equipamentos:", error)
    throw error
  }

  return data || []
}
