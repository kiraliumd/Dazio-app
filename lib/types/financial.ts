// =====================================================
// TIPOS DO MÓDULO FINANCEIRO - DAZIO
// =====================================================

export type PaymentMethod = 
  | 'PIX' 
  | 'Boleto' 
  | 'Dinheiro' 
  | 'Cartão de Crédito' 
  | 'Cartão de Débito' 
  | 'Transferência Bancária' 
  | 'Cheque';

export type ReceivableStatus = 
  | 'Pendente' 
  | 'Aprovado' 
  | 'Pago' 
  | 'Cancelado' 
  | 'Vencido';

export type TransactionType = 
  | 'Receita' 
  | 'Despesa';

export type AccountType = 
  | 'Caixa' 
  | 'Conta Corrente';

// =====================================================
// INTERFACES PRINCIPAIS
// =====================================================

export interface TransactionCategory {
  id: string;
  name: string;
  transaction_type: TransactionType;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  account_type: AccountType;
  current_balance: number;
  is_active: boolean;
  bank_name?: string;
  agency?: string;
  account_number?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Receivable {
  id: string;
  rental_id: string;
  client_id: string;
  client_name: string;
  description: string;
  amount: number;
  due_date: string;
  status: ReceivableStatus;
  payment_method?: PaymentMethod;
  destination_account_id?: string;
  payment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Relacionamentos
  rental?: {
    id: string;
    client_name: string;
    final_value: number;
    status: string;
  };
  client?: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  destination_account?: Account;
}

export interface FinancialTransaction {
  id: string;
  receivable_id?: string;
  account_id: string;
  category_id: string;
  transaction_type: TransactionType;
  description: string;
  amount: number;
  payment_method?: PaymentMethod;
  transaction_date: string;
  due_date?: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Relacionamentos
  account?: Account;
  receivable?: Receivable;
  category?: TransactionCategory;
}

// =====================================================
// INTERFACES PARA FORMULÁRIOS
// =====================================================

export interface CreateCategoryData {
  name: string;
  transaction_type: TransactionType;
  description?: string;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  is_active?: boolean;
}

export interface CreateAccountData {
  name: string;
  type: string;
  account_type: AccountType;
  current_balance: number;
  bank_name?: string;
  agency?: string;
  account_number?: string;
  description?: string;
}

export interface UpdateAccountData extends Partial<CreateAccountData> {
  is_active?: boolean;
}

export interface CreateReceivableData {
  rental_id: string;
  client_id: string;
  client_name: string;
  description: string;
  amount: number;
  due_date: string;
  notes?: string;
}

export interface UpdateReceivableData {
  status?: ReceivableStatus;
  payment_method?: PaymentMethod;
  destination_account_id?: string;
  payment_date?: string;
  notes?: string;
}

export interface CreateTransactionData {
  account_id: string;
  category_id: string;
  transaction_type: TransactionType;
  description: string;
  amount: number;
  payment_method?: PaymentMethod;
  transaction_date: string;
  due_date?: string; // Data de vencimento
  reference_number?: string;
  notes?: string;
  receivable_id?: string;
}

export interface UpdateTransactionData extends Partial<CreateTransactionData> {}

// =====================================================
// INTERFACES PARA RELATÓRIOS
// =====================================================

export interface FinancialSummary {
  month: string;
  transaction_type: TransactionType;
  total_amount: number;
  transaction_count: number;
}

export interface OverdueReceivable extends Receivable {
  days_overdue: number;
}

export interface FinancialMetrics {
  total_receivables: number;
  total_receivables_paid: number;
  total_receivables_pending: number;
  total_receivables_overdue: number;
  total_revenue: number;
  total_expenses: number;
  net_income: number;
  accounts_balance: number;
}

// =====================================================
// INTERFACES PARA FILTROS E BUSCA
// =====================================================

export interface ReceivableFilters {
  status?: ReceivableStatus;
  client_id?: string;
  due_date_from?: string;
  due_date_to?: string;
  payment_date_from?: string;
  payment_date_to?: string;
  min_amount?: number;
  max_amount?: number;
}

export interface TransactionFilters {
  transaction_type?: TransactionType;
  category_id?: string;
  account_id?: string;
  payment_method?: PaymentMethod;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
}

export interface AccountFilters {
  account_type?: AccountType;
  bank_name?: string;
}

export interface CategoryFilters {
  transaction_type?: TransactionType;
  is_active?: boolean;
}

// =====================================================
// CONSTANTES
// =====================================================

export const PAYMENT_METHODS: PaymentMethod[] = [
  'PIX',
  'Boleto', 
  'Dinheiro',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Transferência Bancária',
  'Cheque'
];

export const RECEIVABLE_STATUSES: ReceivableStatus[] = [
  'Pendente',
  'Aprovado',
  'Pago',
  'Cancelado',
  'Vencido'
];

export const TRANSACTION_TYPES: TransactionType[] = [
  'Receita',
  'Despesa'
];

export const ACCOUNT_TYPES: AccountType[] = [
  'Caixa',
  'Conta Corrente'
];

// Categorias padrão do sistema
export const DEFAULT_CATEGORIES: CreateCategoryData[] = [
  // Receitas
  { name: 'Receita de Locação', transaction_type: 'Receita', description: 'Receitas provenientes de locações de equipamentos' },
  { name: 'Receita de Serviços', transaction_type: 'Receita', description: 'Receitas provenientes de serviços prestados' },
  { name: 'Receita de Vendas', transaction_type: 'Receita', description: 'Receitas provenientes de vendas de produtos' },
  { name: 'Outras Receitas', transaction_type: 'Receita', description: 'Outras receitas não categorizadas' },
  
  // Despesas
  { name: 'Aluguel', transaction_type: 'Despesa', description: 'Despesas com aluguel de imóveis' },
  { name: 'Energia Elétrica', transaction_type: 'Despesa', description: 'Despesas com energia elétrica' },
  { name: 'Água', transaction_type: 'Despesa', description: 'Despesas com água' },
  { name: 'Internet/Telefone', transaction_type: 'Despesa', description: 'Despesas com internet e telefone' },
  { name: 'Combustível', transaction_type: 'Despesa', description: 'Despesas com combustível' },
  { name: 'Manutenção', transaction_type: 'Despesa', description: 'Despesas com manutenção de equipamentos' },
  { name: 'Salários', transaction_type: 'Despesa', description: 'Despesas com salários e encargos' },
  { name: 'Impostos', transaction_type: 'Despesa', description: 'Despesas com impostos e taxas' },
  { name: 'Marketing', transaction_type: 'Despesa', description: 'Despesas com marketing e publicidade' },
  { name: 'Outras Despesas', transaction_type: 'Despesa', description: 'Outras despesas não categorizadas' }
];

// =====================================================
// UTILITÁRIOS
// =====================================================

export const getStatusColor = (status: ReceivableStatus): string => {
  switch (status) {
    case 'Pendente':
      return 'text-yellow-600 bg-yellow-50';
    case 'Aprovado':
      return 'text-blue-600 bg-blue-50';
    case 'Pago':
      return 'text-green-600 bg-green-50';
    case 'Cancelado':
      return 'text-red-600 bg-red-50';
    case 'Vencido':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export const getTransactionTypeColor = (type: TransactionType): string => {
  switch (type) {
    case 'Receita':
      return 'text-green-600 bg-green-50';
    case 'Despesa':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('pt-BR');
};

export const isOverdue = (dueDate: string): boolean => {
  return new Date(dueDate) < new Date();
};

export const getDaysOverdue = (dueDate: string): number => {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}; 