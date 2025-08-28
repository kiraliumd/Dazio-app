'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { BudgetFormV2 } from '@/components/budget-form-v2';
import { PageHeader } from '@/components/page-header';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useBudgets } from '@/lib/hooks/use-optimized-data';
import type { Budget } from '@/lib/utils/data-transformers';
import { transformBudgetFromDB } from '@/lib/utils/data-transformers';
import {
    Calendar,
    CheckCircle,
    Download,
    Edit,
    Eye,
    FileText,
    Plus,
    Repeat,
    Search,
    Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    Suspense,
    lazy,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';

import { Toaster } from '../../../components/ui/toaster';
import { useToast } from '../../../hooks/use-toast';
import { usePDFGenerator } from '../../../hooks/usePDFGenerator';
import {
    createBudget,
    deleteBudget,
    generateBudgetNumber,
    getBudgets,
    updateBudget,
} from '../../../lib/database/budgets';
import { createRental } from '../../../lib/database/rentals';
import { getCompanySettings } from '../../../lib/database/settings';

// Lazy load do modal pesado
const LogisticsConfirmationModal = lazy(() =>
  import('../../../components/logistics-confirmation-modal').then(module => ({
    default: module.LogisticsConfirmationModal,
  }))
);

// Lazy load do modal de visualização do orçamento
const BudgetViewModal = lazy(() =>
  import('../../../components/budget-view-modal').then(module => ({
    default: module.BudgetViewModal,
  }))
);

// Hook para debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Skeleton para lazy components
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="space-y-2 w-full max-w-sm">
      <div className="h-4 w-1/2 bg-gray-200 rounded" />
      <div className="h-3 w-2/3 bg-gray-100 rounded" />
    </div>
  </div>
);

