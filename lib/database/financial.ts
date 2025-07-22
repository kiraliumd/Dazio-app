// =====================================================
// FUNÇÕES DE BANCO DE DADOS - MÓDULO FINANCEIRO
// =====================================================

import { supabase } from '@/lib/supabase';
import { 
  Account, 
  Receivable, 
  FinancialTransaction,
  TransactionCategory,
  TransactionType,
  CreateAccountData,
  UpdateAccountData,
  CreateReceivableData,
  UpdateReceivableData,
  CreateTransactionData,
  UpdateTransactionData,
  CreateCategoryData,
  UpdateCategoryData,
  ReceivableFilters,
  TransactionFilters,
  AccountFilters,
  CategoryFilters,
  FinancialMetrics,
  FinancialSummary,
  OverdueReceivable
} from '@/lib/types/financial';

// =====================================================
// FUNÇÕES DE CONTAS
// =====================================================

// =====================================================
// FUNÇÕES DE CATEGORIAS
// =====================================================

export async function getCategories(filters?: CategoryFilters): Promise<TransactionCategory[]> {
  
  try {
    let query = supabase
      .from('transaction_categories')
      .select('*')
      .order('name', { ascending: true });

    if (filters) {
      if (filters.transaction_type) {
        query = query.eq('transaction_type', filters.transaction_type);
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Erro ao buscar categorias:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return [];
  }
}

export async function createCategory(categoryData: CreateCategoryData): Promise<TransactionCategory | null> {
  try {
    const { data, error } = await supabase
      .from('transaction_categories')
      .insert([{
        ...categoryData,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar categoria:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return null;
  }
}

export async function updateCategory(id: string, categoryData: UpdateCategoryData): Promise<TransactionCategory | null> {
  try {
    const { data, error } = await supabase
      .from('transaction_categories')
      .update({
        ...categoryData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar categoria:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    return null;
  }
}

export async function getCategoryById(id: string): Promise<TransactionCategory | null> {
  
  const { data, error } = await supabase
    .from('transaction_categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao buscar categoria:', error);
    return null;
  }

  return data;
}

export async function getCategoryByName(name: string, transactionType: TransactionType): Promise<TransactionCategory | null> {
  
  const { data, error } = await supabase
    .from('transaction_categories')
    .select('*')
    .eq('name', name)
    .eq('transaction_type', transactionType)
    .single();

  if (error) {
    console.error('Erro ao buscar categoria por nome:', error);
    return null;
  }

  return data;
}

// =====================================================
// FUNÇÕES DE CONTAS
// =====================================================

export async function getAccounts(filters?: AccountFilters): Promise<Account[]> {
  
  try {
    let query = supabase
      .from('accounts')
      .select('*')
      .order('name', { ascending: true });

    if (filters) {
      if (filters.account_type) {
        query = query.eq('account_type', filters.account_type);
      }
      if (filters.bank_name) {
        query = query.ilike('bank_name', `%${filters.bank_name}%`);
      }
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Erro ao buscar contas:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar contas:', error);
    return [];
  }
}

export async function createAccount(accountData: CreateAccountData): Promise<Account | null> {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .insert([{
        ...accountData,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar conta:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao criar conta:', error);
    return null;
  }
}

export async function updateAccount(id: string, accountData: UpdateAccountData): Promise<Account | null> {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .update({
        ...accountData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar conta:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao atualizar conta:', error);
    return null;
  }
}

export async function getAccountById(id: string): Promise<Account | null> {
  
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao buscar conta:', error);
    return null;
  }

  return data;
}



export async function deleteAccount(id: string): Promise<void> {
  
  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar conta:', error);
    throw new Error('Erro ao deletar conta');
  }
}

// =====================================================
// FUNÇÕES DE RECEBÍVEIS
// =====================================================

export async function getReceivables(filters?: ReceivableFilters): Promise<Receivable[]> {
  
  try {
    let query = supabase
      .from('receivables')
      .select(`
        *,
        rental:rentals(id, client_name, final_value, status),
        client:clients(id, name, phone, email),
        destination_account:accounts(*)
      `)
      .order('created_at', { ascending: false });

    if (filters) {
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.client_id) {
        query = query.eq('client_id', filters.client_id);
      }
      if (filters.due_date_from) {
        query = query.gte('due_date', filters.due_date_from);
      }
      if (filters.due_date_to) {
        query = query.lte('due_date', filters.due_date_to);
      }
      if (filters.payment_date_from) {
        query = query.gte('payment_date', filters.payment_date_from);
      }
      if (filters.payment_date_to) {
        query = query.lte('payment_date', filters.payment_date_to);
      }
      if (filters.min_amount) {
        query = query.gte('amount', filters.min_amount);
      }
      if (filters.max_amount) {
        query = query.lte('amount', filters.max_amount);
      }
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Erro ao buscar recebíveis:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar recebíveis:', error);
    return [];
  }
}

export async function getReceivableById(id: string): Promise<Receivable | null> {
  
  const { data, error } = await supabase
    .from('receivables')
    .select(`
      *,
      rental:rentals(id, client_name, final_value, status),
      client:clients(id, name, phone, email),
      destination_account:accounts(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao buscar recebível:', error);
    return null;
  }

  return data;
}

export async function createReceivable(receivableData: CreateReceivableData): Promise<Receivable> {
  
  const { data, error } = await supabase
    .from('receivables')
    .insert([receivableData])
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar recebível:', error);
    throw new Error('Erro ao criar recebível');
  }

  return data;
}

export async function updateReceivable(id: string, receivableData: UpdateReceivableData): Promise<Receivable> {
  
  const { data, error } = await supabase
    .from('receivables')
    .update(receivableData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar recebível:', error);
    throw new Error('Erro ao atualizar recebível');
  }

  return data;
}

export async function deleteReceivable(id: string): Promise<void> {
  
  const { error } = await supabase
    .from('receivables')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar recebível:', error);
    throw new Error('Erro ao deletar recebível');
  }
}

export async function getOverdueReceivables(): Promise<OverdueReceivable[]> {
  
  try {
    const { data, error } = await supabase
      .from('overdue_receivables')
      .select('*')
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar recebíveis vencidos:', error);
      // Se a view não existir, retornar array vazio em vez de falhar
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar recebíveis vencidos:', error);
    // Em caso de erro, retornar array vazio
    return [];
  }
}

// =====================================================
// FUNÇÕES DE TRANSAÇÕES
// =====================================================

export async function getTransactions(filters?: TransactionFilters): Promise<FinancialTransaction[]> {
  
  try {
    let query = supabase
      .from('financial_transactions')
      .select(`
        *,
        account:accounts(*),
        receivable:receivables(*),
        category:transaction_categories(*)
      `)
      .order('transaction_date', { ascending: false });

    if (filters) {
      if (filters.transaction_type) {
        query = query.eq('transaction_type', filters.transaction_type);
      }
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      if (filters.account_id) {
        query = query.eq('account_id', filters.account_id);
      }
      if (filters.payment_method) {
        query = query.eq('payment_method', filters.payment_method);
      }
      if (filters.date_from) {
        query = query.gte('transaction_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('transaction_date', filters.date_to);
      }
      if (filters.min_amount) {
        query = query.gte('amount', filters.min_amount);
      }
      if (filters.max_amount) {
        query = query.lte('amount', filters.max_amount);
      }
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Erro ao buscar transações:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    return [];
  }
}

export async function getTransactionById(id: string): Promise<FinancialTransaction | null> {
  
  const { data, error } = await supabase
    .from('financial_transactions')
    .select(`
      *,
      account:accounts(*),
      receivable:receivables(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao buscar transação:', error);
    return null;
  }

  return data;
}

// Nova função para buscar transações + recebíveis aprovados
export async function getTransactionsWithApprovedReceivables(filters?: TransactionFilters): Promise<(FinancialTransaction | Receivable)[]> {
  
  try {
    // Buscar transações normais
    const transactions = await getTransactions(filters);
    
    // Buscar recebíveis aprovados (que ainda não foram pagos)
    let receivablesQuery = supabase
      .from('receivables')
      .select(`
        *,
        client:clients(*),
        destination_account:accounts(*)
      `)
      .eq('status', 'Aprovado');

    // Aplicar filtros de conta se especificado
    if (filters?.account_id && filters.account_id !== 'all') {
      receivablesQuery = receivablesQuery.eq('destination_account_id', filters.account_id);
    }

    // Aplicar filtro de busca
    if (filters?.search) {
      receivablesQuery = receivablesQuery.or(`description.ilike.%${filters.search}%,client.name.ilike.%${filters.search}%`);
    }

    const { data: receivables, error: receivablesError } = await receivablesQuery
      .order('due_date', { ascending: false });

    if (receivablesError) {
      console.error('Erro ao buscar recebíveis aprovados:', receivablesError);
      throw new Error('Erro ao buscar recebíveis aprovados');
    }

    // Combinar e ordenar por data
    const allItems = [
      ...transactions,
      ...(receivables || [])
    ];

    // Ordenar por data (vencimento para recebíveis, transaction_date para transações)
    return allItems.sort((a, b) => {
      const dateA = 'transaction_date' in a ? a.transaction_date : a.due_date;
      const dateB = 'transaction_date' in b ? b.transaction_date : b.due_date;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

  } catch (error) {
    console.error('Erro ao buscar transações com recebíveis:', error);
    throw new Error('Erro ao buscar transações com recebíveis');
  }
}

export async function createTransaction(transactionData: CreateTransactionData): Promise<FinancialTransaction> {
  
  const { data, error } = await supabase
    .from('financial_transactions')
    .insert([transactionData])
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar transação:', error);
    throw new Error('Erro ao criar transação');
  }

  // Atualizar saldo da conta
  if (data) {
    await updateAccountBalance(transactionData.account_id, transactionData.amount, transactionData.transaction_type);
  }

  return data;
}

export async function updateTransaction(id: string, transactionData: UpdateTransactionData): Promise<FinancialTransaction> {
  
  const { data, error } = await supabase
    .from('financial_transactions')
    .update(transactionData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar transação:', error);
    throw new Error('Erro ao atualizar transação');
  }

  return data;
}

export async function deleteTransaction(id: string): Promise<void> {
  
  const { error } = await supabase
    .from('financial_transactions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar transação:', error);
    throw new Error('Erro ao deletar transação');
  }
}

// =====================================================
// FUNÇÕES DE RELATÓRIOS E MÉTRICAS
// =====================================================

export async function getFinancialMetrics(): Promise<FinancialMetrics> {
  
  try {
    // Buscar métricas de recebíveis
    const { data: receivablesData } = await supabase
      .from('receivables')
      .select('amount, status');

    // Buscar métricas de transações
    const { data: transactionsData } = await supabase
      .from('financial_transactions')
      .select('amount, transaction_type');

    // Buscar saldo total das contas
    const { data: accountsData } = await supabase
      .from('accounts')
      .select('current_balance')
      .eq('is_active', true);

    // Calcular métricas
    const receivables = receivablesData || [];
    const transactions = transactionsData || [];
    const accounts = accountsData || [];

    const total_receivables = receivables.reduce((sum, r) => sum + Number(r.amount), 0);
    const total_receivables_paid = receivables
      .filter(r => r.status === 'Pago')
      .reduce((sum, r) => sum + Number(r.amount), 0);
    const total_receivables_pending = receivables
      .filter(r => r.status === 'Pendente' || r.status === 'Aprovado')
      .reduce((sum, r) => sum + Number(r.amount), 0);
    const total_receivables_overdue = receivables
      .filter(r => r.status === 'Vencido')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const total_revenue = transactions
      .filter(t => t.transaction_type === 'Receita')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const total_expenses = transactions
      .filter(t => t.transaction_type === 'Despesa')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const net_income = total_revenue - total_expenses;
    const accounts_balance = accounts.reduce((sum, a) => sum + Number(a.current_balance), 0);

    return {
      total_receivables,
      total_receivables_paid,
      total_receivables_pending,
      total_receivables_overdue,
      total_revenue,
      total_expenses,
      net_income,
      accounts_balance
    };
  } catch (error) {
    console.error('Erro ao buscar métricas financeiras:', error);
    // Retornar métricas zeradas em caso de erro
    return {
      total_receivables: 0,
      total_receivables_paid: 0,
      total_receivables_pending: 0,
      total_receivables_overdue: 0,
      total_revenue: 0,
      total_expenses: 0,
      net_income: 0,
      accounts_balance: 0
    };
  }
}

export async function getFinancialSummary(): Promise<FinancialSummary[]> {
  
  try {
    const { data, error } = await supabase
      .from('financial_summary')
      .select('*')
      .order('month', { ascending: false });

    if (error) {
      console.error('Erro ao buscar resumo financeiro:', error);
      // Se a view não existir, retornar array vazio em vez de falhar
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar resumo financeiro:', error);
    // Em caso de erro, retornar array vazio
    return [];
  }
}

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

export async function approveReceivable(id: string, paymentData: {
  payment_method: string;
  destination_account_id: string;
  payment_date?: string;
  due_date?: string;
  notes?: string;
}): Promise<Receivable> {
  
  // Para recebíveis a prazo, NÃO criar transação ainda
  // Apenas aprovar e configurar dados de pagamento
  const updateData: any = {
    status: 'Aprovado' as const,
    payment_method: paymentData.payment_method,
    destination_account_id: paymentData.destination_account_id,
    payment_date: paymentData.payment_date,
    notes: paymentData.notes
  };
  if (paymentData.due_date) {
    updateData.due_date = paymentData.due_date;
  }

  const { data, error } = await supabase
    .from('receivables')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao aprovar recebível:', error);
    throw new Error('Erro ao aprovar recebível');
  }

  return data;
}

export async function markReceivableAsPaid(id: string, paymentData: {
  payment_date: string;
  notes?: string;
}): Promise<Receivable> {
  
  // Atualizar recebível como pago
  const { data: receivable, error: receivableError } = await supabase
    .from('receivables')
    .update({
      status: 'Pago',
      payment_date: paymentData.payment_date,
      notes: paymentData.notes
    })
    .eq('id', id)
    .select()
    .single();

  if (receivableError) {
    console.error('Erro ao marcar recebível como pago:', receivableError);
    throw new Error('Erro ao marcar recebível como pago');
  }

  // Criar transação de receita APENAS quando o dinheiro chegar
  if (receivable) {
    // Buscar categoria "Receita de Locação" ou criar se não existir
    let category = await getCategoryByName('Receita de Locação', 'Receita');
    if (!category) {
      category = await createCategory({
        name: 'Receita de Locação',
        transaction_type: 'Receita',
        description: 'Receitas provenientes de locações de equipamentos'
      });
    }

    if (category) {
      await createTransaction({
        account_id: receivable.destination_account_id!,
        category_id: category.id,
        transaction_type: 'Receita',
        description: receivable.description, // Corrigido: usar descrição original
        amount: receivable.amount,
        payment_method: receivable.payment_method,
        transaction_date: paymentData.payment_date,
        due_date: receivable.due_date, // Salvar data de vencimento
        notes: paymentData.notes,
        receivable_id: receivable.id
      });
    }
  }

  return receivable;
}

// =====================================================
// FUNÇÕES AUXILIARES PARA SALDO DE CONTAS
// =====================================================

export async function updateAccountBalance(accountId: string, amount: number, transactionType: TransactionType): Promise<void> {
  try {
    // Buscar conta atual
    const account = await getAccountById(accountId);
    if (!account) {
      throw new Error('Conta não encontrada');
    }

    // Calcular novo saldo
    let newBalance = account.current_balance;
    if (transactionType === 'Receita') {
      newBalance += amount;
    } else {
      newBalance -= amount;
    }

    // Atualizar saldo da conta
    await supabase
      .from('accounts')
      .update({ 
        current_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId);

  } catch (error) {
    console.error('Erro ao atualizar saldo da conta:', error);
    throw new Error('Erro ao atualizar saldo da conta');
  }
}

export async function getReceivablesByRental(rentalId: string): Promise<Receivable[]> {
  
  const { data, error } = await supabase
    .from('receivables')
    .select(`
      *,
      rental:rentals(id, client_name, final_value, status),
      client:clients(id, name, phone, email),
      destination_account:accounts(*)
    `)
    .eq('rental_id', rentalId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar recebíveis da locação:', error);
    throw new Error('Erro ao buscar recebíveis da locação');
  }

  return data || [];
} 