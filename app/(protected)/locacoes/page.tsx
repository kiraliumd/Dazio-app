"use client"

import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react"
import { Edit, Eye, Plus, Search, Trash2, Clock, Calendar, DollarSign, FileText, Package, MessageSquare, User, MapPin } from "lucide-react"
import { AppSidebar } from "../../../components/app-sidebar"
import { PageHeader } from "../../../components/page-header"
import { type Rental } from "../../../components/rental-form"
import { NotificationBell } from "../../../components/notification-bell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatDateCuiaba, formatTimeCuiaba } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast"
import { useRentals, useClients } from "@/lib/hooks/use-optimized-data"
import { transformRentalFromDB } from "../../../lib/utils/data-transformers"
import { pdf } from '@react-pdf/renderer'
import { ContractPDF } from "../../../components/contract-pdf"

// Importar funções de CRUD que ainda são necessárias
import { createRental, updateRental, deleteRental, searchRentals } from "../../../lib/database/rentals"
import { getCompanySettings } from "../../../lib/database/settings"

// Lazy load dos componentes pesados
const RentalForm = lazy(() => import("../../../components/rental-form").then(module => ({ default: module.RentalForm })))

// Hook para debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
  </div>
);

export default function RentalsPage() {
  const { toast } = useToast()
  const [rentals, setRentals] = useState<Rental[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRental, setEditingRental] = useState<Rental | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [rentalToDelete, setRentalToDelete] = useState<string | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewingRental, setViewingRental] = useState<Rental | null>(null)
  const [saving, setSaving] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  // Usar hooks otimizados para dados
  const { data: dbRentals, loading: rentalsLoading, error: rentalsError, refresh: refreshRentals } = useRentals(50)
  const { data: dbClients, loading: clientsLoading, error: clientsError } = useClients()

  // Atualizar estados locais quando dados são carregados
  useEffect(() => {
    if (dbRentals && Array.isArray(dbRentals)) {
      const transformedRentals = dbRentals.map(transformRentalFromDB)
      setRentals(transformedRentals)
    }
  }, [dbRentals])

  // Calcular loading geral
  useEffect(() => {
    setLoading(rentalsLoading || clientsLoading)
  }, [rentalsLoading, clientsLoading])

  // Tratar erros
  useEffect(() => {
    if (rentalsError) {
      console.error('Erro ao carregar locações:', rentalsError)
      toast({
        title: "Erro",
        description: "Erro ao carregar locações. Tente novamente.",
        variant: "destructive",
      });
    }
    if (clientsError) {
      console.error('Erro ao carregar clientes:', clientsError)
    }
  }, [rentalsError, clientsError, toast])

  // Carregar dados na montagem
  useEffect(() => {
    console.log('📦 Locações: Dados sendo carregados pelos hooks otimizados')
  }, [])

  // Função para buscar cliente por ID usando dados em cache
  const getClientById = useCallback((clientId: string) => {
    if (dbClients && Array.isArray(dbClients)) {
      return dbClients.find(client => client.id === clientId)
    }
    return null
  }, [dbClients])

  // Debounce do termo de busca
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Memoização dos filtros
  const filteredRentals = useMemo(() => {
    let filtered = rentals
    if (debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase()
      filtered = filtered.filter((r: Rental) =>
        r.clientName.toLowerCase().includes(searchLower) ||
        r.installationLocation?.toLowerCase().includes(searchLower)
      )
    }
    // Ordenar: "Instalação Pendente" primeiro, depois por data de início
    filtered = [...filtered].sort((a: Rental, b: Rental) => {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    })
    return filtered
  }, [rentals, debouncedSearchTerm])

  // Memoização da paginação
  const paginatedRentals = useMemo(() => {
    return filteredRentals.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  }, [filteredRentals, currentPage])
  const totalPages = useMemo(() => Math.ceil(filteredRentals.length / ITEMS_PER_PAGE), [filteredRentals.length])

  // Reset para primeira página quando filtros mudarem
  useEffect(() => { setCurrentPage(1) }, [debouncedSearchTerm])

  // Handlers memoizados
  const handleSearch = useCallback((value: string) => setSearchTerm(value), [])
  const handleEditRental = useCallback((rental: Rental) => { setEditingRental(rental); setIsFormOpen(true) }, [])
  const handleDeleteRental = useCallback((id: string) => { setRentalToDelete(id); setDeleteDialogOpen(true) }, [])
  const handleViewRental = useCallback((rental: Rental) => { setViewingRental(rental); setViewDialogOpen(true) }, [])
  const handlePageChange = useCallback((page: number) => setCurrentPage(page), [])

  const handleSaveRental = async (rentalData: Omit<Rental, "id"> & { id?: string }) => {
    try {
      setSaving(true)

      // Preparar dados para o banco
      const rentalForDBBase = {
        client_id: rentalData.clientId,
        client_name: rentalData.clientName,
        start_date: rentalData.startDate,
        end_date: rentalData.endDate,
        installation_time: rentalData.installationTime,
        removal_time: rentalData.removalTime,
        installation_location: rentalData.installationLocation || null,
        total_value: rentalData.totalValue,
        discount: rentalData.discount,
        final_value: rentalData.finalValue,
        observations: rentalData.observations || null,
        budget_id: rentalData.budgetId || null,
        is_recurring: rentalData.isRecurring || false,
      };
      const rentalForDB: any = {
        ...rentalForDBBase,
        recurrence_type: rentalData.isRecurring ? rentalData.recurrenceType : undefined,
        recurrence_interval: rentalData.isRecurring ? rentalData.recurrenceInterval || 1 : undefined,
        recurrence_end_date: rentalData.isRecurring ? rentalData.recurrenceEndDate || null : undefined,
        recurrence_status: rentalData.isRecurring ? rentalData.recurrenceStatus || "active" : undefined,
        parent_rental_id: rentalData.isRecurring ? rentalData.parentRentalId || null : undefined,
        next_occurrence_date: rentalData.isRecurring ? rentalData.nextOccurrenceDate || null : undefined,
      };

      const itemsForDB = rentalData.items.map((item) => ({
        equipment_name: item.equipmentName,
        quantity: item.quantity,
        daily_rate: item.dailyRate,
        days: item.days,
        total: item.total,
      }))

      if (rentalData.id) {
        // Editar locação existente
        await updateRental(rentalData.id, rentalForDB, itemsForDB)
        toast({
          title: "Sucesso!",
          description: "Locação atualizada com sucesso!",
          variant: "default",
        });
      } else {
        // Criar nova locação
        await createRental(rentalForDB, itemsForDB, {
          installation: new Date(rentalData.startDate + ' ' + rentalData.installationTime),
          removal: new Date(rentalData.endDate + ' ' + rentalData.removalTime)
        })
        toast({
          title: "Sucesso!",
          description: "Locação criada com sucesso!",
          variant: "default",
        });
      }

      // Recarregar dados
      await refreshRentals()
      setEditingRental(undefined)
    } catch (error) {
      console.error("Erro ao salvar locação:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar locação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (rentalToDelete) {
      try {
        await deleteRental(rentalToDelete)
        toast({
          title: "Sucesso!",
          description: "Locação excluída com sucesso!",
          variant: "default",
        });
        await refreshRentals()
      } catch (error) {
        console.error("Erro ao excluir locação:", error)
        toast({
          title: "Erro",
          description: "Erro ao excluir locação. Tente novamente.",
          variant: "destructive",
        });
      }
    }
    setDeleteDialogOpen(false)
    setRentalToDelete(null)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return formatDateCuiaba(dateString, "dd/MM/yyyy")
  };

  const handleGenerateContract = async (rental: Rental) => {
    try {
      // Buscar configurações da empresa
      const companySettings = await getCompanySettings();
      
      // Buscar dados do cliente
      const client = await getClientById(rental.clientId);
      
      if (!client) {
        toast({
          title: "Erro",
          description: "Cliente não encontrado",
          variant: "destructive",
        });
        return;
      }

      // Verificar se todos os dados necessários estão presentes
      if (!rental.items || rental.items.length === 0) {
        toast({
          title: "Erro",
          description: "Contrato sem equipamentos. Não é possível gerar o PDF.",
          variant: "destructive",
        });
        return;
      }

      // Preparar dados para o PDF com validações
      const contractData = {
        company: {
          name: companySettings.company_name || 'Empresa não configurada',
          cnpj: companySettings.cnpj || 'CNPJ não informado',
          address: companySettings.address || 'Endereço não informado',
          phone: companySettings.phone || 'Telefone não informado',
          email: companySettings.email || 'Email não informado',
        },
        client: {
          name: client.name || 'Nome não informado',
          document: client.document_number || 'Documento não informado',
          address: 'Endereço não informado', // Campo não existe na tabela
          phone: client.phone || 'Telefone não informado',
          email: client.email || 'Email não informado',
        },
        contract: {
          startDate: rental.startDate || new Date().toISOString(),
          endDate: rental.endDate || new Date().toISOString(),
          installationTime: rental.installationTime || '09:00',
          removalTime: rental.removalTime || '18:00',
          installationLocation: rental.installationLocation || 'Local não informado',
          totalValue: rental.totalValue || 0,
          discount: rental.discount || 0,
          finalValue: rental.finalValue || 0,
          items: rental.items.map(item => ({
            equipmentName: item.equipmentName || 'Equipamento não informado',
            quantity: item.quantity || 1,
            dailyRate: item.dailyRate || 0,
            days: item.days || 1,
            total: item.total || 0,
          })),
        },
        template: companySettings.contract_template || '',
      };

      // Log para debug
      console.log('Dados do contrato:', contractData);

      // Gerar PDF com try/catch específico
      let blob;
      try {
        blob = await pdf(<ContractPDF data={contractData} />).toBlob();
      } catch (pdfError: any) {
        console.error('Erro específico do PDF:', pdfError);
        throw new Error('Erro na geração do PDF: ' + (pdfError?.message || 'Erro desconhecido'));
      }
      
      // Criar URL e baixar
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contrato_${rental.clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Sucesso!",
        description: "Contrato gerado e baixado com sucesso!",
        variant: "default",
      });
    } catch (error) {
      console.error('Erro ao gerar contrato:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar contrato. Verifique se todos os dados estão preenchidos corretamente.",
        variant: "destructive",
      });
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader 
          title="Locações" 
          description="Gerencie contratos de locação e equipamentos" 
        />

        <main className="flex-1 space-y-6 p-4 sm:p-6 bg-background">
          {/* Tabela de Locações */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle className="text-foreground">Lista de Contratos</CardTitle>
                  <CardDescription className="hidden sm:block">Todos os contratos de locação cadastrados no sistema</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingRental(undefined)
                    setIsFormOpen(true)
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Contrato
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 items-end mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar contratos..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center text-sm text-text-secondary col-span-1 sm:col-span-2 lg:col-span-1">
                  {filteredRentals.length} contrato(s) encontrado(s)
                </div>
              </div>
              
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold text-gray-900 bg-gray-50">Cliente</TableHead>
                      <TableHead className="font-semibold text-gray-900 bg-gray-50">Período</TableHead>
                      <TableHead className="font-semibold text-gray-900 bg-gray-50">Local</TableHead>
                      <TableHead className="font-semibold text-gray-900 bg-gray-50">Valor</TableHead>
                      <TableHead className="font-semibold text-right text-gray-900 bg-gray-50">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <LoadingSpinner />
                        </TableCell>
                      </TableRow>
                    ) : paginatedRentals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-text-secondary">
                          {searchTerm
                            ? "Nenhum contrato encontrado com os filtros aplicados."
                            : "Nenhum contrato cadastrado ainda."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRentals.map((rental) => (
                        <TableRow key={rental.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <User className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-medium text-foreground">{rental.clientName}</div>
                                <div className="text-sm text-text-secondary">{rental.items.length} item(s)</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3 text-text-secondary" />
                              <span className="text-text-secondary">{formatDate(rental.startDate)} - {formatDate(rental.endDate)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-text-secondary">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate max-w-32">{rental.installationLocation || "Não informado"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-foreground">
                              R$ {rental.finalValue.toFixed(2).replace(".", ",")}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewRental(rental)}
                                title="Visualizar"
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGenerateContract(rental)}
                                title="Gerar Contrato"
                                className="h-8 w-8 p-0"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditRental(rental)}
                                title="Editar"
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteRental(rental.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
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
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#"
                          onClick={(e: React.MouseEvent) => {
                            e.preventDefault();
                            handlePageChange(currentPage - 1);
                          }}
                          className={currentPage === 1 ? "pointer-events-none text-gray-400" : ""}
                        />
                      </PaginationItem>
                      {[...Array(totalPages)].map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink 
                            href="#"
                            onClick={(e: React.MouseEvent) => {
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
                          onClick={(e: React.MouseEvent) => {
                            e.preventDefault();
                            handlePageChange(currentPage + 1);
                          }}
                          className={currentPage === totalPages ? "pointer-events-none text-gray-400" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        {/* Formulário de Contrato */}
        <Suspense fallback={<LoadingSpinner />}>
          <RentalForm
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
            rental={editingRental}
            onSave={handleSaveRental}
            saving={saving}
          />
        </Suspense>

        {/* Dialog de Visualização */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="w-[95vw] max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground text-xl font-bold">Detalhes do Contrato</DialogTitle>
              <DialogDescription className="text-base">
                {viewingRental?.clientName}
              </DialogDescription>
            </DialogHeader>
            {viewingRental && (
              <div className="space-y-6">
                {/* Cabeçalho com informações principais */}
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 lg:p-6 rounded-lg border border-primary/20">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        R$ {viewingRental.finalValue.toFixed(2).replace(".", ",")}
                      </div>
                      <div className="text-sm text-gray-600">Valor Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {viewingRental.items.length}
                      </div>
                      <div className="text-sm text-gray-600">Equipamentos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {viewingRental.items.reduce((sum, item) => sum + item.days, 0)}
                      </div>
                      <div className="text-sm text-gray-600">Dias de Locação</div>
                    </div>
                  </div>
                </div>

                {/* Informações do contrato */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Informações do Contrato
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Período:</span>
                        <span className="font-medium">
                          {formatDate(viewingRental.startDate)} - {formatDate(viewingRental.endDate)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Local:</span>
                        <span className="font-medium">{viewingRental.installationLocation}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Instalação:</span>
                        <span className="font-medium">{viewingRental.installationTime}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Retirada:</span>
                        <span className="font-medium">{viewingRental.removalTime}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        Valores
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Subtotal:</span>
                        <span className="font-medium">R$ {viewingRental.totalValue.toFixed(2).replace(".", ",")}</span>
                      </div>
                      {viewingRental.discount > 0 && (
                        <div className="flex justify-between items-center text-red-600">
                          <span className="text-sm">Desconto:</span>
                          <span className="font-medium">- R$ {viewingRental.discount.toFixed(2).replace(".", ",")}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center font-semibold text-lg border-t pt-3">
                        <span>Total Final:</span>
                        <span className="text-primary">R$ {viewingRental.finalValue.toFixed(2).replace(".", ",")}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Lista de equipamentos */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Equipamentos ({viewingRental.items.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {viewingRental.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{item.equipmentName}</p>
                            <p className="text-sm text-gray-600">
                              {item.quantity}x • {item.days} dia(s) • R$ {item.dailyRate.toFixed(2).replace(".", ",")}/dia
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-gray-900">R$ {item.total.toFixed(2).replace(".", ",")}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Observações */}
                {viewingRental.observations && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Observações
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border">
                        {viewingRental.observations}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Botões de ação */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        // TODO: Implementar geração de nota fiscal
                        alert("Funcionalidade de geração de nota fiscal será implementada em breve!")
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Gerar Nota Fiscal
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleGenerateContract(viewingRental)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Gerar Contrato
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleEditRental(viewingRental)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button onClick={() => setViewDialogOpen(false)}>
                      Fechar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
