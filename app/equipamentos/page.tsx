"use client"

import { useState, useEffect } from "react"
import { Edit, Plus, Search, Trash2, Package, Wrench, AlertTriangle } from "lucide-react"
import { AppSidebar } from "../../components/app-sidebar"
import { EquipmentForm, type Equipment } from "../../components/equipment-form"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious, 
  PaginationEllipsis 
} from "@/components/ui/pagination";
import {
  getEquipments,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  searchEquipments,
} from "../../lib/database/equipments"
import { transformEquipmentFromDB, transformEquipmentToDB } from "../../lib/utils/data-transformers"

export default function EquipmentsPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("Todas")
  const [statusFilter, setStatusFilter] = useState("Todos")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [equipmentToDelete, setEquipmentToDelete] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    loadEquipments()
  }, [])

  const loadEquipments = async () => {
    try {
      setLoading(true)
      const dbEquipments = await getEquipments()
      const transformedEquipments = dbEquipments.map(transformEquipmentFromDB)
      setEquipments(transformedEquipments)
      setFilteredEquipments(transformedEquipments)
    } catch (error) {
      console.error("Erro ao carregar equipamentos:", error)
      alert("Erro ao carregar equipamentos")
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = async () => {
    try {
      const dbEquipments = await searchEquipments(searchTerm, categoryFilter, statusFilter)
      const transformedEquipments = dbEquipments.map(transformEquipmentFromDB)
      setFilteredEquipments(transformedEquipments)
    } catch (error) {
      console.error("Erro ao filtrar equipamentos:", error)
      setFilteredEquipments(equipments)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
  }

  const handleCategoryFilter = (value: string) => {
    setCategoryFilter(value)
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
  }

  // Aplicar filtros sempre que os termos mudarem
  useEffect(() => {
    applyFilters()
  }, [searchTerm, categoryFilter, statusFilter, equipments])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, categoryFilter, statusFilter])

  const handleSaveEquipment = async (equipmentData: Omit<Equipment, "id"> & { id?: string }) => {
    try {
      const dbEquipmentData = transformEquipmentToDB(equipmentData)

      if (equipmentData.id) {
        // Editar equipamento existente
        await updateEquipment(equipmentData.id, dbEquipmentData)
      } else {
        // Adicionar novo equipamento
        await createEquipment(dbEquipmentData)
      }

      await loadEquipments() // Recarregar lista
      setEditingEquipment(undefined)
    } catch (error) {
      console.error("Erro ao salvar equipamento:", error)
      alert("Erro ao salvar equipamento")
    }
  }

  const handleEditEquipment = (equipment: Equipment) => {
    setEditingEquipment(equipment)
    setIsFormOpen(true)
  }

  const handleDeleteEquipment = (id: string) => {
    setEquipmentToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (equipmentToDelete) {
      try {
        await deleteEquipment(equipmentToDelete)
        await loadEquipments() // Recarregar lista
      } catch (error) {
        console.error("Erro ao deletar equipamento:", error)
        alert("Erro ao deletar equipamento")
      }
    }
    setDeleteDialogOpen(false)
    setEquipmentToDelete(null)
  }

  const getStatusBadge = (status: Equipment["status"]) => {
    switch (status) {
      case "Disponível":
        return "bg-green-100 text-green-800"
      case "Alugado":
        return "bg-blue-100 text-blue-800"
      case "Manutenção":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const categories = ["Todas", "Som", "Iluminação", "Estrutura", "Decoração", "Outros"]
  const statuses = ["Todos", "Disponível", "Alugado", "Manutenção"]

  const totalPages = Math.ceil(filteredEquipments.length / ITEMS_PER_PAGE);
  const paginatedEquipments = filteredEquipments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
              <h1 className="text-lg font-semibold text-foreground">Equipamentos</h1>
              <p className="text-sm text-gray-600">Gerencie seu inventário de equipamentos</p>
            </div>
            <Button
              onClick={() => {
                setEditingEquipment(undefined)
                setIsFormOpen(true)
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Equipamento
            </Button>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6 bg-gray-50">
          {/* Busca e Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Buscar Equipamentos</CardTitle>
              <CardDescription>Encontre equipamentos por nome, descrição, categoria ou status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4 items-end">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar equipamentos..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  {filteredEquipments.length} equipamento(s) encontrado(s)
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Equipamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Lista de Equipamentos</CardTitle>
              <CardDescription>Todos os equipamentos cadastrados no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Equipamento</TableHead>
                      <TableHead className="font-semibold">Categoria</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Valor Diário</TableHead>
                      <TableHead className="font-semibold text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEquipments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          {searchTerm || categoryFilter !== "Todas" || statusFilter !== "Todos"
                            ? "Nenhum equipamento encontrado com os termos de busca."
                            : "Nenhum equipamento cadastrado ainda."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedEquipments.map((equipment) => (
                        <TableRow key={equipment.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Package className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-medium text-foreground">{equipment.name}</div>
                                {equipment.description && (
                                  <div className="text-sm text-gray-600 max-w-xs truncate">{equipment.description}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{equipment.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusBadge(equipment.status)}>
                                {equipment.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">R$ {equipment.dailyRate.toFixed(2).replace(".", ",")}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditEquipment(equipment)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteEquipment(equipment.id)}
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
                          onClick={(e) => {
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
                            onClick={(e) => {
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
                          onClick={(e) => {
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

        {/* Formulário de Equipamento */}
        <EquipmentForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          equipment={editingEquipment}
          onSave={handleSaveEquipment}
        />

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este equipamento? Esta ação não pode ser desfeita e pode afetar
                orçamentos e locações relacionadas.
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