export default function BudgetsPage() {
  // Estados para dados
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [periodFilter, setPeriodFilter] = useState('7d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>(
    undefined
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);
  const [logisticsModalOpen, setLogisticsModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [viewBudgetModalOpen, setViewBudgetModalOpen] = useState(false);
  
  // ✅ NOVO: Estados para modal de conflitos de agenda
  const [conflictsModalOpen, setConflictsModalOpen] = useState(false);
  const [conflictsData, setConflictsData] = useState<any[]>([]);
  const [conflictsModalTitle, setConflictsModalTitle] = useState('');
  const [conflictsModalType, setConflictsModalType] = useState<'create' | 'approve'>('create');
  const [pendingBudgetData, setPendingBudgetData] = useState<any>(null);
  const [pendingLogisticsData, setPendingLogisticsData] = useState<any>(null);

  // Constantes
  const ITEMS_PER_PAGE = 10;

  // Debounce do termo de busca
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Usar hooks otimizados para dados
  const {
    data: dbBudgets,
    loading: budgetsLoading,
    error: budgetsError,
    refresh: refreshBudgets,
  } = useBudgets(50, startDate, endDate);

  // Hook para geração de PDF
  const { generateBudgetPDF, isGenerating } = usePDFGenerator();

  // Hook para toast
  const { toast } = useToast();

  const router = useRouter();

  // Funções para calcular períodos
  const getCurrentMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  const getLastMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getMonth(), 0);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  const getPeriodRange = () => {
    switch (periodFilter) {
      case 'current_month':
        return getCurrentMonthRange();
      case 'last_month':
        return getLastMonthRange();
      case 'custom':
        return { start: startDate, end: endDate };
      case 'all':
        return { start: '', end: '' };
      default:
        return getCurrentMonthRange();
    }
  };

  const getPeriodDisplayText = () => {
    switch (periodFilter) {
      case 'current_month':
        const currentRange = getCurrentMonthRange();
        return `${new Date(currentRange.start).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;
      case 'last_month':
        const lastRange = getLastMonthRange();
        return `${new Date(lastRange.start).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;
      case 'custom':
        if (startDate && endDate) {
          return `${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`;
        }
        return 'Período customizado';
      case 'all':
        return 'Todos os períodos';
      default:
        return 'Mês atual';
    }
  };

  // Memoização dos filtros aplicados
  const filteredBudgets = useMemo(() => {
    if (budgets.length === 0) return [];

    let filtered = budgets;

    // Filtrar por termo de busca
    if (debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (budget: Budget) =>
          budget.number.toLowerCase().includes(searchLower) ||
          budget.clientName.toLowerCase().includes(searchLower) ||
          budget.status.toLowerCase().includes(searchLower)
      );
    }

    // Filtrar por status
    if (statusFilter !== 'Todos') {
      filtered = filtered.filter(
        (budget: Budget) => budget.status === statusFilter
      );
    }

    // Ordenar: Pendentes primeiro, depois Aprovados
    filtered.sort((a: Budget, b: Budget) => {
      if (a.status === 'Pendente' && b.status !== 'Pendente') return -1;
      if (a.status !== 'Pendente' && b.status === 'Pendente') return 1;
      if (a.status === 'Aprovado' && b.status !== 'Aprovado') return -1;
      if (a.status !== 'Aprovado' && b.status === 'Aprovado') return 1;
      return 0;
    });

    return filtered;
  }, [budgets, debouncedSearchTerm, statusFilter]);

  // Memoização da paginação
  const paginatedBudgets = useMemo(() => {
    return filteredBudgets.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredBudgets, currentPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredBudgets.length / ITEMS_PER_PAGE);
  }, [filteredBudgets.length]);

  // Atualizar estados locais quando dados são carregados
  useEffect(() => {
    if (dbBudgets && Array.isArray(dbBudgets)) {
      const transformedBudgets = dbBudgets.map(transformBudgetFromDB);
      setBudgets(transformedBudgets);
    }
  }, [dbBudgets]);

  // Calcular loading geral
  useEffect(() => {
    setLoading(budgetsLoading);
  }, [budgetsLoading]);

  // Tratar erros
  useEffect(() => {
    if (budgetsError) {
      console.error('Erro ao carregar orçamentos:', budgetsError);
      // Remover alert para melhor UX
    }
  }, [budgetsError]);

  // Carregar dados apenas uma vez na montagem
  useEffect(() => {
    console.log('📦 Orçamentos: Dados sendo carregados pelos hooks otimizados');
  }, []);

  // Reset da página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter, periodFilter, startDate, endDate]);

  // Recarregar dados quando filtros de período mudarem - com debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refreshBudgets();
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [periodFilter, startDate, endDate, refreshBudgets]);

  const loadBudgets = async () => {
    try {
      setLoading(true);

      // Obter o período selecionado
      const periodRange = getPeriodRange();

      // Carregar orçamentos com filtro de período
      const dbBudgets = await getBudgets(
        50,
        periodRange.start,
        periodRange.end
      );
      const transformedBudgets = dbBudgets.map(transformBudgetFromDB);
      setBudgets(transformedBudgets);
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
      alert('Erro ao carregar orçamentos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleStatusFilter = useCallback((value: string) => {
    setStatusFilter(value);
  }, []);

  const handlePeriodFilter = useCallback((value: string) => {
    setPeriodFilter(value);

    // Limpar datas customizadas quando não for período customizado
    if (value !== 'custom') {
      setStartDate('');
      setEndDate('');
    }
  }, []);

  const handleSaveBudget = async (
    budgetData: Omit<Budget, 'id' | 'number' | 'createdAt'> & { id?: string }
  ) => {
    try {
      // ✅ NOVA FUNCIONALIDADE: Verificar conflitos de agenda antes de salvar
      if (!budgetData.id) { // Só verificar conflitos para novos orçamentos
        const { checkAgendaConflicts } = await import('../../../lib/database/equipments');
        
        // Verificar conflitos para cada item do orçamento
        const conflicts: any[] = [];
        
        for (const item of budgetData.items || []) {
          const itemConflicts = await checkAgendaConflicts(
            item.equipmentName,
            budgetData.startDate,
            budgetData.endDate,
            undefined, // excludeRentalId
            item.quantity // requestedQuantity
          );
          
          if (itemConflicts.hasConflicts) {
            conflicts.push({
              equipment: item.equipmentName,
              requestedQuantity: item.quantity,
              conflicts: itemConflicts.conflicts,
              totalConflictingQuantity: itemConflicts.totalConflictingQuantity
            });
          }
        }

        // Se há conflitos, mostrar modal de conflitos
        if (conflicts.length > 0) {
          try {
            // ✅ NOVO: Usar modal em vez de window.confirm
            setConflictsData(conflicts);
            setConflictsModalTitle('🚨 Conflitos de Agenda Detectados');
            setConflictsModalType('create');
            setPendingBudgetData(budgetData);
            setConflictsModalOpen(true);
            return; // Pausar aqui até o usuário decidir no modal
          } catch (error) {
            console.error('Erro ao processar conflitos:', error);
            // Se houver erro ao processar conflitos, continuar mesmo assim
            console.warn('Continuando com a criação do orçamento mesmo com erro na verificação de conflitos');
          }
        }
      }

      let budgetNumber = '';

      if (budgetData.id) {
        // Editando orçamento existente
        budgetNumber =
          budgets.find((b: Budget) => b.id === budgetData.id)?.number || '';
      } else {
        // Criando novo orçamento
        budgetNumber = await generateBudgetNumber();
      }

      // ✅ CORREÇÃO: Criar objeto base sem createdAt para edição
      const baseBudgetData = {
        number: budgetNumber,
        clientId: budgetData.clientId,
        clientName: budgetData.clientName,
        startDate: budgetData.startDate,
        endDate: budgetData.endDate,
        installationTime: undefined,
        removalTime: undefined,
        installationLocation: budgetData.installationLocation || '',
        items: [],
        subtotal: budgetData.subtotal,
        discount: budgetData.discount,
        totalValue: budgetData.totalValue,
        status: budgetData.status,
        observations: budgetData.observations || '',
        // Campos de recorrência - CORRIGIDO: só definir quando realmente for recorrente
        isRecurring: Boolean(budgetData.isRecurring),
        recurrenceType: budgetData.isRecurring
          ? (budgetData.recurrenceType as 'weekly' | 'monthly' | 'yearly') ||
            'weekly'
          : undefined, // ← CORRIGIDO: undefined quando não é recorrente
        recurrenceInterval: budgetData.isRecurring
          ? budgetData.recurrenceInterval || 1
          : undefined, // ← CORRIGIDO: undefined quando não é recorrente
        recurrenceEndDate: budgetData.isRecurring
          ? budgetData.recurrenceEndDate || undefined
          : undefined, // ← CORRIGIDO: undefined quando não é recorrente
      };

      const items = (budgetData.items || []).map(
        (item: {
          equipmentName: string;
          quantity: number;
          dailyRate: number;
          days: number;
          total: number;
        }) => ({
          equipmentName: item.equipmentName,
          quantity: item.quantity,
          dailyRate: item.dailyRate,
          days: item.days,
          total: item.total,
        })
      );

      if (budgetData.id) {
        // ✅ CORREÇÃO: Para edição, não incluir createdAt
        await updateBudget(budgetData.id, baseBudgetData, items);
      } else {
        // ✅ CORREÇÃO: Para criação, incluir createdAt obrigatoriamente
        const createBudgetData = { ...baseBudgetData, createdAt: new Date().toISOString() };
        await createBudget(createBudgetData, items);
      }

      await refreshBudgets();
      // Não definir editingBudget como undefined aqui, deixar o modal fechar naturalmente
    } catch (error: unknown) {
      console.error('Erro ao salvar orçamento:', error);
      const errorMessage =
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof error.message === 'string'
          ? error.message
          : 'Erro ao salvar orçamento. Tente novamente.';
      alert(errorMessage);
    }
  };

  const handleEditBudget = useCallback((budget: Budget) => {
    // Impedir edição de orçamentos aprovados
    if (budget.status === 'Aprovado') {
      alert(
        'Orçamentos aprovados não podem ser editados. Para fazer alterações, crie um novo orçamento.'
      );
      return;
    }
    setEditingBudget(budget);
    setIsFormOpen(true);
  }, []);

  const handleDeleteBudget = useCallback(
    (id: string) => {
      // ✅ CORREÇÃO: Permitir exclusão de orçamentos aprovados
      setBudgetToDelete(id);
      setDeleteDialogOpen(true);
    },
    [budgets]
  );

  // Abre o modal de confirmação de logística
  const handleApproveBudget = useCallback((budget: Budget) => {
    setSelectedBudget(budget);
    setLogisticsModalOpen(true);
  }, []);

  // ✅ NOVA FUNÇÃO: Continuar salvando orçamento após verificar conflitos
  const handleSaveBudgetContinue = async (budgetData: any) => {
    try {
      let budgetNumber = '';

      if (budgetData.id) {
        // Editando orçamento existente
        budgetNumber =
          budgets.find((b: Budget) => b.id === budgetData.id)?.number || '';
      } else {
        // Criando novo orçamento
        budgetNumber = await generateBudgetNumber();
      }

      // ✅ CORREÇÃO: Criar objeto base sem createdAt para edição
      const baseBudgetData = {
        number: budgetNumber,
        clientId: budgetData.clientId,
        clientName: budgetData.clientName,
        startDate: budgetData.startDate,
        endDate: budgetData.endDate,
        installationTime: undefined,
        removalTime: undefined,
        installationLocation: budgetData.installationLocation || '',
        items: [],
        subtotal: budgetData.subtotal,
        discount: budgetData.discount,
        totalValue: budgetData.totalValue,
        status: budgetData.status,
        observations: budgetData.observations || '',
        // Campos de recorrência - CORRIGIDO: só definir quando realmente for recorrente
        isRecurring: Boolean(budgetData.isRecurring),
        recurrenceType: budgetData.isRecurring
          ? (budgetData.recurrenceType as 'weekly' | 'monthly' | 'yearly') ||
            'weekly'
          : undefined, // ← CORRIGIDO: undefined quando não é recorrente
        recurrenceInterval: budgetData.isRecurring
          ? budgetData.recurrenceInterval || 1
          : undefined, // ← CORRIGIDO: undefined quando não é recorrente
        recurrenceEndDate: budgetData.isRecurring
          ? budgetData.recurrenceEndDate || undefined
          : undefined, // ← CORRIGIDO: undefined quando não é recorrente
      };

      const items = (budgetData.items || []).map(
        (item: {
          equipmentName: string;
          quantity: number;
          dailyRate: number;
          days: number;
          total: number;
        }) => ({
          equipmentName: item.equipmentName,
          quantity: item.quantity,
          dailyRate: item.dailyRate,
          days: item.days,
          total: item.total,
        })
      );

      if (budgetData.id) {
        // ✅ CORREÇÃO: Para edição, não incluir createdAt
        await updateBudget(budgetData.id, baseBudgetData, items);
      } else {
        // ✅ CORREÇÃO: Para criação, incluir createdAt obrigatoriamente
        const createBudgetData = { ...baseBudgetData, createdAt: new Date().toISOString() };
        await createBudget(createBudgetData, items);
      }

      await refreshBudgets();
      
      // Limpar dados pendentes
      setPendingBudgetData(null);
      setConflictsModalOpen(false);
      
      toast({
        title: 'Sucesso!',
        description: 'Orçamento salvo com sucesso!',
        variant: 'default',
      });
    } catch (error: unknown) {
      console.error('Erro ao salvar orçamento:', error);
      const errorMessage =
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof error.message === 'string'
          ? error.message
          : 'Erro ao salvar orçamento. Tente novamente.';
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // ✅ NOVA FUNÇÃO: Continuar aprovação após verificar conflitos
  const handleConfirmApprovalContinue = async (logisticsData: any) => {
    if (!selectedBudget) return;

    try {
      // ✅ CORREÇÃO: Usar toLocaleTimeString em vez de format do date-fns
      const formatTime = (date: Date) => date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      // 1. Criar contrato de locação com os dados de logística
      const rentalData = {
        client_id: selectedBudget.clientId,
        client_name: selectedBudget.clientName,
        start_date: selectedBudget.startDate,
        end_date: selectedBudget.endDate,
        installation_time: formatTime(logisticsData.installation),
        removal_time: formatTime(logisticsData.removal),
        installation_location: selectedBudget.installationLocation || null,
        total_value: selectedBudget.subtotal, // ✅ CORREÇÃO: Usar subtotal (sem desconto)
        discount: selectedBudget.discount,
        final_value: selectedBudget.totalValue, // ✅ CORREÇÃO: Usar totalValue (já com desconto aplicado)
        status: 'Instalação Pendente' as const,
        observations: selectedBudget.observations || '',
        budget_id: selectedBudget.id,
        // Campos de recorrência
        is_recurring: Boolean(selectedBudget.isRecurring),
        recurrence_type: selectedBudget.isRecurring
          ? selectedBudget.recurrenceType || 'weekly'
          : 'weekly',
        recurrence_interval: selectedBudget.isRecurring
          ? selectedBudget.recurrenceInterval || 1
          : 1,
        recurrence_end_date: selectedBudget.isRecurring
          ? selectedBudget.recurrenceEndDate || null
          : null,
        recurrence_status: 'active' as const,
        parent_rental_id: null,
        next_occurrence_date: null,
      };

      // Verificar se há itens antes de tentar acessá-los
      const budgetItems = selectedBudget?.items || [];
      const totalItems = budgetItems.length;
      const totalValue = budgetItems.reduce((sum, item) => sum + item.total, 0);

      const rentalItems = (selectedBudget?.items || []).map(
        (item: {
          equipmentName: string;
          quantity: number;
          dailyRate: number;
          days: number;
          total: number;
        }) => ({
          equipment_name: item.equipmentName,
          quantity: item.quantity,
          daily_rate: item.dailyRate,
          days: item.days,
          total: item.total,
        })
      );

      // 2. Criar a locação
      await createRental(rentalData, rentalItems, logisticsData);

      // 3. Atualizar o status do orçamento para "Aprovado"
      await updateBudget(selectedBudget.id, { status: 'Aprovado' });

      // 4. Recarregar os orçamentos
      await refreshBudgets();

      // 5. Fechar o modal
      setLogisticsModalOpen(false);
      setSelectedBudget(null);
      setPendingLogisticsData(null);
      setConflictsModalOpen(false);

      // 6. Navegar para a página apropriada baseada no tipo de recorrência
      if (selectedBudget.recurrenceType) {
        window.location.href = '/locacoes-recorrentes';
      } else {
        window.location.href = '/locacoes';
      }
    } catch (error) {
      console.error('Erro ao aprovar orçamento:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao aprovar orçamento. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleConfirmApproval = async (logisticsData: {
    installation: Date;
    removal: Date;
  }) => {
    if (!selectedBudget) return;

    try {
      // ✅ NOVA FUNCIONALIDADE: Verificar conflitos de agenda antes de aprovar
      const { checkAgendaConflicts } = await import('../../../lib/database/equipments');
      
      // Verificar conflitos para cada item do orçamento
      const conflicts: any[] = [];
      
              for (const item of selectedBudget.items || []) {
          const itemConflicts = await checkAgendaConflicts(
            item.equipmentName,
            selectedBudget.startDate,
            selectedBudget.endDate,
            undefined, // excludeRentalId
            item.quantity // requestedQuantity
          );
        
        if (itemConflicts.hasConflicts) {
          conflicts.push({
            equipment: item.equipmentName,
            requestedQuantity: item.quantity,
            conflicts: itemConflicts.conflicts,
            totalConflictingQuantity: itemConflicts.totalConflictingQuantity
          });
        }
      }

              // Se há conflitos, mostrar modal de conflitos
        if (conflicts.length > 0) {
          try {
            // ✅ NOVO: Usar modal em vez de window.confirm
            setConflictsData(conflicts);
            setConflictsModalTitle('🚨 Conflitos de Agenda Detectados na Aprovação');
            setConflictsModalType('approve');
            setPendingLogisticsData(logisticsData);
            setConflictsModalOpen(true);
            return; // Pausar aqui até o usuário decidir no modal
          } catch (error) {
            console.error('Erro ao processar conflitos:', error);
            // Se houver erro ao processar conflitos, continuar mesmo assim
            console.warn('Continuando com a aprovação do orçamento mesmo com erro na verificação de conflitos');
          }
        }

      // ✅ CORREÇÃO: Usar toLocaleTimeString em vez de format do date-fns
      const formatTime = (date: Date) => date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      // 1. Criar contrato de locação com os dados de logística
      const rentalData = {
        client_id: selectedBudget.clientId,
        client_name: selectedBudget.clientName,
        start_date: selectedBudget.startDate,
        end_date: selectedBudget.endDate,
        installation_time: formatTime(logisticsData.installation),
        removal_time: formatTime(logisticsData.removal),
        installation_location: selectedBudget.installationLocation || null,
        total_value: selectedBudget.subtotal, // ✅ CORREÇÃO: Usar subtotal (sem desconto)
        discount: selectedBudget.discount,
        final_value: selectedBudget.totalValue, // ✅ CORREÇÃO: Usar totalValue (já com desconto aplicado)
        status: 'Instalação Pendente' as const,
        observations: selectedBudget.observations || '',
        budget_id: selectedBudget.id,
        // Campos de recorrência
        is_recurring: Boolean(selectedBudget.isRecurring),
        recurrence_type: selectedBudget.isRecurring
          ? selectedBudget.recurrenceType || 'weekly'
          : 'weekly',
        recurrence_interval: selectedBudget.isRecurring
          ? selectedBudget.recurrenceInterval || 1
          : 1,
        recurrence_end_date: selectedBudget.isRecurring
          ? selectedBudget.recurrenceEndDate || null
          : null,
        recurrence_status: 'active' as const,
        parent_rental_id: null,
        next_occurrence_date: null,
      };

      // Verificar se há itens antes de tentar acessá-los
      const budgetItems = selectedBudget?.items || [];
      const totalItems = budgetItems.length;
      const totalValue = budgetItems.reduce((sum, item) => sum + item.total, 0);

      const rentalItems = (selectedBudget?.items || []).map(
        (item: {
          equipmentName: string;
          quantity: number;
          dailyRate: number;
          days: number;
          total: number;
        }) => ({
          equipment_name: item.equipmentName,
          quantity: item.quantity,
          daily_rate: item.dailyRate,
          days: item.days,
          total: item.total,
        })
      );

      // 2. Criar a locação
      await createRental(rentalData, rentalItems, logisticsData);

      // 3. Atualizar o status do orçamento para "Aprovado"
      await updateBudget(selectedBudget.id, { status: 'Aprovado' });

      // 4. Recarregar os orçamentos
      await refreshBudgets();

      // 5. Fechar o modal
      setLogisticsModalOpen(false);
      setSelectedBudget(null);

      // 6. Navegar para a página apropriada baseada no tipo de recorrência
      if (selectedBudget.recurrenceType) {
        window.location.href = '/locacoes-recorrentes';
      } else {
        window.location.href = '/locacoes';
      }
    } catch (error) {
      console.error('Erro ao aprovar orçamento:', error);
      alert('Erro ao aprovar orçamento. Tente novamente.');
    }
  };

  const handleViewBudget = useCallback((budget: Budget) => {
    setSelectedBudget(budget);
    setViewBudgetModalOpen(true); // ✅ CORREÇÃO: Abrir modal de visualização
  }, []);

  const handleGeneratePDF = async (budget: Budget) => {
    try {
      const companySettings = await getCompanySettings();
      await generateBudgetPDF(budget, companySettings);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const confirmDelete = async () => {
    if (!budgetToDelete) return;

    try {
      // setIsDeleting(true) // This state was removed, so this line is removed
      await deleteBudget(budgetToDelete);
      await refreshBudgets();
      setDeleteDialogOpen(false);
      setBudgetToDelete(null);
    } catch (error: unknown) {
      console.error('Erro ao excluir orçamento:', error);
      const errorMessage =
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof error.message === 'string'
          ? error.message
          : 'Erro ao excluir orçamento. Tente novamente.';
      alert(errorMessage);
    } finally {
      // setIsDeleting(false) // This state was removed, so this line is removed
    }
  };

  // Memoização do componente de badge de status
  const getStatusBadge = useCallback((status: Budget['status']) => {
    switch (status) {
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Aprovado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // ✅ CORREÇÃO: Usar toLocaleDateString em vez de format do date-fns
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Memoização do componente de linha da tabela
  const BudgetTableRow = useCallback(
    ({ budget }: { budget: Budget }) => (
      <TableRow key={budget.id}>
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium text-foreground">{budget.number}</div>
              <div className="text-sm text-text-secondary">
                {(budget.items || []).length} item(s)
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="font-medium text-foreground">{budget.clientName}</div>
        </TableCell>
        <TableCell>
          <div className="text-sm text-text-secondary">
            {formatDate(budget.createdAt)}
          </div>
        </TableCell>
        <TableCell>
          <div className="font-medium text-foreground">
            R$ {budget.totalValue.toFixed(2).replace('.', ',')}
          </div>
        </TableCell>
        <TableCell>
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusBadge(
              budget.status
            )}`}
          >
            {budget.status}
          </span>
        </TableCell>
        <TableCell>
          {budget.recurrenceType ? (
            <div className="flex items-center gap-1">
              <Repeat className="h-3 w-3 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">
                {budget.recurrenceType === 'weekly'
                  ? 'Semanal'
                  : budget.recurrenceType === 'monthly'
                    ? 'Mensal'
                    : budget.recurrenceType === 'yearly'
                      ? 'Anual'
                      : 'Recorrente'}
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-500">Não recorrente</span>
          )}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1 flex-wrap">
            {budget.status === 'Pendente' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleApproveBudget(budget)}
                className="text-primary hover:text-primary hover:bg-primary/10"
                title="Aprovar"
                // disabled={isApproving === budget.id} // This state was removed, so this line is removed
              >
                {/* {isApproving === budget.id ? ( // This state was removed, so this line is removed
                        <div className="h-4 w-16 bg-gray-200 rounded" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )} */}
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewBudget(budget)}
              title="Visualizar"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGeneratePDF(budget)}
              // disabled={isGenerating} // This state was removed, so this line is removed
              title="Gerar PDF"
            >
              {/* {isGenerating ? ( // This state was removed, so this line is removed
              <div className="h-4 w-16 bg-gray-200 rounded" />
            ) : (
              <Download className="h-4 w-4" />
            )} */}
              <Download className="h-4 w-4" />
            </Button>
            {budget.status === 'Pendente' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditBudget(budget)}
                title="Editar"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {/* Botão de excluir para orçamentos pendentes */}
            {budget.status === 'Pendente' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteBudget(budget.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            
            {/* Botão de excluir para orçamentos aprovados */}
            {budget.status === 'Aprovado' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteBudget(budget.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Excluir Orçamento Aprovado"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    ),
    [
      handleApproveBudget,
      handleViewBudget,
      handleEditBudget,
      handleDeleteBudget,
      handleGeneratePDF,
      getStatusBadge,
      formatDate,
    ]
  );

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader
          title="Orçamentos"
          description="Gerencie orçamentos pendentes de aprovação"
        />

        <main className="flex-1 space-y-6 p-4 sm:p-6 bg-background">
          {/* Tabela de Orçamentos */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle className="text-foreground">
                    Lista de Orçamentos
                  </CardTitle>
                  <CardDescription className="hidden sm:block">
                    {periodFilter === 'current_month' &&
                      'Orçamentos do mês atual'}
                    {periodFilter === 'last_month' &&
                      'Orçamentos do mês anterior'}
                    {periodFilter === 'custom' &&
                      'Orçamentos do período selecionado'}
                    {periodFilter === 'all' &&
                      'Todos os orçamentos cadastrados no sistema'}
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingBudget(undefined);
                    setIsFormOpen(true);
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Orçamento
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="space-y-4 mb-6">
                {/* Filtros principais */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-end">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Buscar orçamentos..."
                      value={searchTerm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleSearch(e.target.value)
                      }
                      className="pl-10"
                    />
                  </div>
                  <Select
                    value={statusFilter}
                    onValueChange={handleStatusFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status do orçamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todos">Todos os status</SelectItem>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Aprovado">Aprovado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={periodFilter}
                    onValueChange={handlePeriodFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current_month">Mês Atual</SelectItem>
                      <SelectItem value="last_month">Mês Anterior</SelectItem>
                      <SelectItem value="custom">
                        Período Customizado
                      </SelectItem>
                      <SelectItem value="all">Todos os Períodos</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center text-sm text-text-secondary">
                    {budgets.length} orçamento(s) encontrado(s)
                  </div>
                </div>

                {/* Filtros de período customizado */}
                {periodFilter === 'custom' && (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 items-end">
                    <div>
                      <Label
                        htmlFor="startDate"
                        className="text-sm font-medium"
                      >
                        Data Inicial
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate" className="text-sm font-medium">
                        Data Final
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-center text-sm text-text-secondary">
                      {startDate && endDate && (
                        <span>
                          Período:{' '}
                          {new Date(startDate).toLocaleDateString('pt-BR')} a{' '}
                          {new Date(endDate).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Informação do período atual */}
                {periodFilter !== 'all' && (
                  <div className="flex items-center text-sm text-text-secondary">
                    <Calendar className="h-4 w-4 mr-2" />
                    Exibindo orçamentos de: {getPeriodDisplayText()}
                  </div>
                )}
              </div>

              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <Table className="min-w-[800px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold text-gray-900 bg-gray-50">
                          Número
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900 bg-gray-50">
                          Cliente
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900 bg-gray-50">
                          Data
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900 bg-gray-50">
                          Valor Total
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900 bg-gray-50">
                          Status
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900 bg-gray-50">
                          Recorrência
                        </TableHead>
                        <TableHead className="font-semibold text-right text-gray-900 bg-gray-50">
                          Ações
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <div className="flex items-center justify-center gap-2">
                              <div className="space-y-2">
                                <div className="h-4 w-24 bg-gray-200 rounded" />
                                <div className="h-3 w-20 bg-gray-100 rounded" />
                              </div>
                              <span className="text-text-secondary">
                                Carregando orçamentos...
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : budgets.length === 0 && filteredBudgets.length > 0 ? ( // This line was removed, so this block is removed
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-8 text-text-secondary"
                          >
                            Nenhum orçamento encontrado na página atual.
                          </TableCell>
                        </TableRow>
                      ) : filteredBudgets.length === 0 ? ( // This line was removed, so this block is removed
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-8 text-text-secondary"
                          >
                            {searchTerm || statusFilter !== 'Todos'
                              ? 'Nenhum orçamento encontrado com os filtros aplicados.'
                              : 'Nenhum orçamento cadastrado ainda.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredBudgets.map(
                          (
                            budget: Budget // This line was changed from paginatedBudgets to filteredBudgets
                          ) => (
                            <BudgetTableRow key={budget.id} budget={budget} />
                          )
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                            e.preventDefault();
                            handlePageChange(currentPage - 1);
                          }}
                          className={
                            currentPage === 1
                              ? 'pointer-events-none text-gray-400'
                              : ''
                          }
                        />
                      </PaginationItem>
                      {[...Array(totalPages)].map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink
                            href="#"
                            onClick={(
                              e: React.MouseEvent<HTMLAnchorElement>
                            ) => {
                              e.preventDefault();
                              handlePageChange(i + 1);
                            }}
                            isActive={currentPage === i + 1}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                            e.preventDefault();
                            handlePageChange(currentPage + 1);
                          }}
                          className={
                            currentPage === totalPages
                              ? 'pointer-events-none text-gray-400'
                              : ''
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        {/* Formulário de Orçamento - Lazy loaded */}
        {isFormOpen && (
          <Suspense fallback={<LoadingSpinner />}>
            <BudgetFormV2
              open={isFormOpen}
              onOpenChange={(open: boolean) => {
                setIsFormOpen(open);
                if (!open) {
                  // Limpar editingBudget quando o modal fechar
                  setEditingBudget(undefined);
                }
              }}
              budget={editingBudget}
              onSave={handleSaveBudget}
            />
          </Suspense>
        )}

        {/* Modal de Confirmação de Logística - Lazy loaded */}
        {logisticsModalOpen && (
          <Suspense fallback={<LoadingSpinner />}>
            <LogisticsConfirmationModal
              isOpen={logisticsModalOpen}
              onOpenChange={setLogisticsModalOpen}
              budget={selectedBudget}
              onConfirm={handleConfirmApproval}
            />
          </Suspense>
        )}

        {/* Modal de Visualização do Orçamento - Lazy loaded */}
        {viewBudgetModalOpen && selectedBudget && (
          <Suspense fallback={<LoadingSpinner />}>
            <BudgetViewModal
              open={viewBudgetModalOpen}
              onOpenChange={setViewBudgetModalOpen}
              budget={selectedBudget}
              onEdit={(budget) => {
                setEditingBudget(budget);
                setIsFormOpen(true);
              }}
              onGeneratePDF={handleGeneratePDF}
            />
          </Suspense>
        )}

        {/* ✅ NOVO: Modal de Conflitos de Agenda */}
        <Dialog open={conflictsModalOpen} onOpenChange={setConflictsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {conflictsModalTitle}
              </DialogTitle>
              <DialogDescription>
                Verifique os conflitos de agenda detectados antes de continuar
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {conflictsData.map((conflict, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-3">
                    {conflict.isQuantityAvailable ? (
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    ) : (
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    )}
                    <h3 className="font-semibold text-lg">
                      {conflict.equipment}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      conflict.isQuantityAvailable 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {conflict.isQuantityAvailable ? '✅ DISPONÍVEL' : '❌ INDISPONÍVEL'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Quantidade Solicitada:</p>
                      <p className="font-medium">{conflict.requestedQuantity}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Status:</p>
                      <p className={`font-medium ${
                        conflict.isQuantityAvailable ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {conflict.isQuantityAvailable ? 'Quantidade Suficiente' : 'Quantidade Insuficiente'}
                      </p>
                    </div>
                  </div>
                  
                  {conflict.conflicts.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Conflitos Detectados:</p>
                      <div className="space-y-2">
                        {conflict.conflicts.map((c: any, cIndex: number) => (
                          <div key={cIndex} className="bg-white border rounded p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">{c.clientName}</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(c.startDate).toLocaleDateString('pt-BR')} a {new Date(c.endDate).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                {c.quantity} unidade(s)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button 
                onClick={() => {
                  setConflictsModalOpen(false);
                  // Executar a ação pendente
                  if (conflictsModalType === 'create' && pendingBudgetData) {
                    handleSaveBudgetContinue(pendingBudgetData);
                  } else if (conflictsModalType === 'approve' && pendingLogisticsData) {
                    handleConfirmApprovalContinue(pendingLogisticsData);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Continuar Mesmo com Conflitos
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">
                Confirmar Exclusão
              </AlertDialogTitle>
              <div className="space-y-4 text-left">
                <p className="text-base text-muted-foreground leading-relaxed">
                  Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.
                </p>
                
                {/* ✅ AVISO: Impacto para orçamentos aprovados */}
                {budgetToDelete && budgets.find(b => b.id === budgetToDelete)?.status === 'Aprovado' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 bg-amber-500 rounded-full flex-shrink-0"></div>
                      <p className="text-amber-800 text-base font-semibold">
                        ⚠️ Atenção
                      </p>
                    </div>
                    <p className="text-amber-700 text-sm leading-relaxed">
                      Este orçamento está aprovado e pode ter contratos de locação relacionados que também serão excluídos automaticamente.
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                disabled={loading}
              >
                {loading ? 'Excluindo...' : 'Excluir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
      
      {/* ✅ NOVO: Componente Toaster para notificações */}
      <Toaster />
    </SidebarProvider>
  );
}
