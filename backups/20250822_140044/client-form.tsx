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

export interface Client {
  id: string
  name: string
  phone: string
  email: string
  documentType: "CPF" | "CNPJ"
  documentNumber: string
  observations: string
}

interface ClientFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client
  onSave: (client: Omit<Client, "id"> & { id?: string }) => void
}

const documentTypes = ["CPF", "CNPJ"] as const

// Função para formatar CPF
const formatCPF = (value: string) => {
  const numbers = value.replace(/\D/g, "")
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

// Função para formatar CNPJ
const formatCNPJ = (value: string) => {
  const numbers = value.replace(/\D/g, "")
  return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
}

// Função para formatar telefone
const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, "")
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
  }
  return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
}

export function ClientForm({ open, onOpenChange, client, onSave }: ClientFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    documentType: "CPF" as "CPF" | "CNPJ",
    documentNumber: "",
    observations: "",
  })

  // Atualizar o formulário quando o cliente mudar
  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        phone: client.phone || "",
        email: client.email || "",
        documentType: client.documentType || ("CPF" as "CPF" | "CNPJ"),
        documentNumber: client.documentNumber || "",
        observations: client.observations || "",
      })
    } else {
      // Limpar o formulário quando não há cliente (novo cliente)
      setFormData({
        name: "",
        phone: "",
        email: "",
        documentType: "CPF" as "CPF" | "CNPJ",
        documentNumber: "",
        observations: "",
      })
    }
  }, [client])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      ...(client && { id: client.id }),
    })
    onOpenChange(false)
    if (!client) {
      setFormData({
        name: "",
        phone: "",
        email: "",
        documentType: "CPF" as "CPF" | "CNPJ",
        documentNumber: "",
        observations: "",
      })
    }
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value)
    setFormData({ ...formData, phone: formatted })
  }

  const handleDocumentChange = (value: string) => {
    let formatted = value
    if (formData.documentType === "CPF") {
      formatted = formatCPF(value)
    } else {
      formatted = formatCNPJ(value)
    }
    setFormData({ ...formData, documentNumber: formatted })
  }

  const handleDocumentTypeChange = (type: "CPF" | "CNPJ") => {
    setFormData({
      ...formData,
      documentType: type,
      documentNumber: "", // Limpa o número quando muda o tipo
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">{client ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          <DialogDescription>
            {client ? "Faça as alterações necessárias no cliente." : "Adicione um novo cliente ao sistema."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: João Silva Santos"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="joao@email.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="documentType">Tipo de Documento</Label>
                <Select value={formData.documentType} onValueChange={handleDocumentTypeChange} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="documentNumber">Número do Documento</Label>
                <Input
                  id="documentNumber"
                  value={formData.documentNumber}
                  onChange={(e) => handleDocumentChange(e.target.value)}
                  placeholder={formData.documentType === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
                  maxLength={formData.documentType === "CPF" ? 14 : 18}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                placeholder="Informações adicionais sobre o cliente..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {client ? "Salvar Alterações" : "Adicionar Cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
