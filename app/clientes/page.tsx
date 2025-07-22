"use client"

import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react"
import { Edit, Mail, Phone, Plus, Search, Trash2, User } from "lucide-react"
import { AppSidebar } from "../../components/app-sidebar"
// Lazy load do componente pesado
const ClientForm = lazy(() => import("../../components/client-form").then(module => ({ default: module.ClientForm })))
import type { Client } from "../../components/client-form"
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

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination";

import { getClients, createClient, updateClient, deleteClient } from "../../lib/database/clients"
import { transformClientFromDB, transformClientToDB } from "../../lib/utils/data-transformers"

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

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [documentTypeFilter, setDocumentTypeFilter] = useState("Todos")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<string | null>(null)

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Debounce do termo de busca
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoização dos filtros aplicados
  const filteredClients = useMemo(() => {
    let filtered = clients;

    // Filtrar por termo de busca
    if (debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter((client: Client) =>
        client.name.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower) ||
        client.phone.toLowerCase().includes(searchLower) ||
        client.documentNumber.toLowerCase().includes(searchLower)
      );
    }

    // Filtrar por tipo de documento
    if (documentTypeFilter !== "Todos") {
      filtered = filtered.filter((client: Client) => client.documentType === documentTypeFilter);
    }

    return filtered;
  }, [clients, debouncedSearchTerm, documentTypeFilter]);

  // Memoização da paginação
  const paginatedClients = useMemo(() => {
    return filteredClients.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredClients, currentPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  }, [filteredClients.length]);

  useEffect(() => {
    loadClients()
  }, [])

  // Reset da página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, documentTypeFilter]);

  const loadClients = async () => {
    try {
      setLoading(true)
      // Carregar apenas os primeiros 50 clientes para melhor performance
      const dbClients = await getClients(50)
      const transformedClients = dbClients.map(transformClientFromDB)
      setClients(transformedClients)
    } catch (error) {
      console.error("Erro ao carregar clientes:", error)
      alert("Erro ao carregar clientes")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value)
  }, [])

  const handleDocumentTypeFilter = useCallback((value: string) => {
    setDocumentTypeFilter(value)
  }, [])

  const handleSaveClient = async (clientData: Omit<Client, "id"> & { id?: string }) => {
    try {
      const dbClientData = transformClientToDB(clientData)

      if (clientData.id) {
        // Editar cliente existente
        await updateClient(clientData.id, dbClientData)
      } else {
        // Adicionar novo cliente
        await createClient(dbClientData)
      }

      await loadClients() // Recarregar lista
      setEditingClient(undefined)
    } catch (error) {
      console.error("Erro ao salvar cliente:", error)
      alert("Erro ao salvar cliente")
    }
  }

  const handleEditClient = useCallback((client: Client) => {
    setEditingClient(client)
    setIsFormOpen(true)
  }, [])

  const handleDeleteClient = useCallback((id: string) => {
    setClientToDelete(id)
    setDeleteDialogOpen(true)
  }, [])

  const confirmDelete = async () => {
    if (clientToDelete) {
      try {
        await deleteClient(clientToDelete)
        await loadClients() // Recarregar lista
      } catch (error) {
        console.error("Erro ao deletar cliente:", error)
        alert("Erro ao deletar cliente")
      }
    }
    setDeleteDialogOpen(false)
    setClientToDelete(null)
  }

  const getDocumentTypeBadge = useCallback((type: Client["documentType"]) => {
    return type === "CPF" ? "bg-blue-100 text-blue-800 border border-blue-200" : "bg-purple-100 text-purple-800 border border-purple-200"
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate">Clientes</h1>
              <p className="text-sm text-text-secondary hidden sm:block">Gerencie sua base de clientes</p>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-4 sm:p-6 bg-background">
          {/* Tabela de Clientes */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle className="text-foreground">Lista de Clientes</CardTitle>
                  <CardDescription className="hidden sm:block">Todos os clientes cadastrados no sistema</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingClient(undefined)
                    setIsFormOpen(true)
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Cliente
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 items-end mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar clientes..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={documentTypeFilter} onValueChange={handleDocumentTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de documento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos os tipos</SelectItem>
                    <SelectItem value="CPF">CPF</SelectItem>
                    <SelectItem value="CNPJ">CNPJ</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center text-sm text-text-secondary col-span-1 sm:col-span-2 lg:col-span-1">
                  {filteredClients.length} cliente(s) encontrado(s)
                </div>
              </div>
              
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <Table className="min-w-[800px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold text-gray-900 bg-gray-50">Cliente</TableHead>
                        <TableHead className="font-semibold text-gray-900 bg-gray-50">Contato</TableHead>
                        <TableHead className="font-semibold text-gray-900 bg-gray-50">Documento</TableHead>
                        <TableHead className="font-semibold text-right text-gray-900 bg-gray-50">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8">
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                              <span className="text-text-secondary">Carregando clientes...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : paginatedClients.length === 0 && filteredClients.length > 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-text-secondary">
                            Nenhum cliente encontrado na página atual.
                          </TableCell>
                        </TableRow>
                      ) : filteredClients.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-text-secondary">
                            {searchTerm || documentTypeFilter !== "Todos"
                              ? "Nenhum cliente encontrado com os filtros aplicados."
                              : "Nenhum cliente cadastrado ainda."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedClients.map((client: Client) => (
                          <TableRow key={client.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                  <User className="h-5 w-5" />
                                </div>
                                <div className="font-medium text-foreground">{client.name}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  <span className="text-foreground">{client.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-gray-400" />
                                  <span className="text-foreground">{client.phone}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getDocumentTypeBadge(client.documentType)}`}>
                                  {client.documentType}
                                </span>
                                <div className="text-foreground">{client.documentNumber}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1 flex-wrap">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditClient(client)}
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteClient(client.id)}
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

        {/* Formulário de Cliente - Lazy loaded */}
        {isFormOpen && (
          <Suspense fallback={<LoadingSpinner />}>
            <ClientForm
              open={isFormOpen}
              onOpenChange={(open: boolean) => {
                setIsFormOpen(open)
                if (!open) {
                  setEditingClient(undefined)
                }
              }}
              client={editingClient}
              onSave={handleSaveClient}
            />
          </Suspense>
        )}

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
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