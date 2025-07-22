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
import { Account, CreateAccountData, UpdateAccountData, ACCOUNT_TYPES } from "@/lib/types/financial"

interface AccountFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account?: Account
  onSave: (account: CreateAccountData | UpdateAccountData) => void
  saving?: boolean
}

export function AccountForm({ open, onOpenChange, account, onSave, saving = false }: AccountFormProps) {
  const [formData, setFormData] = useState<CreateAccountData>({
    name: "",
    type: "",
    account_type: "Caixa",
    current_balance: 0,
    bank_name: "",
    agency: "",
    account_number: "",
    description: "",
  })

  // Atualizar o formulário quando a conta mudar
  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name || "",
        type: account.type || "",
        account_type: account.account_type || "Caixa",
        current_balance: account.current_balance || 0,
        bank_name: account.bank_name || "",
        agency: account.agency || "",
        account_number: account.account_number || "",
        description: account.description || "",
      })
    } else {
      // Limpar o formulário quando não há conta (nova conta)
      setFormData({
        name: "",
        type: "",
        account_type: "Caixa",
        current_balance: 0,
        bank_name: "",
        agency: "",
        account_number: "",
        description: "",
      })
    }
  }, [account])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onOpenChange(false)
    if (!account) {
      setFormData({
        name: "",
        type: "",
        account_type: "Caixa",
        current_balance: 0,
        bank_name: "",
        agency: "",
        account_number: "",
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
            {account ? "Editar Conta" : "Nova Conta"}
          </DialogTitle>
          <DialogDescription>
            {account 
              ? "Faça as alterações necessárias na conta." 
              : "Adicione uma nova conta ao sistema."
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Conta *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Conta Principal"
                required
                disabled={saving}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="account_type">Tipo de Conta *</Label>
              <Select 
                value={formData.account_type} 
                onValueChange={(value) => setFormData({ ...formData, account_type: value as any })}
                required
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de conta" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="current_balance">Saldo Inicial *</Label>
              <Input
                id="current_balance"
                type="number"
                step="0.01"
                value={formData.current_balance}
                onChange={(e) => setFormData({ ...formData, current_balance: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
                required
                disabled={saving}
              />
            </div>

            {formData.account_type === "Conta Corrente" && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="bank_name">Nome do Banco</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    placeholder="Ex: Banco do Brasil"
                    disabled={saving}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="agency">Agência</Label>
                    <Input
                      id="agency"
                      value={formData.agency}
                      onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                      placeholder="Ex: 0001"
                      disabled={saving}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="account_number">Número da Conta</Label>
                    <Input
                      id="account_number"
                      value={formData.account_number}
                      onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                      placeholder="Ex: 12345-6"
                      disabled={saving}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Informações adicionais sobre a conta..."
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
              {saving ? "Salvando..." : (account ? "Salvar Alterações" : "Adicionar Conta")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 