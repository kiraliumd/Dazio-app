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
import { TransactionCategory, CreateCategoryData, UpdateCategoryData, TRANSACTION_TYPES } from "@/lib/types/financial"

interface CategoryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: TransactionCategory
  onSave: (category: CreateCategoryData | UpdateCategoryData) => void
  saving?: boolean
}

export function CategoryForm({ open, onOpenChange, category, onSave, saving = false }: CategoryFormProps) {
  const [formData, setFormData] = useState<CreateCategoryData>({
    name: "",
    transaction_type: "Receita",
    description: "",
  })

  // Atualizar o formulário quando a categoria mudar
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        transaction_type: category.transaction_type || "Receita",
        description: category.description || "",
      })
    } else {
      // Limpar o formulário quando não há categoria (nova categoria)
      setFormData({
        name: "",
        transaction_type: "Receita",
        description: "",
      })
    }
  }, [category])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onOpenChange(false)
    if (!category) {
      setFormData({
        name: "",
        transaction_type: "Receita",
        description: "",
      })
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {category ? "Editar Categoria" : "Nova Categoria"}
          </DialogTitle>
          <DialogDescription>
            {category 
              ? "Faça as alterações necessárias na categoria." 
              : "Adicione uma nova categoria de transação."
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Categoria *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Receita de Locação"
                required
                disabled={saving}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="transaction_type">Tipo de Transação *</Label>
              <Select 
                value={formData.transaction_type} 
                onValueChange={(value) => setFormData({ ...formData, transaction_type: value as any })}
                required
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de transação" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição detalhada da categoria..."
                rows={3}
                disabled={saving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={saving}>
              {saving ? "Salvando..." : (category ? "Salvar Alterações" : "Adicionar Categoria")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 