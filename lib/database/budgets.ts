import { supabase } from '../supabase';
import { getCurrentUserCompanyId } from './client-utils';
import { dataService } from '../services/data-service';
import type { Budget, BudgetItem } from '../utils/data-transformers';

export async function getBudgets(
  limit?: number,
  startDate?: string,
  endDate?: string
) {
  const companyId = await getCurrentUserCompanyId();

  if (!companyId) {
    console.error('❌ getBudgets: Company ID não encontrado');
    throw new Error('Usuário não autenticado ou empresa não encontrada');
  }

  let query = supabase
    .from('budgets')
    .select(
      `
      *,
      budget_items (*)
    `
    )
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (startDate && endDate) {
    query = query.gte('created_at', `${startDate}T00:00:00`);
    query = query.lte('created_at', `${endDate}T23:59:59`);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar orçamentos:', error);
    throw error;
  }

  return data;
}

export async function getBudgetById(id: string) {
  const companyId = await getCurrentUserCompanyId();

  if (!companyId) {
    console.error('❌ getBudgetById: Company ID não encontrado');
    throw new Error('Usuário não autenticado ou empresa não encontrada');
  }

  const { data, error } = await supabase
    .from('budgets')
    .select(
      `
      *,
      budget_items (*)
    `
    )
    .eq('id', id)
    .eq('company_id', companyId)
    .single();

  if (error) {
    console.error('Erro ao buscar orçamento:', error);
    throw error;
  }

  return data;
}

export async function createBudget(
  budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>,
  items: Omit<BudgetItem, 'id' | 'budget_id' | 'created_at'>[]
) {
  const companyId = await getCurrentUserCompanyId();

  if (!companyId) {
    console.error('❌ createBudget: Company ID não encontrado');
    throw new Error('Usuário não autenticado ou empresa não encontrada');
  }

  const budgetWithCompany = {
    ...budget,
    company_id: companyId,
  };

  // Criar o orçamento com tentativa de retry em caso de conflito no número
  let budgetData;
  {
    let attempts = 0;
    // Clonar o objeto para permitir alteração do number em caso de retry
    let payload = { ...budgetWithCompany } as any;
    // Tentar no máximo 3 vezes
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data, error } = await supabase
        .from('budgets')
        .insert([payload])
        .select()
        .single();

      if (!error) {
        budgetData = data;
        break;
      }

      // Se for erro de chave duplicada (23505), gerar um novo número e tentar de novo
      if ((error as any)?.code === '23505' && attempts < 3) {
        console.warn(
          'createBudget: Número duplicado, gerando novo e tentando novamente...'
        );
        try {
          const newNumber = await generateBudgetNumber();
          payload = { ...payload, number: newNumber };
          attempts += 1;
          continue;
        } catch (genErr) {
          console.error(
            'createBudget: Falha ao gerar novo número após conflito:',
            genErr
          );
          throw error;
        }
      }

      console.error('Erro ao criar orçamento:', error);
      throw error;
    }
  }

  // Criar os itens do orçamento
  if (items.length > 0) {
    const budgetItems = items.map(item => ({
      ...item,
      budget_id: budgetData.id,
    }));

    const { error: itemsError } = await supabase
      .from('budget_items')
      .insert(budgetItems);

    if (itemsError) {
      console.error('Erro ao criar itens do orçamento:', itemsError);
      throw itemsError;
    }
  }

  // Notificar mudança para invalidar cache
  try {
    dataService.notifyDataChange('budgets', 'create');
  } catch (error) {
    console.warn('Erro ao notificar mudança de cache:', error);
  }

  return budgetData;
}

export async function updateBudget(
  id: string,
  budget: Partial<Omit<Budget, 'id' | 'created_at' | 'updated_at'>>,
  items?: Omit<BudgetItem, 'id' | 'budget_id' | 'created_at'>[]
) {
  const companyId = await getCurrentUserCompanyId();

  if (!companyId) {
    console.error('❌ updateBudget: Company ID não encontrado');
    throw new Error('Usuário não autenticado ou empresa não encontrada');
  }

  // Atualizar o orçamento
  const { error: budgetError } = await supabase
    .from('budgets')
    .update({
      ...budget,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('company_id', companyId);

  if (budgetError) {
    console.error('Erro ao atualizar orçamento:', budgetError);
    throw budgetError;
  }

  // Atualizar itens se fornecidos
  if (items && items.length > 0) {
    // Remover itens existentes
    const { error: deleteError } = await supabase
      .from('budget_items')
      .delete()
      .eq('budget_id', id);

    if (deleteError) {
      console.error('Erro ao remover itens existentes:', deleteError);
      throw deleteError;
    }

    // Inserir novos itens
    const budgetItems = items.map(item => ({
      ...item,
      budget_id: id,
    }));

    const { error: itemsError } = await supabase
      .from('budget_items')
      .insert(budgetItems);

    if (itemsError) {
      console.error('Erro ao inserir novos itens:', itemsError);
      throw itemsError;
    }
  }

  // Notificar mudança para invalidar cache
  try {
    dataService.notifyDataChange('budgets', 'update');
  } catch (error) {
    console.warn('Erro ao notificar mudança de cache:', error);
  }

  return { success: true };
}

export async function deleteBudget(id: string) {
  const companyId = await getCurrentUserCompanyId();

  if (!companyId) {
    console.error('❌ deleteBudget: Company ID não encontrado');
    throw new Error('Usuário não autenticado ou empresa não encontrada');
  }

  // Remover itens primeiro (devido à foreign key)
  const { error: itemsError } = await supabase
    .from('budget_items')
    .delete()
    .eq('budget_id', id);

  if (itemsError) {
    console.error('Erro ao remover itens do orçamento:', itemsError);
    throw itemsError;
  }

  // Remover o orçamento
  const { error: budgetError } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id)
    .eq('company_id', companyId);

  if (budgetError) {
    console.error('Erro ao remover orçamento:', budgetError);
    throw budgetError;
  }

  // Notificar mudança para invalidar cache
  try {
    dataService.notifyDataChange('budgets', 'delete');
  } catch (error) {
    console.warn('Erro ao notificar mudança de cache:', error);
  }

  return { success: true };
}

export async function generateBudgetNumber(): Promise<string> {
  const companyId = await getCurrentUserCompanyId();

  if (!companyId) {
    throw new Error('Usuário não autenticado ou empresa não encontrada');
  }

  const currentYear = new Date().getFullYear();

  // Buscar o último número de orçamento deste ano
  const { data: lastBudget, error } = await supabase
    .from('budgets')
    .select('number')
    .eq('company_id', companyId)
    .like('number', `${currentYear}-%`)
    .order('number', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = nenhum resultado encontrado
    console.error('Erro ao buscar último orçamento:', error);
    throw error;
  }

  let nextNumber = 1;

  if (lastBudget) {
    const lastNumberStr = lastBudget.number.split('-')[1];
    const lastNumber = parseInt(lastNumberStr, 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
}
