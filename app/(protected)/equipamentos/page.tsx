"use client"

import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react"
import { Edit, Plus, Search, Trash2, Package, Wrench, AlertTriangle } from "lucide-react"
import { AppSidebar } from "../../components/app-sidebar"
import { PageHeader } from "../../components/page-header"
// Lazy load do componente pesado
const EquipmentForm = lazy(() => import("../../components/equipment-form").then(module => ({ default: module.EquipmentForm })))
import type { Equipment } from "../../components/equipment-form"
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
} from "../../lib/database/equipments"
import { transformEquipmentFromDB, transformEquipmentToDB } from "../../lib/utils/data-transformers"
import { useEquipmentCategories } from "../../hooks/useEquipmentCategories"
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

// Componente de loading para lazy components
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
  </div>
);

export default function EquipmentsPage() {
  const { categories: equipmentCategories, refreshCategories } = useEquipmentCategories();
  const { toast } = useToast();
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("Todas")
  const [statusFilter, setStatusFilter] = useState("Todos")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [equipmentToDelete, setEquipmentToDelete] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  // Debounce do termo de busca
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoização dos filtros aplicados
  const filteredEquipments = useMemo(() => {
    let filtered = equipments;

    // Filtrar por termo de busca
    if (debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter((equipment: Equipment) =>
        equipment.name.toLowerCase().includes(searchLower) ||
        equipment.category.toLowerCase().includes(searchLower) ||
        equipment.description?.toLowerCase().includes(searchLower)
      );
    }

    // Filtrar por categoria
    if (categoryFilter !== "Todas") {
      filtered = filtered.filter((equipment: Equipment) => equipment.category === categoryFilter);
    }

    // Filtrar por status
    if (statusFilter !== "Todos") {
      filtered = filtered.filter((equipment: Equipment) => equipment.status === statusFilter);
    }

    return filtered;
  }, [equipments, debouncedSearchTerm, categoryFilter, statusFilter]);

  // Memoização da paginação
  const paginatedEquipments = useMemo(() => {
    return filteredEquipments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredEquipments, currentPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredEquipments.length / ITEMS_PER_PAGE);
  }, [filteredEquipments.length]);

  useEffect(() => {
    loadEquipments()
  }, [])

  // Reset da página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, categoryFilter, statusFilter]);

  const loadEquipments = async () => {
    try {
      setLoading(true)
      const dbEquipments = await getEquipments()
      const transformedEquipments = dbEquipments.map(transformEquipmentFromDB)
      setEquipments(transformedEquipments)
    } catch (error) {
      console.error("Erro ao carregar equipamentos:", error)
      alert("Erro ao carregar equipamentos")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value)
  }, [])

  const handleCategoryFilter = useCallback((value: string) => {
    setCategoryFilter(value)
  }, [])

  const handleStatusFilter = useCallback((value: string) => {
    setStatusFilter(value)
  }, [])

  const handleSaveEquipment = async (equipmentData: Omit<Equipment, "id"> & { id?: string }) => {
    try {
      setSaving(true);
      const dbEquipmentData = transformEquipmentToDB(equipmentData)

      if (equipmentData.id) {
        // Editar equipamento existente
        await updateEquipment(equipmentData.id, dbEquipmentData)
        toast({
          title: "Equipamento atualizado",
          description: "O equipamento foi atualizado com sucesso.",
        });
      } else {
        // Adicionar novo equipamento
        await createEquipment(dbEquipmentData)
        toast({
          title: "Equipamento adicionado",
          description: "O equipamento foi adicionado com sucesso.",
        });
      }

      await loadEquipments() // Recarregar lista
      setEditingEquipment(undefined)
      setIsFormOpen(false) // Fechar o modal
    } catch (error) {
      console.error("Erro ao salvar equipamento:", error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o equipamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  const handleEditEquipment = useCallback((equipment: Equipment) => {
    setEditingEquipment(equipment)
    setIsFormOpen(true)
  }, [])

  const handleDeleteEquipment = useCallback((id: string) => {
    setEquipmentToDelete(id)
    setDeleteDialogOpen(true)
  }, [])

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

  const getStatusBadge = useCallback((status: Equipment["status"]) => {
    switch (status) {
      case "Disponível":
        return "bg-green-100 text-green-800 border border-green-200"
      case "Alugado":
        return "bg-blue-100 text-blue-800 border border-blue-200"
      case "Manutenção":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200"
    }
  }, [])

  const statuses = ["Todos", "Disponível", "Alugado", "Manutenção"]

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader 
          title="Equipamentos" 
          description="Gerencie seu inventário de equipamentos" 
        />

        <main className="flex-1 space-y-6 p-4 sm:p-6 bg-background">
          {/* Tabela de Equipamentos */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle className="text-foreground">Lista de Equipamentos</CardTitle>
                  <CardDescription className="hidden sm:block">Todos os equipamentos cadastrados no sistema</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingEquipment(undefined)
                    setIsFormOpen(true)
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Equipamento
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-end mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar equipamentos..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todas">Todas as categorias</SelectItem>
                    {equipmentCategories
                      .filter((cat) => cat.active)
                      .map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
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
                <div className="flex items-center text-sm text-text-secondary col-span-1 sm:col-span-2 lg:col-span-1">
                  {filteredEquipments.length} equipamento(s) encontrado(s)
                </div>
              </div>
              
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <Table className="min-w-[800px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold text-gray-900 bg-gray-50">Equipamento</TableHead>
                        <TableHead className="font-semibold text-gray-900 bg-gray-50">Categoria</TableHead>
                        <TableHead className="font-semibold text-gray-900 bg-gray-50">Quantidade</TableHead>
                        <TableHead className="font-semibold text-gray-900 bg-gray-50">Status</TableHead>
                        <TableHead className="font-semibold text-gray-900 bg-gray-50">Valor/Dia</TableHead>
                        <TableHead className="font-semibold text-right text-gray-900 bg-gray-50">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                              <span className="text-text-secondary">Carregando equipamentos...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : paginatedEquipments.length === 0 && filteredEquipments.length > 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-text-secondary">
                            Nenhum equipamento encontrado na página atual.
                          </TableCell>
                        </TableRow>
                      ) : filteredEquipments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-text-secondary">
                            {searchTerm || categoryFilter !== "Todas" || statusFilter !== "Todos"
                              ? "Nenhum equipamento encontrado com os filtros aplicados."
                              : "Nenhum equipamento cadastrado ainda."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedEquipments.map((equipment: Equipment) => (
                          <TableRow key={equipment.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                  <Package className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="font-medium text-foreground">{equipment.name}</div>
                                  <div className="text-sm text-text-secondary line-clamp-1">
                                    {equipment.description || "Sem descrição"}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {equipment.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium text-foreground">
                                {equipment.quantity}x
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusBadge(equipment.status)}`}>
                                {equipment.status}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium text-foreground">
                                R$ {equipment.dailyRate.toFixed(2).replace(".", ",")}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1 flex-wrap">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditEquipment(equipment)}
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteEquipment(equipment.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
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
                            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
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

        {/* Formulário de Equipamento - Lazy loaded */}
        {isFormOpen && (
          <Suspense fallback={<LoadingSpinner />}>
            <EquipmentForm
              open={isFormOpen}
              onOpenChange={(open: boolean) => {
                setIsFormOpen(open)
                if (!open) {
                  setEditingEquipment(undefined)
                }
              }}
              equipment={editingEquipment}
              onSave={handleSaveEquipment}
              saving={saving}
            />
          </Suspense>
        )}

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este equipamento? Esta ação não pode ser desfeita.
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
