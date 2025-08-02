"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Repeat, 
  Play, 
  Pause, 
  X, 
  Plus,
  Search,
  Filter
} from "lucide-react"
import { AppSidebar } from "../../components/app-sidebar"
import { PageHeader } from "../../components/page-header"
import { NotificationBell } from "../../components/notification-bell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { formatDateCuiaba } from "@/lib/utils"
import { getRecurringRentals, pauseRecurrence, resumeRecurrence, cancelRecurrence } from "../../lib/database/recurring-rentals"
import { transformRentalFromDB } from "../../lib/utils/data-transformers"
import type { Rental } from "../../lib/utils/data-transformers"
import { useToast } from "@/components/ui/use-toast"

// Hook para debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function RecurringRentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("Todos")
  const [typeFilter, setTypeFilter] = useState("Todos")
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null)
  const [actionType, setActionType] = useState<"pause" | "resume" | "cancel" | null>(null)

  const { toast } = useToast()

  // Debounce do termo de busca
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoização dos filtros aplicados
  const filteredRentals = useMemo(() => {
    let filtered = rentals;

    // Filtrar por termo de busca
    if (debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter((rental: Rental) =>
        rental.clientName.toLowerCase().includes(searchLower) ||
        rental.installationLocation?.toLowerCase().includes(searchLower)
      );
    }

    // Filtrar por status
    if (statusFilter !== "Todos") {
      filtered = filtered.filter((rental: Rental) => rental.recurrenceStatus === statusFilter);
    }

    // Filtrar por tipo
    if (typeFilter !== "Todos") {
      filtered = filtered.filter((rental: Rental) => rental.recurrenceType === typeFilter);
    }

    return filtered;
  }, [rentals, debouncedSearchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    loadRecurringRentals()
  }, [])

  const loadRecurringRentals = async () => {
    try {
      setLoading(true)
      const dbRentals = await getRecurringRentals(50)
      const transformedRentals = dbRentals.map(transformRentalFromDB)
      setRentals(transformedRentals)
    } catch (error: any) {
      console.error("Erro ao carregar locações recorrentes:", error)
      
      // Verificar se é erro de colunas não encontradas
      if (error?.message?.includes('COLUMNS_NOT_FOUND')) {
        toast({
          title: "Configuração necessária",
          description: "As colunas de recorrência não foram encontradas. Execute o script SQL de configuração primeiro.",
          variant: "destructive",
        })
        setRentals([])
      } else if (error?.code === 'PGRST200' && error?.message?.includes('recurring_rental_occurrences')) {
        console.warn("Tabela de ocorrências recorrentes não encontrada. Execute o script SQL primeiro.")
        setRentals([])
      } else {
        // Para outros erros, mostrar mensagem amigável
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar as locações recorrentes. Tente novamente.",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    if (!selectedRental || !actionType) return

    try {
      switch (actionType) {
        case "pause":
          await pauseRecurrence(selectedRental.id)
          break
        case "resume":
          await resumeRecurrence(selectedRental.id)
          break
        case "cancel":
          await cancelRecurrence(selectedRental.id)
          break
      }
      
      await loadRecurringRentals()
      setActionDialogOpen(false)
      setSelectedRental(null)
      setActionType(null)
    } catch (error) {
      console.error("Erro ao executar ação:", error)
      alert("Erro ao executar ação")
    }
  }

  const getRecurrenceTypeLabel = (type: string) => {
    switch (type) {
      case "daily": return "Diária"
      case "weekly": return "Semanal"
      case "monthly": return "Mensal"
      case "yearly": return "Anual"
      default: return type
    }
  }

  const getRecurrenceStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 border border-green-200">Ativa</Badge>
      case "paused":
        return <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">Pausada</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 border border-red-200">Cancelada</Badge>
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800 border border-blue-200">Concluída</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getInstallationStatusBadge = (status: string) => {
    switch (status) {
      case "Ativo":
        return <Badge className="bg-green-100 text-green-800 border border-green-200">Ativo</Badge>
      case "Instalação Pendente":
        return <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">Pendente</Badge>
      case "Concluído":
        return <Badge className="bg-blue-100 text-blue-800 border border-blue-200">Concluído</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader 
          title="Locações Recorrentes" 
          description="Gerencie suas locações recorrentes" 
        />

        <main className="flex-1 space-y-6 p-4 sm:p-6 bg-background">
          {/* Cards de Estatísticas */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Recorrências</CardTitle>
                <Repeat className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredRentals.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recorrências Ativas</CardTitle>
                <Play className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {filteredRentals.filter(r => r.recurrenceStatus === "active").length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recorrências Pausadas</CardTitle>
                <Pause className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {filteredRentals.filter(r => r.recurrenceStatus === "paused").length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recorrências Canceladas</CardTitle>
                <X className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {filteredRentals.filter(r => r.recurrenceStatus === "cancelled").length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Locações Recorrentes */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle className="text-foreground">Locações Recorrentes</CardTitle>
                  <CardDescription className="hidden sm:block">
                    Gerencie suas locações que se repetem automaticamente
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 items-end mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar locações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos os status</SelectItem>
                    <SelectItem value="active">Ativas</SelectItem>
                    <SelectItem value="paused">Pausadas</SelectItem>
                    <SelectItem value="cancelled">Canceladas</SelectItem>
                    <SelectItem value="completed">Concluídas</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos os tipos</SelectItem>
                    <SelectItem value="daily">Diária</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <Table className="min-w-[800px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold text-gray-900 bg-gray-50">Cliente</TableHead>
                        <TableHead className="font-semibold text-gray-900 bg-gray-50">Recorrência</TableHead>
                        <TableHead className="font-semibold text-gray-900 bg-gray-50">Próxima Ocorrência</TableHead>
                        <TableHead className="font-semibold text-gray-900 bg-gray-50">Local</TableHead>
                        <TableHead className="font-semibold text-gray-900 bg-gray-50">Status</TableHead>
                        <TableHead className="font-semibold text-right text-gray-900 bg-gray-50">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                              <span className="text-text-secondary">Carregando locações...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredRentals.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-text-secondary">
                            {searchTerm || statusFilter !== "Todos" || typeFilter !== "Todos"
                              ? "Nenhuma locação encontrada com os filtros aplicados."
                              : "Nenhuma locação recorrente cadastrada ainda."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRentals.map((rental: Rental) => (
                          <TableRow key={rental.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                  <User className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="font-medium text-foreground">{rental.clientName}</div>
                                  <div className="text-sm text-text-secondary">
                                    {rental.items.length} item(s)
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Repeat className="h-4 w-4 text-primary" />
                                  <span className="font-medium">
                                    {getRecurrenceTypeLabel(rental.recurrenceType || "none")}
                                  </span>
                                </div>
                                <div className="text-sm text-text-secondary">
                                  A cada {rental.recurrenceInterval} {rental.recurrenceType === "monthly" ? "mês(es)" : 
                                    rental.recurrenceType === "weekly" ? "semana(s)" : 
                                    rental.recurrenceType === "yearly" ? "ano(s)" : "dia(s)"}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-3 w-3 text-text-secondary" />
                                <span className="text-text-secondary">
                                  {rental.nextOccurrenceDate 
                                    ? formatDateCuiaba(rental.nextOccurrenceDate, "dd/MM/yyyy")
                                    : "Não agendada"
                                  }
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-text-secondary">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate max-w-32">
                                  {rental.installationLocation || "Não informado"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getRecurrenceStatusBadge(rental.recurrenceStatus || "active")}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1 flex-wrap">
                                {rental.recurrenceStatus === "active" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRental(rental)
                                      setActionType("pause")
                                      setActionDialogOpen(true)
                                    }}
                                    title="Pausar"
                                  >
                                    <Pause className="h-4 w-4" />
                                  </Button>
                                )}
                                {rental.recurrenceStatus === "paused" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRental(rental)
                                      setActionType("resume")
                                      setActionDialogOpen(true)
                                    }}
                                    title="Retomar"
                                  >
                                    <Play className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRental(rental)
                                    setActionType("cancel")
                                    setActionDialogOpen(true)
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Cancelar"
                                >
                                  <X className="h-4 w-4" />
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
            </CardContent>
          </Card>
        </main>

        {/* Dialog de Confirmação de Ação */}
        <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">
                {actionType === "pause" && "Pausar Recorrência"}
                {actionType === "resume" && "Retomar Recorrência"}
                {actionType === "cancel" && "Cancelar Recorrência"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {actionType === "pause" && "Tem certeza que deseja pausar esta recorrência? As próximas ocorrências não serão geradas automaticamente."}
                {actionType === "resume" && "Tem certeza que deseja retomar esta recorrência? As ocorrências voltarão a ser geradas automaticamente."}
                {actionType === "cancel" && "Tem certeza que deseja cancelar esta recorrência? Esta ação não pode ser desfeita e todas as ocorrências futuras serão removidas."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleAction}
                className={
                  actionType === "cancel" 
                    ? "bg-red-600 hover:bg-red-700" 
                    : actionType === "pause"
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-green-600 hover:bg-green-700"
                }
              >
                {actionType === "pause" && "Pausar"}
                {actionType === "resume" && "Retomar"}
                {actionType === "cancel" && "Cancelar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  )
} 