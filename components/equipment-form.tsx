"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useEquipmentCategories } from "@/hooks/useEquipmentCategories"
import { useToast } from "@/components/ui/use-toast"

export interface Equipment {
  id: string
  name: string
  category: string
  description: string
  dailyRate: number
  quantity: number
  rentedQuantity: number
  maintenanceQuantity: number
  availableQuantity: number
  status: "Disponível" | "Alugado" | "Manutenção"
}

interface EquipmentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  equipment?: Equipment
  onSave: (equipment: Omit<Equipment, "id"> & { id?: string }) => void
  saving?: boolean
}

const statuses = ["Disponível", "Alugado", "Manutenção"] as const

export function EquipmentForm({ open, onOpenChange, equipment, onSave, saving = false }: EquipmentFormProps) {
  const { categories, loading: categoriesLoading, refreshCategories } = useEquipmentCategories();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    dailyRate: 0,
    quantity: 1,
    status: "Disponível" as "Disponível" | "Alugado" | "Manutenção",
  })

  // Resetar formulário quando abrir/fechar ou mudar equipamento
  useEffect(() => {
    if (open) {
      if (equipment) {
        setFormData({
          name: equipment.name,
          category: equipment.category,
          description: equipment.description,
          dailyRate: equipment.dailyRate,
          quantity: equipment.quantity,
          status: equipment.status,
        })
      } else {
        setFormData({
          name: "",
          category: "",
          description: "",
          dailyRate: 0,
          quantity: 1,
          status: "Disponível",
        })
      }
    }
  }, [open, equipment])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validações básicas
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "O nome do equipamento é obrigatório.",
        variant: "destructive",
      });
      return
    }

    if (categoriesLoading) {
      toast({
        title: "Aguarde",
        description: "Carregando categorias. Tente novamente em alguns segundos.",
        variant: "destructive",
      });
      return
    }

    if (categories.length === 0) {
      toast({
        title: "Nenhuma categoria disponível",
        description: "Cadastre categorias de equipamentos primeiro nas configurações.",
        variant: "destructive",
      });
      return
    }

    if (!formData.category) {
      toast({
        title: "Categoria obrigatória",
        description: "Selecione uma categoria para o equipamento.",
        variant: "destructive",
      });
      return
    }

    if (formData.dailyRate <= 0) {
      toast({
        title: "Valor inválido",
        description: "O valor da diária deve ser maior que zero.",
        variant: "destructive",
      });
      return
    }

    if (formData.quantity <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "A quantidade deve ser maior que zero.",
        variant: "destructive",
      });
      return
    }

    onSave({
      ...formData,
      name: formData.name.trim(),
      description: formData.description.trim(),
      rentedQuantity: 0,
      maintenanceQuantity: 0,
      availableQuantity: formData.quantity,
      ...(equipment && { id: equipment.id }),
    })
  }

  const handleClose = () => {
    if (!saving) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">{equipment ? "Editar Equipamento" : "Novo Equipamento"}</DialogTitle>
          <DialogDescription>
            {equipment ? "Faça as alterações necessárias no equipamento." : "Adicione um novo equipamento ao catálogo."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Mesa de Som Yamaha"
                required
                disabled={saving}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                required
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesLoading ? (
                    <SelectItem value="" disabled>
                      Carregando categorias...
                    </SelectItem>
                  ) : categories.length === 0 ? (
                    <SelectItem value="" disabled>
                      Nenhuma categoria disponível
                    </SelectItem>
                  ) : (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva as características do equipamento..."
                rows={3}
                disabled={saving}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dailyRate">Valor da Diária (R$) *</Label>
              <Input
                id="dailyRate"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.dailyRate || ""}
                onChange={(e) => setFormData({ ...formData, dailyRate: Number.parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
                required
                disabled={saving}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantidade Disponível *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity || ""}
                onChange={(e) => setFormData({ ...formData, quantity: Number.parseInt(e.target.value) || 1 })}
                placeholder="1"
                required
                disabled={saving}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as typeof formData.status })}
                required
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {equipment ? "Salvando..." : "Adicionando..."}
                </>
              ) : (
                <>
                  {equipment ? "Salvar Alterações" : "Adicionar Equipamento"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
