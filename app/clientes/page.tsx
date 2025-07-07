"use client"

import { useState, useEffect } from "react"
import { Edit, Mail, Phone, Plus, Search, Trash2, User } from "lucide-react"
import { AppSidebar } from "../../components/app-sidebar"
import { ClientForm, type Client } from "../../components/client-form"
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

import { getClients, createClient, updateClient, deleteClient, searchClients } from "../../lib/database/clients"
import { transformClientFromDB, transformClientToDB } from "../../lib/utils/data-transformers"

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [documentTypeFilter, setDocumentTypeFilter] = useState("Todos")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      setLoading(true)
      // Carregar apenas os primeiros 50 clientes para melhor performance
      const dbClients = await getClients(50)
      const transformedClients = dbClients.map(transformClientFromDB)
      setClients(transformedClients)
      setFilteredClients(transformedClients) // Initialize filteredClients here
      setCurrentPage(1); // Reset to first page on new load
    } catch (error) {
      console.error("Erro ao carregar clientes:", error)
      alert("Erro ao carregar clientes")
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = async () => {
    try {
      const dbClients = await searchClients(searchTerm, documentTypeFilter)
      const transformedClients = dbClients.map(transformClientFromDB)
      setFilteredClients(transformedClients)
      setCurrentPage(1); // Reset to first page on new search
    } catch (error) {
      console.error("Erro ao filtrar clientes:", error)
      setFilteredClients(clients) // Fallback to all clients on filter error
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
  }

  const handleDocumentTypeFilter = (value: string) => {
    setDocumentTypeFilter(value)
  }

  // Aplicar filtros sempre que searchTerm ou documentTypeFilter mudarem
  useEffect(() => {
    applyFilters()
  }, [searchTerm, documentTypeFilter, clients])

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

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setIsFormOpen(true)
  }

  const handleDeleteClient = (id: string) => {
    setClientToDelete(id)
    setDeleteDialogOpen(true)
  }

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

  const getDocumentTypeBadge = (type: Client["documentType"]) => {
    return type === "CPF" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
  }

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const paginatedClients = filteredClients.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
              <h1 className="text-lg font-semibold text-foreground">Clientes</h1>
              <p className="text-sm text-gray-600">Gerencie sua base de clientes</p>
            </div>
            <Button
              onClick={() => {
                setEditingClient(undefined)
                setIsFormOpen(true)
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6 bg-gray-50">
          {/* Busca */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Buscar Clientes</CardTitle>
              <CardDescription>Encontre clientes por nome, e-mail, telefone ou documento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 items-end">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar clientes..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
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
                <div className="flex items-center text-sm text-gray-600">
                  {filteredClients.length} cliente(s) encontrado(s)
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Clientes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Lista de Clientes</CardTitle>
              <CardDescription>Todos os clientes cadastrados no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Nome</TableHead>
                      <TableHead className="font-semibold">Contato</TableHead>
                      <TableHead className="font-semibold">Documento</TableHead>
                      <TableHead className="font-semibold text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClients.length === 0 && filteredClients.length > 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                          Nenhum cliente encontrado na página atual.
                        </TableCell>
                      </TableRow>
                    ) : filteredClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                          {searchTerm || documentTypeFilter !== "Todos"
                            ? "Nenhum cliente encontrado com os termos de busca."
                            : "Nenhum cliente cadastrado ainda."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <User className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-medium text-foreground">{client.name}</div>
                                {client.observations && (
                                  <div className="text-sm text-gray-600 max-w-xs truncate">{client.observations}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span>{client.phone}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span className="text-blue-600 hover:underline">
                                  <a href={`mailto:${client.email}`}>{client.email}</a>
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getDocumentTypeBadge(client.documentType)}`}
                              >
                                {client.documentType}
                              </span>
                              <div className="text-sm font-mono text-gray-700">{client.documentNumber}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditClient(client)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClient(client.id)}
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

        {/* Formulário de Cliente */}
        <ClientForm open={isFormOpen} onOpenChange={setIsFormOpen} client={editingClient} onSave={handleSaveClient} />

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita e pode afetar locações
                relacionadas.
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