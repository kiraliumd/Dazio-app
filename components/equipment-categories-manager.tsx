'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  createEquipmentCategory,
  deleteEquipmentCategory,
  getEquipmentCategories,
  updateEquipmentCategory,
  type CreateEquipmentCategory,
  type EquipmentCategory,
} from '@/lib/database/equipment-categories';
import { Edit, Palette, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface EquipmentCategoriesManagerProps {
  onCategoriesChange?: () => void;
  headerOnly?: boolean;
}

const ITEMS_PER_PAGE = 10;

export function EquipmentCategoriesManager({
  onCategoriesChange,
  headerOnly = false,
}: EquipmentCategoriesManagerProps) {
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCategories, setFilteredCategories] = useState<
    EquipmentCategory[]
  >([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<EquipmentCategory | null>(null);
  const [formData, setFormData] = useState<
    CreateEquipmentCategory & { isActive?: boolean }
  >({
    name: '',
    description: '',
    isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] =
    useState<EquipmentCategory | null>(null);
  const { toast } = useToast();

  // Carregar categorias
  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getEquipmentCategories();
      setCategories(data);
      setFilteredCategories(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast({
        title: 'Erro ao carregar categorias',
        description: 'Não foi possível carregar as categorias de equipamentos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Filtrar categorias
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(
        category =>
          category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (category.description &&
            category.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      );
      setFilteredCategories(filtered);
    }
    setCurrentPage(1); // Reset para primeira página quando filtrar
  }, [searchTerm, categories]);

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true,
    });
    setEditingCategory(null);
  };

  // Abrir diálogo para criar/editar
  const openDialog = (category?: EquipmentCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        isActive: category.isActive,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  // Salvar categoria
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'O nome da categoria é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);

      if (editingCategory) {
        await updateEquipmentCategory(editingCategory.id, {
          name: formData.name,
          description: formData.description,
          isActive: formData.isActive,
        });
        toast({
          title: 'Categoria atualizada',
          description: 'A categoria foi atualizada com sucesso.',
        });
      } else {
        await createEquipmentCategory({
          name: formData.name,
          description: formData.description,
        });
        toast({
          title: 'Categoria criada',
          description: 'A categoria foi criada com sucesso.',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      await loadCategories();
      onCategoriesChange?.();
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar a categoria.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Deletar categoria
  const handleDelete = (category: EquipmentCategory) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteEquipmentCategory(categoryToDelete.id);
      toast({
        title: 'Categoria deletada',
        description: 'A categoria foi deletada com sucesso.',
      });
      await loadCategories();
      onCategoriesChange?.();
    } catch (error: any) {
      console.error('Erro ao deletar categoria:', error);
      toast({
        title: 'Erro ao deletar',
        description: error.message || 'Não foi possível deletar a categoria.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  // Paginação
  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Se headerOnly for true, renderizar apenas o botão
  if (headerOnly) {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Altere as informações da categoria de equipamentos.'
                : 'Crie uma nova categoria para organizar seus equipamentos.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Categoria *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Som e Áudio"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descreva os tipos de equipamentos desta categoria"
                rows={3}
              />
            </div>
            {editingCategory && (
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Status da Categoria</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={checked =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving
                ? 'Salvando...'
                : editingCategory
                  ? 'Atualizar'
                  : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="grid gap-4 md:grid-cols-2 items-end">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar categorias..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center text-sm text-text-secondary">
          {filteredCategories.length} categoria(s) encontrada(s)
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold text-gray-900 bg-gray-50">
                Categoria
              </TableHead>
              <TableHead className="font-semibold text-gray-900 bg-gray-50">
                Descrição
              </TableHead>
              <TableHead className="font-semibold text-gray-900 bg-gray-50">
                Status
              </TableHead>
              <TableHead className="font-semibold text-right text-gray-900 bg-gray-50">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-text-secondary">
                      Carregando categorias...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedCategories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-text-secondary"
                >
                  {searchTerm
                    ? 'Nenhuma categoria encontrada com os filtros aplicados.'
                    : 'Nenhuma categoria cadastrada ainda.'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedCategories.map(category => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Palette className="h-5 w-5" />
                      </div>
                      <div className="font-medium text-foreground">
                        {category.name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-text-secondary">
                      {category.description || 'Sem descrição'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        category.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }
                    >
                      {category.isActive ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog(category)}
                        className="border-slate-200 text-slate-700 hover:bg-slate-50"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(category)}
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
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

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    handlePageChange(currentPage - 1);
                  }}
                  className={
                    currentPage === 1 ? 'pointer-events-none text-gray-400' : ''
                  }
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    onClick={e => {
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
                  onClick={e => {
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

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria &quot;
              {categoryToDelete?.name}&quot;? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
