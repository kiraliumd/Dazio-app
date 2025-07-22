"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { NotificationBell } from "@/components/notification-bell"
import { DollarSign, TrendingUp, TrendingDown, Wallet, Clock, CheckCircle, AlertCircle, BarChart3, Calendar, User, Search, Filter, Plus, Edit, MoreVertical, Trash2 } from "lucide-react"
import { getFinancialMetrics, getReceivables, getTransactions, getTransactionsWithApprovedReceivables, getAccounts, getFinancialSummary, getOverdueReceivables, createAccount, updateAccount, getCategories, createCategory, updateCategory, markReceivableAsPaid } from '@/lib/database/financial'
import { AccountForm } from '@/components/account-form'
import { CategoryForm } from '@/components/category-form'
import { formatCurrency, formatDate, type Receivable, type FinancialTransaction, type Account, type FinancialSummary, type OverdueReceivable, type TransactionCategory } from '@/lib/types/financial'
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { ExpenseModal } from '@/components/expense-modal';
import { IncomeModal } from '@/components/income-modal';
import { TransferModal } from '@/components/transfer-modal';

interface FinancialMetrics {
  total_receivables: number
  total_receivables_paid: number
  total_receivables_pending: number
  total_receivables_overdue: number
  total_revenue: number
  total_expenses: number
  net_income: number
  accounts_balance: number
}

