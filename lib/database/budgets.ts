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

  try {
    let query = supabase
      .from('budgets')
      .select(`
        id,
        number,
        client_id,
        client_name,
        created_at,
        start_date,
        end_date,
        installation_time,
        removal_time,
        installation_location,
        subtotal,
        discount,
        total_value,
        status,
        observations,
        is_recurring,
        recurrence_type,
        recurrence_interval,
        recurrence_end_date,
        company_id,
        budget_items (
          id,
          equipment_name,
          quantity,
          daily_rate,
          days,
          total
        )
      `)
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

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error);
    throw error;
  }
}

export async function getBudgetById(id: string) {
  const companyId = await getCurrentUserCompanyId();

  if (!companyId) {
    console.error('❌ getBudgetById: Company ID não encontrado');
    throw new Error('Usuário não autenticado ou empresa não encontrada');
  }

  try {
    const { data, error } = await supabase
      .from('budgets')
      .select(`
        id,
        number,
        client_id,
        client_name,
        created_at,
        start_date,
        end_date,
        installation_time,
        removal_time,
        installation_location,
        subtotal,
        discount,
        total_value,
        status,
        observations,
        is_recurring,
        recurrence_type,
        recurrence_interval,
        recurrence_end_date,
        company_id,
        budget_items (
          id,
          equipment_name,
          quantity,
          daily_rate,
          days,
          total
        )
      `)
      .eq('id', id)
      .eq('company_id', companyId)
      .single();

    if (error) {
      console.error('Erro ao buscar orçamento:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar orçamento:', error);
    throw error;
  }
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

  try {
    // Importar a função de transformação
    const { transformBudgetToDB } = await import('../utils/data-transformers');
    
    // Transformar o orçamento para o formato do banco
    const budgetForDB = transformBudgetToDB(budget);
    
    // Adicionar company_id
    const budgetWithCompany = {
      ...budgetForDB,
      company_id: companyId,
    };

    // Criar o orçamento com tentativa de retry em caso de conflito no número
    let budgetData: any;
    let attempts = 0;
    let payload = { ...budgetWithCompany };
    
    // Tentar no máximo 3 vezes
    while (attempts < 3) {
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
      if ((error as any)?.code === '23505' && attempts < 2) {
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

    // Criar os itens do orçamento
    if (items.length > 0) {
      const budgetItems = items.map(item => ({
        budget_id: budgetData.id,
        equipment_name: item.equipmentName,
        quantity: item.quantity,
        daily_rate: item.dailyRate,
        days: item.days,
        total: item.total,
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
  } catch (error) {
    console.error('Erro ao criar orçamento:', error);
    throw error;
  }
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

  try {
    // ✅ CORREÇÃO: Para atualizações simples (como status), não transformar todos os campos
    let updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Se estiver atualizando apenas o status, não incluir outros campos
    if (Object.keys(budget).length === 1 && budget.status !== undefined) {
      updateData.status = budget.status;
    } else {
      // Para atualizações completas, usar transformação
      const { transformBudgetToDB } = await import('../utils/data-transformers');
      const budgetForDB = transformBudgetToDB(budget as any);
      updateData = {
        ...budgetForDB,
        updated_at: new Date().toISOString(),
      };
    }
    
    // ✅ CORREÇÃO: Log para debug
    console.log('🔍 updateBudget: Dados para atualização:', {
      id,
      companyId,
      updateData,
      budgetKeys: Object.keys(budget)
    });
    
    // Atualizar o orçamento
    const { error: budgetError } = await supabase
      .from('budgets')
      .update(updateData)
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
        budget_id: id,
        equipment_name: item.equipmentName,
        quantity: item.quantity,
        daily_rate: item.dailyRate,
        days: item.days,
        total: item.total,
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
  } catch (error) {
    console.error('Erro ao atualizar orçamento:', error);
    throw error;
  }
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

  try {
    // Buscar o último número de orçamento deste ano usando ilike (case-insensitive)
    const { data: lastBudget, error } = await supabase
      .from('budgets')
      .select('number')
      .eq('company_id', companyId)
      .ilike('number', `${currentYear}-%`)
      .order('number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Erro ao buscar último orçamento:', error);
      // Em caso de erro, retornar um número padrão
      return `${currentYear}-0001`;
    }

    let nextNumber = 1;

    if (lastBudget && lastBudget.length > 0) {
      const lastNumberStr = lastBudget[0].number.split('-')[1];
      const lastNumber = parseInt(lastNumberStr, 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    return `${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Erro ao gerar número do orçamento:', error);
    // Em caso de erro, retornar um número padrão
    return `${currentYear}-0001`;
  }
}
