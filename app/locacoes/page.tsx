"use client"

import React, { useState, useEffect } from "react"
import { Edit, Eye, Plus, Search, Trash2, Clock, Calendar, DollarSign, FileText, Package, MessageSquare } from "lucide-react"
import { AppSidebar } from "../../components/app-sidebar"
import { RentalForm, type Rental } from "../../components/rental-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
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
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";



import { getRentals, createRental, updateRental, deleteRental, searchRentals } from "../../lib/database/rentals"
import { transformRentalFromDB } from "../../lib/utils/data-transformers"

export default function RentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([])
  const [filteredRentals, setFilteredRentals] = useState<Rental[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("Todos")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRental, setEditingRental] = useState<Rental | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [rentalToDelete, setRentalToDelete] = useState<string | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewingRental, setViewingRental] = useState<Rental | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  const statuses = ["Todos", "Instalação Pendente", "Ativo", "Concluído"]

  // Carregar locações do Supabase
  const loadRentals = async () => {
    try {
      setLoading(true)
      // Carregar apenas as primeiras 50 locações para melhor performance
      const data = await getRentals(50)
      const transformedRentals = data.map(transformRentalFromDB)
      setRentals(transformedRentals)
      setFilteredRentals(transformedRentals)
      setCurrentPage(1); // Reset to first page on new search
    } catch (error) {
      console.error("Erro ao carregar locações:", error)
      alert("Erro ao carregar locações. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados na inicialização
  useEffect(() => {
    loadRentals()
  }, [])

  // Aplicar filtros
  const applyFilters = async () => {
    try {
      const data = await searchRentals(searchTerm, statusFilter)
      const transformedRentals = data.map(transformRentalFromDB)
      setFilteredRentals(transformedRentals)
    } catch (error) {
      console.error("Erro ao filtrar locações:", error)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
  }

  // Aplicar filtros sempre que os valores mudarem
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      applyFilters()
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timeoutId)
  }, [searchTerm, statusFilter])

  // Reset para primeira página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  const handleSaveRental = async (rentalData: Omit<Rental, "id"> & { id?: string }) => {
    try {
      setSaving(true)

      // Preparar dados para o banco
      const rentalForDB = {
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
        status: rentalData.status,
        observations: rentalData.observations || null,
        budget_id: rentalData.budgetId || null,
      }

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
        alert("Locação atualizada com sucesso!")
      } else {
        // Criar nova locação
        await createRental(rentalForDB, itemsForDB, {
          installation: new Date(rentalData.startDate + ' ' + rentalData.installationTime),
          removal: new Date(rentalData.endDate + ' ' + rentalData.removalTime)
        })
        alert("Locação criada com sucesso!")
      }

      // Recarregar dados
      await loadRentals()
      setEditingRental(undefined)
    } catch (error) {
      console.error("Erro ao salvar locação:", error)
      alert("Erro ao salvar locação. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  const handleEditRental = (rental: Rental) => {
    setEditingRental(rental)
    setIsFormOpen(true)
  }

  const handleDeleteRental = (id: string) => {
    setRentalToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (rentalToDelete) {
      try {
        await deleteRental(rentalToDelete)
        alert("Locação excluída com sucesso!")
        await loadRentals()
      } catch (error) {
        console.error("Erro ao excluir locação:", error)
        alert("Erro ao excluir locação. Tente novamente.")
      }
    }
    setDeleteDialogOpen(false)
    setRentalToDelete(null)
  }

  const getStatusBadge = (status: Rental["status"]) => {
    const styles = {
      "Instalação Pendente": "bg-accent/10 text-accent",
      Ativo: "bg-primary/10 text-primary",
      Concluído: "bg-blue-100 text-blue-700",
    }
    return styles[status]
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    
    // Converter de YYYY-MM-DD para DD/MM/YYYY
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    
    return dateString; // Se não estiver no formato esperado, retornar como está
  };

  const handleViewRental = (rental: Rental) => {
    setViewingRental(rental)
    setViewDialogOpen(true)
  }

  const totalPages = Math.ceil(filteredRentals.length / ITEMS_PER_PAGE);
  const paginatedRentals = filteredRentals.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">Locações</h1>
              <p className="text-sm text-gray-600">Gerencie contratos de locação e equipamentos</p>
            </div>
            <Button
              onClick={() => {
                setEditingRental(undefined)
                setIsFormOpen(true)
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Contrato
            </Button>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6 bg-gray-50">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Filtros</CardTitle>
              <CardDescription>Use os filtros para encontrar contratos específicos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 items-end">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar contratos..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center text-sm text-gray-600">
                  {filteredRentals.length} contrato(s) encontrado(s)
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Locações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Lista de Contratos</CardTitle>
              <CardDescription>Todos os contratos de locação cadastrados no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Cliente</TableHead>
                      <TableHead className="font-semibold">Período</TableHead>
                      <TableHead className="font-semibold">Valor</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRentals.length === 0 && filteredRentals.length > 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          Nenhum contrato encontrado na página atual.
                        </TableCell>
                      </TableRow>
                    ) : filteredRentals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          {searchTerm || statusFilter !== "Todos"
                            ? "Nenhum contrato encontrado com os filtros aplicados."
                            : "Nenhum contrato cadastrado ainda."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRentals.map((rental) => (
                        <TableRow key={rental.id}>
                          <TableCell>
                            <div className="font-medium text-foreground">{rental.clientName}</div>
                            <div className="text-sm text-gray-600">{rental.items.length} item(s)</div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span>
                                  {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">R$ {rental.finalValue.toFixed(2).replace(".", ",")}</div>
                              {rental.discount > 0 && (
                                <div className="text-sm text-gray-600">
                                  Desc: R$ {rental.discount.toFixed(2).replace(".", ",")}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusBadge(rental.status)}`}
                            >
                              {rental.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewRental(rental)}
                                title="Visualizar"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditRental(rental)}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteRental(rental.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
        <RentalForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          rental={editingRental}
          onSave={handleSaveRental}
          saving={saving}
        />

        {/* Dialog de Visualização */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground text-xl font-bold">Detalhes do Contrato</DialogTitle>
              <DialogDescription className="text-base">
                {viewingRental?.clientName}
              </DialogDescription>
            </DialogHeader>
            {viewingRental && (
              <div className="space-y-6">
                {/* Cabeçalho com informações principais */}
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6 rounded-lg border border-primary/20">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <span className="text-sm text-gray-600">Status:</span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusBadge(viewingRental.status)}`}
                        >
                          {viewingRental.status}
                        </span>
                      </div>
                      {viewingRental.installationLocation && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Local:</span>
                          <span className="font-medium">{viewingRental.installationLocation}</span>
                        </div>
                      )}
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
                      onClick={() => {
                        // TODO: Implementar geração de contrato
                        alert("Funcionalidade de geração de contrato será implementada em breve!")
                      }}
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