// Hook para debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function FinanceiroPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    total_receivables: 0,
    total_receivables_paid: 0,
    total_receivables_pending: 0,
    total_receivables_overdue: 0,
    total_revenue: 0,
    total_expenses: 0,
    net_income: 0,
    accounts_balance: 0
  })
  const [recebiveis, setRecebiveis] = useState<Receivable[]>([])
  const [transacoes, setTransacoes] = useState<(FinancialTransaction | Receivable)[]>([])
  const [contas, setContas] = useState<Account[]>([])
  const [categorias, setCategorias] = useState<TransactionCategory[]>([])
  const [summary, setSummary] = useState<FinancialSummary[]>([])
  const [overdueReceivables, setOverdueReceivables] = useState<OverdueReceivable[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estados para busca e filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterAccount, setFilterAccount] = useState<string>("all")
  
  // Estados para modais
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [destinationAccount, setDestinationAccount] = useState<string>("")
  const [paymentDate, setPaymentDate] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [saving, setSaving] = useState(false)

  // Estados para formulário de conta
  const [accountFormOpen, setAccountFormOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [savingAccount, setSavingAccount] = useState(false)

  // Estados para formulário de categoria
  const [categoryFormOpen, setCategoryFormOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | null>(null)
  const [savingCategory, setSavingCategory] = useState(false)

  // Debounce do termo de busca
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Estados para filtro de data
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const [filterDateFrom, setFilterDateFrom] = useState<string>(firstDay.toLocaleDateString('en-CA'));
  const [filterDateTo, setFilterDateTo] = useState<string>(lastDay.toLocaleDateString('en-CA'));

  // Estados para modo de visualização e filtro de data personalizado
  const [viewMode, setViewMode] = useState<string>("mensal");
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Estados para modal de gasto
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  // Carregar dados
  const loadData = async () => {
    try {
      setLoading(true)
      const [
        metricsData,
        recebiveisData,
        transacoesData,
        contasData,
        categoriasData,
        summaryData,
        overdueData
      ] = await Promise.all([
        getFinancialMetrics(),
        getReceivables({ status: 'Pendente' }),
        getTransactionsWithApprovedReceivables({
          date_from: filterDateFrom,
          date_to: filterDateTo
        }),
        getAccounts(),
        getCategories(),
        getFinancialSummary(),
        getOverdueReceivables()
      ])
      
      setMetrics(metricsData)
      setRecebiveis(recebiveisData)
      setTransacoes(transacoesData)
      setContas(contasData)
      setCategorias(categoriasData)
      setSummary(summaryData)
      setOverdueReceivables(overdueData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados financeiros.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDateFrom, filterDateTo]);

  // Filtrar recebíveis
  const filteredRecebiveis = recebiveis.filter((r) =>
    r.client_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    r.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  )

  // Filtrar transações e recebíveis aprovados
  const filteredTransacoes = transacoes.filter((item) => {
    // Verificar se é uma transação ou recebível
    const isTransaction = 'transaction_type' in item;
    const isReceivable = 'due_date' in item;
    
    let matchesSearch = false;
    let matchesType = true;
    let matchesAccount = true;
    
    if (isTransaction) {
      // É uma transação normal
      const transaction = item as FinancialTransaction;
      matchesSearch = transaction.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                     (transaction.account?.name?.toLowerCase() || '').includes(debouncedSearchTerm.toLowerCase());
      matchesType = filterType === "all" || transaction.transaction_type === filterType;
      matchesAccount = filterAccount === "all" || transaction.account_id === filterAccount;
    } else if (isReceivable) {
      // É um recebível aprovado
      const receivable = item as Receivable;
      matchesSearch = receivable.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                     receivable.client_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                     (receivable.destination_account?.name?.toLowerCase() || '').includes(debouncedSearchTerm.toLowerCase());
      matchesType = filterType === "all" || filterType === "Receita"; // Recebíveis são sempre receitas
      matchesAccount = filterAccount === "all" || receivable.destination_account_id === filterAccount;
    }
    
    return matchesSearch && matchesType && matchesAccount;
  });

  // Filtrar contas
  const filteredContas = contas.filter((conta) =>
    conta.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    conta.bank_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    conta.account_type.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  )

  // Calcular totais das transações e recebíveis
  const transactionTotals = {
    revenue: filteredTransacoes.reduce((sum, item) => {
      if ('transaction_type' in item) {
        return sum + (item.transaction_type === 'Receita' ? item.amount : 0);
      } else {
        // Recebíveis aprovados são sempre receitas
        return sum + item.amount;
      }
    }, 0),
    expenses: filteredTransacoes.reduce((sum, item) => {
      if ('transaction_type' in item) {
        return sum + (item.transaction_type === 'Despesa' ? item.amount : 0);
      }
      return sum;
    }, 0),
    net: 0,
    count: filteredTransacoes.length
  }
  transactionTotals.net = transactionTotals.revenue - transactionTotals.expenses

  // Calcular totais das contas
  const accountTotals = {
    totalBalance: contas.reduce((sum, conta) => sum + conta.current_balance, 0)
  }

  // Abrir modal de aprovação
  const handleApprove = (receivable: Receivable) => {
    setSelectedReceivable(receivable)
    setPaymentMethod("")
    setDestinationAccount("")
    setPaymentDate(new Date().toISOString().split('T')[0])
    setNotes("")
    setApprovalDialogOpen(true)
  }

  // Confirmar aprovação
  const handleConfirmApproval = async () => {
    if (!selectedReceivable || !paymentMethod || !destinationAccount) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      
      // Importar a função de aprovação
      const { approveReceivable } = await import('@/lib/database/financial')
      
      await approveReceivable(selectedReceivable.id, {
        payment_method: paymentMethod,
        destination_account_id: destinationAccount,
        payment_date: paymentDate,
        due_date: paymentDate, // garantir que o vencimento seja salvo
        notes: notes
      })

      toast({
        title: "Sucesso!",
        description: "Recebível aprovado com sucesso!",
        variant: "default",
      })

      setApprovalDialogOpen(false)
      setSelectedReceivable(null)
      await loadData()
    } catch (error) {
      console.error('Erro ao aprovar recebível:', error)
      toast({
        title: "Erro",
        description: "Erro ao aprovar recebível.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Marcar recebível como recebido
  const handleMarkAsReceived = async (receivable: Receivable) => {
    try {
      setSaving(true)
      const today = new Date();
      const localDate = today.toLocaleDateString('en-CA'); // formato YYYY-MM-DD
      await markReceivableAsPaid(receivable.id, {
        payment_date: localDate,
        notes: `Recebido em ${today.toLocaleDateString('pt-BR')}`
      })

      toast({
        title: "Sucesso!",
        description: "Recebível marcado como recebido!",
        variant: "default",
      })

      await loadData()
    } catch (error) {
      console.error('Erro ao marcar como recebido:', error)
      toast({
        title: "Erro",
        description: "Erro ao marcar como recebido.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Funções para formulário de conta
  const handleNewAccount = () => {
    setSelectedAccount(null)
    setAccountFormOpen(true)
  }

  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account)
    setAccountFormOpen(true)
  }

  const handleSaveAccount = async (accountData: any) => {
    try {
      setSavingAccount(true)
      
      if (selectedAccount) {
        // Atualizar conta existente
        const updatedAccount = await updateAccount(selectedAccount.id, accountData)
        if (updatedAccount) {
          toast({
            title: "Sucesso!",
            description: "Conta atualizada com sucesso!",
            variant: "default",
          })
        } else {
          throw new Error('Erro ao atualizar conta')
        }
      } else {
        // Criar nova conta
        const newAccount = await createAccount(accountData)
        if (newAccount) {
          toast({
            title: "Sucesso!",
            description: "Conta criada com sucesso!",
            variant: "default",
          })
        } else {
          throw new Error('Erro ao criar conta')
        }
      }

      setAccountFormOpen(false)
      loadData()
    } catch (error) {
      console.error('Erro ao salvar conta:', error)
      toast({
        title: "Erro",
        description: "Erro ao salvar conta.",
        variant: "destructive",
      })
    } finally {
      setSavingAccount(false)
    }
  }

  // Funções para formulário de categoria
  const handleNewCategory = () => {
    setSelectedCategory(null)
    setCategoryFormOpen(true)
  }

  const handleEditCategory = (category: TransactionCategory) => {
    setSelectedCategory(category)
    setCategoryFormOpen(true)
  }

  const handleSaveCategory = async (categoryData: any) => {
    try {
      setSavingCategory(true)
      
      if (selectedCategory) {
        // Atualizar categoria existente
        const updatedCategory = await updateCategory(selectedCategory.id, categoryData)
        if (updatedCategory) {
          toast({
            title: "Sucesso!",
            description: "Categoria atualizada com sucesso!",
            variant: "default",
          })
        } else {
          throw new Error('Erro ao atualizar categoria')
        }
      } else {
        // Criar nova categoria
        const newCategory = await createCategory(categoryData)
        if (newCategory) {
          toast({
            title: "Sucesso!",
            description: "Categoria criada com sucesso!",
            variant: "default",
          })
        } else {
          throw new Error('Erro ao criar categoria')
        }
      }

      setCategoryFormOpen(false)
      loadData()
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
      toast({
        title: "Erro",
        description: "Erro ao salvar categoria.",
        variant: "destructive",
      })
    } finally {
      setSavingCategory(false)
    }
  }

  // Funções para editar e excluir transações/recebíveis (stubs)
  const handleEditTransaction = (item: FinancialTransaction | Receivable) => {
    // TODO: abrir modal de edição
    console.log('Editar', item);
  };
  const handleDeleteTransaction = (item: FinancialTransaction | Receivable) => {
    // TODO: abrir confirmação de exclusão
    console.log('Excluir', item);
  };

  const handleExpenseSubmit = (data: any) => {
    // TODO: integrar com backend
    console.log('Registro de gasto:', data);
    setExpenseModalOpen(false);
  };

  const handleIncomeSubmit = (data: any) => {
    // TODO: integrar com backend
    console.log('Registro de receita:', data);
    setIncomeModalOpen(false);
  };

  const handleTransferSubmit = (data: any) => {
    // TODO: integrar com backend
    console.log('Registro de transferência:', data);
    setTransferModalOpen(false);
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate">Financeiro</h1>
              <p className="text-sm text-text-secondary hidden sm:block">Gerencie recebíveis, transações e acompanhe o fluxo financeiro</p>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-4 sm:p-6 bg-background">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="aprovacao">Aprovação</TabsTrigger>
              <TabsTrigger value="transacoes">Transações</TabsTrigger>
              <TabsTrigger value="contas">Contas</TabsTrigger>
              <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
              <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
            </TabsList>

            {/* Dashboard */}
            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Recebíveis Pendentes
                    </CardTitle>
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(metrics.total_receivables_pending)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      aguardando aprovação
                    </p>
                  </CardContent>
                </Card>
                {/* Card Saldo em Contas permanece, os outros removidos */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Saldo em Contas
                    </CardTitle>
                    <Wallet className="h-4 w-4 text-indigo-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-indigo-600">
                      {formatCurrency(contas.reduce((sum, c) => sum + c.current_balance, 0))}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">total disponível</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {contas.map(conta => (
                        <li key={conta.id} className="flex justify-between">
                          <span>{conta.name}</span>
                          <span className={conta.current_balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(conta.current_balance)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Resumo de Receitas e Despesas
                    </CardTitle>
                    <CardDescription>
                      Visão geral do fluxo financeiro
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Receitas</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(metrics.total_revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Despesas</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(metrics.total_expenses)}
                      </span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Resultado Líquido</span>
                        <span className={`font-bold ${metrics.net_income >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(metrics.net_income)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      Recebíveis Vencidos
                    </CardTitle>
                    <CardDescription>
                      Acompanhe os valores em atraso
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600 mb-2">
                      {formatCurrency(metrics.total_receivables_overdue)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {metrics.total_receivables_overdue > 0 
                        ? "Há recebíveis vencidos que precisam de atenção"
                        : "Nenhum recebível vencido"
                      }
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Aprovação */}
            <TabsContent value="aprovacao" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Aprovação de Recebíveis
                  </CardTitle>
                  <CardDescription>
                    Aprove recebíveis pendentes e configure informações de pagamento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Resumo */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {recebiveis.length}
                        </div>
                        <div className="text-sm text-muted-foreground">Pendentes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(recebiveis.reduce((sum, r) => sum + r.amount, 0))}
                        </div>
                        <div className="text-sm text-muted-foreground">Valor Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatCurrency(recebiveis.reduce((sum, r) => sum + r.amount, 0) / Math.max(recebiveis.length, 1))}
                        </div>
                        <div className="text-sm text-muted-foreground">Ticket Médio</div>
                      </div>
                    </div>

                    {/* Busca */}
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 items-end mb-6">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Buscar por cliente ou descrição..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="flex items-center text-sm text-text-secondary col-span-1 sm:col-span-2 lg:col-span-1">
                        {filteredRecebiveis.length} recebível(s) encontrado(s)
                      </div>
                    </div>

                    {/* Tabela */}
                    <div className="rounded-md border">
                      <div className="overflow-x-auto">
                        <Table className="min-w-[800px]">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="font-semibold text-gray-900 bg-gray-50">Cliente</TableHead>
                              <TableHead className="font-semibold text-gray-900 bg-gray-50">Descrição</TableHead>
                              <TableHead className="font-semibold text-gray-900 bg-gray-50">Valor</TableHead>
                              <TableHead className="font-semibold text-gray-900 bg-gray-50">Status</TableHead>
                              <TableHead className="font-semibold text-right text-gray-900 bg-gray-50">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {loading ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                </TableCell>
                              </TableRow>
                            ) : filteredRecebiveis.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-text-secondary">
                                  {searchTerm
                                    ? "Nenhum recebível encontrado com os filtros aplicados."
                                    : "Nenhum recebível pendente encontrado."}
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredRecebiveis.map((recebivel) => (
                                <TableRow key={recebivel.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <User className="h-5 w-5" />
                                      </div>
                                      <div>
                                        <div className="font-medium text-foreground">{recebivel.client_name}</div>
                                        <div className="text-sm text-text-secondary">Recebível pendente</div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="max-w-xs truncate text-sm text-text-secondary">
                                      {recebivel.description}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium text-foreground">
                                      R$ {recebivel.amount.toFixed(2).replace(".", ",")}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Pendente
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleApprove(recebivel)}
                                        title="Aprovar Recebível"
                                        className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 text-white border-green-600"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Transações */}
            <TabsContent value="transacoes" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      Transações Financeiras
                    </CardTitle>
                    <CardDescription>
                      Acompanhe todas as movimentações financeiras
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setExpenseModalOpen(true)}>
                      Registrar Gasto
                    </Button>
                    <Button variant="secondary" onClick={() => setIncomeModalOpen(true)}>
                      Registrar Receita
                    </Button>
                    <Button variant="outline" onClick={() => setTransferModalOpen(true)}>
                      Registrar Transferência
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Filtros */}
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-end mb-6">
                      {/* Novo: Modo de visualização */}
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Visualização:</Label>
                        <Select value={viewMode} onValueChange={(v) => {
                          setViewMode(v);
                          if (v === 'mensal') {
                            setFilterDateFrom(firstDay.toLocaleDateString('en-CA'));
                            setFilterDateTo(lastDay.toLocaleDateString('en-CA'));
                          } else {
                            const todayStr = today.toLocaleDateString('en-CA');
                            setFilterDateFrom(todayStr);
                            setFilterDateTo(todayStr);
                          }
                        }}>
                          <SelectTrigger className="w-24 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="diario">Diário</SelectItem>
                            <SelectItem value="mensal">Mensal</SelectItem>
                          </SelectContent>
                        </Select>
                        {/* Botão de calendário para filtro personalizado */}
                        <Button variant="ghost" size="icon" className="h-8 w-8 ml-2" title="Filtrar período personalizado" onClick={() => setShowDatePicker(true)}>
                          <Calendar className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Buscar transações..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo de transação" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os tipos</SelectItem>
                          <SelectItem value="Receita">Receitas</SelectItem>
                          <SelectItem value="Despesa">Despesas</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={filterAccount} onValueChange={setFilterAccount}>
                        <SelectTrigger>
                          <SelectValue placeholder="Conta" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as contas</SelectItem>
                          {contas.map((conta) => (
                            <SelectItem key={conta.id} value={conta.id}>
                              {conta.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex items-center text-sm text-text-secondary">
                        {filteredTransacoes.length} transação(ões) encontrada(s)
                      </div>
                    </div>

                    {/* Tabela */}
                    <div className="rounded-md border">
                      <div className="overflow-x-auto">
                        <Table className="min-w-[800px]">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="font-semibold text-gray-900 bg-gray-50">Data</TableHead>
                              <TableHead className="font-semibold text-gray-900 bg-gray-50">Categoria</TableHead>
                              <TableHead className="font-semibold text-gray-900 bg-gray-50">Descrição</TableHead>
                              <TableHead className="font-semibold text-gray-900 bg-gray-50">Tipo</TableHead>
                              <TableHead className="font-semibold text-right text-gray-900 bg-gray-50">Valor</TableHead>
                              <TableHead className="font-semibold text-gray-900 bg-gray-50">Status</TableHead>
                              <TableHead className="font-semibold text-right text-gray-900 bg-gray-50">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {loading ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                </TableCell>
                              </TableRow>
                            ) : filteredTransacoes.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-text-secondary">
                                  {searchTerm
                                    ? "Nenhuma transação encontrada com os filtros aplicados."
                                    : "Nenhuma transação registrada ainda."}
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredTransacoes.map((item) => {
                                const isTransaction = 'transaction_type' in item;
                                const isReceivable = 'due_date' in item;
                                
                                if (isTransaction) {
                                  const transacao = item as FinancialTransaction;
                                  return (
                                    <TableRow key={transacao.id}>
                                      {/* Data */}
                                      <TableCell>
                                        <div className="flex items-center gap-1 text-sm">
                                          <Calendar className="h-3 w-3 text-text-secondary" />
                                          <span className="text-text-secondary">{formatDate(transacao.due_date || transacao.transaction_date)}</span>
                                        </div>
                                      </TableCell>
                                      {/* Categoria */}
                                      <TableCell>
                                        <div className="text-sm text-text-secondary truncate max-w-[120px] text-ellipsis">
                                          {transacao.category?.name || 'Sem categoria'}
                                        </div>
                                      </TableCell>
                                      {/* Descrição */}
                                      <TableCell>
                                        <div className="max-w-xs truncate text-sm text-text-secondary">
                                          {transacao.description}
                                        </div>
                                      </TableCell>
                                      {/* Tipo */}
                                      <TableCell>
                                        <Badge 
                                          variant={transacao.transaction_type === 'Receita' ? 'default' : 'secondary'}
                                          className={transacao.transaction_type === 'Receita' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                          }
                                        >
                                          {transacao.transaction_type === 'Receita' ? (
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                          ) : (
                                            <TrendingDown className="h-3 w-3 mr-1" />
                                          )}
                                          {transacao.transaction_type}
                                        </Badge>
                                      </TableCell>
                                      {/* Valor */}
                                      <TableCell className="text-right">
                                        <div className={`font-medium ${
                                          transacao.transaction_type === 'Receita' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                          {transacao.transaction_type === 'Receita' ? '+' : '-'}
                                          R$ {transacao.amount.toFixed(2).replace(".", ",")}
                                        </div>
                                      </TableCell>
                                      {/* Status */}
                                      <TableCell>
                                        {transacao.transaction_type === 'Receita' ? (
                                          <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                                            Recebido
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                                            Pago
                                          </Badge>
                                        )}
                                      </TableCell>
                                      {/* Ações */}
                                      <TableCell className="text-right">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                              <MoreVertical className="h-5 w-5" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEditTransaction(transacao)}>
                                              <Edit className="h-4 w-4 mr-2" /> Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDeleteTransaction(transacao)} className="text-red-600">
                                              <Trash2 className="h-4 w-4 mr-2" /> Excluir lançamento
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </TableCell>
                                    </TableRow>
                                  );
                                } else if (isReceivable) {
                                  const recebivel = item as Receivable;
                                  return (
                                    <TableRow key={recebivel.id}>
                                      {/* Data */}
                                      <TableCell>
                                        <div className="flex items-center gap-1 text-sm">
                                          <Calendar className="h-3 w-3 text-text-secondary" />
                                          <span className="text-text-secondary">{formatDate(recebivel.due_date)}</span>
                                        </div>
                                      </TableCell>
                                      {/* Categoria */}
                                      <TableCell>
                                        <div className="text-sm text-text-secondary truncate max-w-[120px] text-ellipsis">
                                          Receita de Locação
                                        </div>
                                      </TableCell>
                                      {/* Descrição */}
                                      <TableCell>
                                        <div className="max-w-xs truncate text-sm text-text-secondary">
                                          {recebivel.description} - {recebivel.client_name}
                                        </div>
                                      </TableCell>
                                      {/* Tipo */}
                                      <TableCell>
                                        <Badge variant="default" className="bg-green-100 text-green-800">
                                          <TrendingUp className="h-3 w-3 mr-1" />
                                          Receita
                                        </Badge>
                                      </TableCell>
                                      {/* Valor */}
                                      <TableCell className="text-right">
                                        <div className="font-medium text-yellow-600">
                                          R$ {recebivel.amount.toFixed(2).replace(".", ",")}
                                        </div>
                                      </TableCell>
                                      {/* Status */}
                                      <TableCell>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleMarkAsReceived(recebivel)}
                                          title="Marcar como Recebido"
                                          className="h-8 w-auto px-2 bg-green-600 hover:bg-green-700 text-white border-green-600 flex items-center gap-1"
                                        >
                                          <CheckCircle className="h-4 w-4" /> Receber
                                        </Button>
                                      </TableCell>
                                      {/* Ações */}
                                      <TableCell className="text-right">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                              <MoreVertical className="h-5 w-5" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEditTransaction(recebivel)}>
                                              <Edit className="h-4 w-4 mr-2" /> Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDeleteTransaction(recebivel)} className="text-red-600">
                                              <Trash2 className="h-4 w-4 mr-2" /> Excluir lançamento
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </TableCell>
                                    </TableRow>
                                  );
                                }
                                return null;
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contas */}
            <TabsContent value="contas" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-primary" />
                        Contas Bancárias e Caixa
                      </CardTitle>
                      <CardDescription>
                        Gerencie suas contas bancárias e caixa
                      </CardDescription>
                    </div>
                    <Button onClick={handleNewAccount}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Conta
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Busca */}
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 items-end mb-6">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Buscar contas..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="flex items-center text-sm text-text-secondary col-span-1 sm:col-span-2 lg:col-span-1">
                        {filteredContas.length} conta(s) encontrada(s)
                      </div>
                    </div>
                    {/* Tabela */}
                    <div className="rounded-md border">
                      <div className="overflow-x-auto">
                        <Table className="min-w-[800px]">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="font-semibold text-gray-900 bg-gray-50">Conta</TableHead>
                              <TableHead className="font-semibold text-gray-900 bg-gray-50">Tipo</TableHead>
                              <TableHead className="font-semibold text-gray-900 bg-gray-50">Banco</TableHead>
                              <TableHead className="font-semibold text-gray-900 bg-gray-50">Saldo</TableHead>
                              <TableHead className="font-semibold text-right text-gray-900 bg-gray-50">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {loading ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                </TableCell>
                              </TableRow>
                            ) : filteredContas.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-text-secondary">
                                  {searchTerm
                                    ? "Nenhuma conta encontrada com os filtros aplicados."
                                    : "Nenhuma conta cadastrada ainda."}
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredContas.map((conta) => (
                                <TableRow key={conta.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                                        <Wallet className="h-5 w-5" />
                                      </div>
                                      <div>
                                        <div className="font-medium text-foreground">{conta.name}</div>
                                        <div className="text-sm text-text-secondary">{conta.account_type}</div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                      {conta.account_type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm text-text-secondary">
                                      {conta.bank_name || '-'}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className={`font-medium ${
                                      conta.current_balance >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      R$ {conta.current_balance.toFixed(2).replace('.', ',')}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        title="Editar Conta"
                                        className="h-8 w-8 p-0"
                                        onClick={() => handleEditAccount(conta)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Relatórios */}
            <TabsContent value="relatorios" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    DRE (Demonstrativo de Resultados)
                  </CardTitle>
                  <CardDescription>
                    Veja o resultado financeiro do mês corrente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table className="min-w-[400px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-semibold text-gray-900 bg-gray-50">Descrição</TableHead>
                          <TableHead className="font-semibold text-right text-gray-900 bg-gray-50">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Receita Bruta</TableCell>
                          <TableCell className="text-right text-green-600 font-semibold">{formatCurrency(transactionTotals.revenue)}</TableCell>
                        </TableRow>
                        {/* Detalhamento de Receitas por categoria */}
                        {(() => {
                          const receitas = filteredTransacoes.filter(t => 'transaction_type' in t && t.transaction_type === 'Receita' && 'category' in t);
                          const agrupado: Record<string, { total: number, descricoes: string[] }> = {};
                          receitas.forEach((t: any) => {
                            const cat = t.category?.name || 'Sem categoria';
                            if (!agrupado[cat]) agrupado[cat] = { total: 0, descricoes: [] };
                            agrupado[cat].total += t.amount;
                            agrupado[cat].descricoes.push(t.description);
                          });
                          return Object.entries(agrupado).map(([cat, { total, descricoes }]) => (
                            <TableRow key={cat}>
                              <TableCell className="pl-8 text-sm text-green-700">
                                {cat}
                                <ul className="text-xs text-muted-foreground mt-1 list-disc ml-4">
                                  {descricoes.map((desc, i) => <li key={i}>{desc}</li>)}
                                </ul>
                              </TableCell>
                              <TableCell className="text-right text-green-700">{formatCurrency(total)}</TableCell>
                            </TableRow>
                          ));
                        })()}
                        <TableRow>
                          <TableCell>Despesas</TableCell>
                          <TableCell className="text-right text-red-600 font-semibold">- {formatCurrency(transactionTotals.expenses)}</TableCell>
                        </TableRow>
                        {/* Detalhamento de Despesas por categoria */}
                        {(() => {
                          const despesas = filteredTransacoes.filter(t => 'transaction_type' in t && t.transaction_type === 'Despesa' && 'category' in t);
                          const agrupado: Record<string, { total: number, descricoes: string[] }> = {};
                          despesas.forEach((t: any) => {
                            const cat = t.category?.name || 'Sem categoria';
                            if (!agrupado[cat]) agrupado[cat] = { total: 0, descricoes: [] };
                            agrupado[cat].total += t.amount;
                            agrupado[cat].descricoes.push(t.description);
                          });
                          return Object.entries(agrupado).map(([cat, { total, descricoes }]) => (
                            <TableRow key={cat}>
                              <TableCell className="pl-8 text-sm text-red-700">
                                {cat}
                                <ul className="text-xs text-muted-foreground mt-1 list-disc ml-4">
                                  {descricoes.map((desc, i) => <li key={i}>{desc}</li>)}
                                </ul>
                              </TableCell>
                              <TableCell className="text-right text-red-700">- {formatCurrency(total)}</TableCell>
                            </TableRow>
                          ));
                        })()}
                        <TableRow>
                          <TableCell className="font-bold">Resultado Líquido</TableCell>
                          <TableCell className={`text-right font-bold ${transactionTotals.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(transactionTotals.net)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Configurações */}
            <TabsContent value="configuracoes" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Categorias de Transações
                      </CardTitle>
                      <CardDescription>
                        Gerencie as categorias para organizar suas transações financeiras
                      </CardDescription>
                    </div>
                    <Button onClick={handleNewCategory}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Categoria
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Busca */}
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 items-end mb-6">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Buscar categorias..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="flex items-center text-sm text-text-secondary col-span-1 sm:col-span-2 lg:col-span-1">
                        {categorias.filter(cat => 
                          cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
                        ).length} categoria(s) encontrada(s)
                      </div>
                    </div>

                    {/* Tabela */}
                    <div className="rounded-md border">
                      <div className="overflow-x-auto">
                        <Table className="min-w-[800px]">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="font-semibold text-gray-900 bg-gray-50">Categoria</TableHead>
                              <TableHead className="font-semibold text-gray-900 bg-gray-50">Tipo</TableHead>
                              <TableHead className="font-semibold text-gray-900 bg-gray-50">Descrição</TableHead>
                              <TableHead className="font-semibold text-gray-900 bg-gray-50">Status</TableHead>
                              <TableHead className="font-semibold text-right text-gray-900 bg-gray-50">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {loading ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                </TableCell>
                              </TableRow>
                            ) : categorias.filter(cat => 
                              cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
                            ).length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-text-secondary">
                                  {searchTerm
                                    ? "Nenhuma categoria encontrada com os filtros aplicados."
                                    : "Nenhuma categoria cadastrada ainda."}
                                </TableCell>
                              </TableRow>
                            ) : (
                              categorias
                                .filter(cat => 
                                  cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map((categoria) => (
                                <TableRow key={categoria.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                                        categoria.transaction_type === 'Receita' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                      }`}>
                                        {categoria.transaction_type === 'Receita' ? (
                                          <TrendingUp className="h-5 w-5" />
                                        ) : (
                                          <TrendingDown className="h-5 w-5" />
                                        )}
                                      </div>
                                      <div>
                                        <div className="font-medium text-foreground">{categoria.name}</div>
                                        <div className="text-sm text-text-secondary">{categoria.transaction_type}</div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant="outline" 
                                      className={categoria.transaction_type === 'Receita' ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'}
                                    >
                                      {categoria.transaction_type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm text-text-secondary max-w-xs truncate">
                                      {categoria.description || '-'}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant={categoria.is_active ? "default" : "secondary"}
                                      className={categoria.is_active 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-gray-100 text-gray-800'
                                      }
                                    >
                                      {categoria.is_active ? 'Ativa' : 'Inativa'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        title="Editar Categoria"
                                        className="h-8 w-8 p-0"
                                        onClick={() => handleEditCategory(categoria)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Modal de Aprovação */}
          <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Aprovar Recebível</DialogTitle>
                <DialogDescription>
                  Configure as informações de pagamento para este recebível
                </DialogDescription>
              </DialogHeader>
              
              {selectedReceivable && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Cliente</Label>
                      <div className="text-sm font-medium">{selectedReceivable.client_name}</div>
                    </div>
                    <div>
                      <Label>Valor</Label>
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(selectedReceivable.amount)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="payment-method">Forma de Pagamento *</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a forma de pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PIX">PIX</SelectItem>
                        <SelectItem value="Boleto">Boleto</SelectItem>
                        <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                        <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                        <SelectItem value="Transferência Bancária">Transferência Bancária</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="destination-account">Conta de Destino *</Label>
                    <Select value={destinationAccount} onValueChange={setDestinationAccount}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a conta" />
                      </SelectTrigger>
                      <SelectContent>
                        {contas.map((conta) => (
                          <SelectItem key={conta.id} value={conta.id}>
                            {conta.name} - {conta.account_type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="payment-date">Data do Pagamento</Label>
                    <Input
                      id="payment-date"
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Input
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Observações sobre o pagamento..."
                    />
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleConfirmApproval} 
                  disabled={saving || !paymentMethod || !destinationAccount}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Aprovar Recebível
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal de Formulário de Conta */}
          <AccountForm
            open={accountFormOpen}
            onOpenChange={setAccountFormOpen}
            account={selectedAccount || undefined}
            onSave={handleSaveAccount}
            saving={savingAccount}
          />

          {/* Modal de Formulário de Categoria */}
          <CategoryForm
            open={categoryFormOpen}
            onOpenChange={setCategoryFormOpen}
            category={selectedCategory || undefined}
            onSave={handleSaveCategory}
            saving={savingCategory}
          />

          {/* Date range picker placeholder/modal */}
          {showDatePicker && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <h4 className="mb-2 font-medium">Selecione o período</h4>
                {/* Aqui você pode integrar um date range picker real */}
                <div className="flex gap-2 mb-4">
                  <Input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
                  <span className="self-center">até</span>
                  <Input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowDatePicker(false)}>Cancelar</Button>
                  <Button onClick={() => { setShowDatePicker(false); loadData(); }}>Aplicar</Button>
                </div>
              </div>
            </div>
          )}

          {/* Expense Modal */}
          <ExpenseModal
            open={expenseModalOpen}
            onClose={() => setExpenseModalOpen(false)}
            onSubmit={handleExpenseSubmit}
            contas={contas.map(c => ({ id: c.id, name: c.name }))}
            categorias={categorias.map(c => ({ id: c.id, name: c.name }))}
          />

          {/* Income Modal */}
          <IncomeModal
            open={incomeModalOpen}
            onClose={() => setIncomeModalOpen(false)}
            onSubmit={handleIncomeSubmit}
            contas={contas.map(c => ({ id: c.id, name: c.name }))}
            categorias={categorias.map(c => ({ id: c.id, name: c.name }))}
          />

          {/* Transfer Modal */}
          <TransferModal
            open={transferModalOpen}
            onClose={() => setTransferModalOpen(false)}
            onSubmit={handleTransferSubmit}
            contas={contas.map(c => ({ id: c.id, name: c.name }))}
          />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
} 