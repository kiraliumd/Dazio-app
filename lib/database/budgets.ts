import { supabase } from "../supabase"
import type { Budget, BudgetItem } from "../supabase"

export async function getBudgets(limit?: number) {
  let query = supabase
    .from("budgets")
    .select(`
      *,
      budget_items (*)
    `)
    .order("created_at", { ascending: false })

  // Aplicar limite se fornecido
  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error("Erro ao buscar orçamentos:", error)
    throw error
  }

  return data || []
}

export async function getBudgetById(id: string) {
  const { data, error } = await supabase
    .from("budgets")
    .select(`
      *,
      budget_items (*)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Erro ao buscar orçamento:", error)
    throw error
  }

  return data
}

export async function createBudget(
  budget: Omit<Budget, "id" | "created_at" | "updated_at">,
  items: Omit<BudgetItem, "id" | "budget_id" | "created_at">[],
) {
  // Criar o orçamento
  const { data: budgetData, error: budgetError } = await supabase.from("budgets").insert([budget]).select().single()

  if (budgetError) {
    console.error("Erro ao criar orçamento:", budgetError)
    throw budgetError
  }

  // Criar os itens do orçamento
  if (items.length > 0) {
    const budgetItems = items.map((item) => ({
      ...item,
      budget_id: budgetData.id,
    }))

    const { error: itemsError } = await supabase.from("budget_items").insert(budgetItems)

    if (itemsError) {
      console.error("Erro ao criar itens do orçamento:", itemsError)
      throw itemsError
    }
  }

  return budgetData
}

export async function updateBudget(
  id: string,
  budget: Partial<Omit<Budget, "id" | "created_at" | "updated_at">>,
  items?: Omit<BudgetItem, "id" | "budget_id" | "created_at">[],
) {
  // Atualizar o orçamento
  const { data: budgetData, error: budgetError } = await supabase
    .from("budgets")
    .update(budget)
    .eq("id", id)
    .select()
    .single()

  if (budgetError) {
    console.error("Erro ao atualizar orçamento:", budgetError)
    throw budgetError
  }

  // Se itens foram fornecidos, atualizar os itens
  if (items) {
    // Deletar itens existentes
    await supabase.from("budget_items").delete().eq("budget_id", id)

    // Inserir novos itens
    if (items.length > 0) {
      const budgetItems = items.map((item) => ({
        ...item,
        budget_id: id,
      }))

      const { error: itemsError } = await supabase.from("budget_items").insert(budgetItems)

      if (itemsError) {
        console.error("Erro ao atualizar itens do orçamento:", itemsError)
        throw itemsError
      }
    }
  }

  return budgetData
}

export async function deleteBudget(id: string) {
  // Os itens serão deletados automaticamente devido ao CASCADE
  const { error } = await supabase.from("budgets").delete().eq("id", id)

  if (error) {
    console.error("Erro ao deletar orçamento:", error)
    throw error
  }

  return true
}

export async function searchBudgets(searchTerm?: string) {
  let query = supabase.from("budgets").select(`
      *,
      budget_items (*)
    `)

  if (searchTerm) {
    query = query.or(`number.ilike.%${searchTerm}%,client_name.ilike.%${searchTerm}%,status.ilike.%${searchTerm}%`)
  }

  query = query.order("created_at", { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error("Erro ao buscar orçamentos:", error)
    throw error
  }

  return data || []
}

export async function generateBudgetNumber() {
  const year = new Date().getFullYear()

  // Buscar o último número do ano
  const { data, error } = await supabase
    .from("budgets")
    .select("number")
    .like("number", `ORC-${year}-%`)
    .order("number", { ascending: false })
    .limit(1)

  if (error) {
    console.error("Erro ao gerar número do orçamento:", error)
    throw error
  }

  let nextNumber = 1
  if (data && data.length > 0) {
    const lastNumber = data[0].number
    const match = lastNumber.match(/ORC-\d{4}-(\d{3})/)
    if (match) {
      nextNumber = Number.parseInt(match[1]) + 1
    }
  }

  return `ORC-${year}-${nextNumber.toString().padStart(3, "0")}`
}
