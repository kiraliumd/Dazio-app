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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Search, MapPin } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { getClients } from "../lib/database/clients"
import { getEquipments } from "../lib/database/equipments"
import { transformClientFromDB, transformEquipmentFromDB } from "../lib/utils/data-transformers"
import type { Client, Equipment } from "../lib/utils/data-transformers"

export interface RentalItem {
  id: string
  equipmentName: string
  quantity: number
  dailyRate: number
  days: number
  total: number
}

export interface Rental {
  id: string
  clientId: string
  clientName: string
  startDate: string
  endDate: string
  installationDate?: string
  removalDate?: string
  installationTime: string
  removalTime: string
  installationLocation?: string
  items: RentalItem[]
  totalValue: number
  discount: number
  finalValue: number
  status: "Instalação Pendente" | "Ativo" | "Concluído"
  observations: string
  budgetId?: string
}

interface RentalFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rental?: Rental
  onSave: (rental: Omit<Rental, "id"> & { id?: string }) => void
  budgetData?: {
    clientId: string
    clientName: string
    items: RentalItem[]
    totalValue: number
    budgetId: string
  }
  saving?: boolean
}

export function RentalForm({ open, onOpenChange, rental, onSave, budgetData, saving = false }: RentalFormProps) {
  const [formData, setFormData] = useState({
    clientId: "",
    clientName: "",
    startDate: "",
    endDate: "",
    installationTime: "08:00",
    removalTime: "18:00",
    installationLocation: "",
    items: [] as RentalItem[],
    discount: 0,
    observations: "",
  })

  const [selectedEquipment, setSelectedEquipment] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [equipmentSearch, setEquipmentSearch] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [loadingEquipments, setLoadingEquipments] = useState(false)

  // Carregar clientes e equipamentos do Supabase
  const loadData = async () => {
    try {
      setLoadingClients(true)
      setLoadingEquipments(true)

      const [clientsData, equipmentsData] = await Promise.all([getClients(), getEquipments()])

      const transformedClients = clientsData.map(transformClientFromDB)
      const transformedEquipments = equipmentsData
        .filter((eq) => eq.status === "Disponível")
        .map(transformEquipmentFromDB)

      setClients(transformedClients)
      setEquipments(transformedEquipments)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoadingClients(false)
      setLoadingEquipments(false)
    }
  }

  // Carregar dados quando o dialog abrir
  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open && !rental && !budgetData) {
      setFormData({
        clientId: "",
        clientName: "",
        startDate: "",
        endDate: "",
        installationTime: "08:00",
        removalTime: "18:00",
        installationLocation: "",
        items: [],
        discount: 0,
        observations: "",
      })
      setSelectedEquipment("")
      setQuantity(1)
      setEquipmentSearch("")
    } else if (open && rental) {
      setFormData({
        clientId: rental.clientId,
        clientName: rental.clientName,
        startDate: rental.startDate,
        endDate: rental.endDate,
        installationTime: rental.installationTime,
        removalTime: rental.removalTime,
        installationLocation: rental.installationLocation || "",
        items: rental.items,
        discount: rental.discount,
        observations: rental.observations,
      })
      setEquipmentSearch("")
    } else if (open && budgetData) {
      setFormData({
        clientId: budgetData.clientId,
        clientName: budgetData.clientName,
        startDate: "",
        endDate: "",
        installationTime: "08:00",
        removalTime: "18:00",
        installationLocation: "",
        items: budgetData.items,
        discount: 0,
        observations: "",
      })
      setEquipmentSearch("")
    }
  }, [open, rental, budgetData])

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate)
      const end = new Date(formData.endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      return diffDays
    }
    return 1
  }

  const days = calculateDays()

  // Filtrar equipamentos baseado na busca
  const filteredEquipments = equipments.filter(
    (equipment) =>
      equipment.name.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
      equipment.category?.toLowerCase().includes(equipmentSearch.toLowerCase()),
  )

  // Atualizar totais dos itens quando as datas mudarem
  useEffect(() => {
    if (formData.items.length > 0) {
      const updatedItems = formData.items.map((item) => ({
        ...item,
        days,
        total: item.quantity * item.dailyRate * days,
      }))
      setFormData((prev) => ({ ...prev, items: updatedItems }))
    }
  }, [formData.startDate, formData.endDate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.items.length === 0) {
      alert("Adicione pelo menos um equipamento ao contrato")
      return
    }

    if (!formData.clientId) {
      alert("Selecione um cliente")
      return
    }

    const totalValue = formData.items.reduce((sum, item) => sum + item.total, 0)
    const finalValue = totalValue - formData.discount

    onSave({
      ...formData,
      totalValue,
      finalValue,
      status: "Instalação Pendente",
      ...(rental && { id: rental.id }),
      ...(budgetData && { budgetId: budgetData.budgetId }),
    })
    onOpenChange(false)
  }

  const handleClientChange = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    setFormData({
      ...formData,
      clientId,
      clientName: client?.name || "",
    })
  }

  const addEquipment = () => {
    if (selectedEquipment && quantity > 0) {
      const equipment = equipments.find((e) => e.name === selectedEquipment)
      if (equipment) {
        const total = quantity * equipment.dailyRate * days
        const newItem: RentalItem = {
          id: Date.now().toString(),
          equipmentName: equipment.name,
          quantity,
          dailyRate: equipment.dailyRate,
          days,
          total,
        }

        setFormData({
          ...formData,
          items: [...formData.items, newItem],
        })

        // Reset selection
        setSelectedEquipment("")
        setQuantity(1)
      }
    }
  }

  const removeItem = (itemId: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter((item) => item.id !== itemId),
    })
  }

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    setFormData({
      ...formData,
      items: formData.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: newQuantity,
              total: newQuantity * item.dailyRate * days,
            }
          : item,
      ),
    })
  }

  const totalValue = formData.items.reduce((sum, item) => sum + item.total, 0)
  const finalValue = totalValue - formData.discount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {rental ? "Editar Contrato" : budgetData ? "Novo Contrato (Orçamento Aprovado)" : "Novo Contrato"}
          </DialogTitle>
          <DialogDescription>
            {rental
              ? "Faça as alterações necessárias no contrato."
              : budgetData
                ? "Contrato criado automaticamente a partir do orçamento aprovado."
                : "Crie um novo contrato de locação."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Informações do Cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações do Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="client">Cliente *</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={handleClientChange}
                    required
                    disabled={!!budgetData || loadingClients}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingClients ? "Carregando clientes..." : "Selecione um cliente"} />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="installationLocation">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Local de Instalação (Opcional)
                    </div>
                  </Label>
                  <Input
                    id="installationLocation"
                    value={formData.installationLocation}
                    onChange={(e) => setFormData({ ...formData, installationLocation: e.target.value })}
                    placeholder="Ex: Salão de Festas Villa Real, Rua das Flores, 123"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Período e Horários */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Período da Locação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Data de Início *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">Data de Término *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      min={formData.startDate}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="installationTime">Horário de Instalação *</Label>
                    <Input
                      id="installationTime"
                      type="time"
                      value={formData.installationTime}
                      onChange={(e) => setFormData({ ...formData, installationTime: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="removalTime">Horário de Retirada *</Label>
                    <Input
                      id="removalTime"
                      type="time"
                      value={formData.removalTime}
                      onChange={(e) => setFormData({ ...formData, removalTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {formData.startDate && formData.endDate && (
                  <div className="bg-primary/10 text-primary p-3 rounded-lg text-center">
                    <strong>{days} dia(s)</strong> de locação
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Adicionar Equipamentos - só mostrar se não veio de orçamento */}
            {!budgetData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Adicionar Equipamentos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label>Buscar Equipamento</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder="Digite o nome do equipamento ou categoria..."
                          value={equipmentSearch}
                          onChange={(e) => setEquipmentSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 grid gap-2">
                        <Label>Equipamento</Label>
                        <Select
                          value={selectedEquipment}
                          onValueChange={setSelectedEquipment}
                          disabled={loadingEquipments}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                loadingEquipments ? "Carregando equipamentos..." : "Selecione um equipamento"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredEquipments.length > 0 ? (
                              filteredEquipments.map((equipment) => (
                                <SelectItem key={equipment.id} value={equipment.name}>
                                  <div className="flex items-center justify-between w-full">
                                    <span>{equipment.name}</span>
                                    <span className="text-sm text-gray-500 ml-2">
                                      R$ {equipment.dailyRate.toFixed(2)}/dia
                                    </span>
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-results" disabled>
                                Nenhum equipamento encontrado
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {equipmentSearch && (
                          <p className="text-sm text-gray-600">
                            {filteredEquipments.length} equipamento(s) encontrado(s)
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                        />
                      </div>
                    </div>
                  </div>

                  {selectedEquipment && selectedEquipment !== "no-results" && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span>Total do item:</span>
                        <span className="font-semibold">
                          R${" "}
                          {(
                            quantity *
                            (equipments.find((e) => e.name === selectedEquipment)?.dailyRate || 0) *
                            days
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={addEquipment}
                    disabled={!selectedEquipment || selectedEquipment === "no-results"}
                    className="w-full bg-transparent"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Equipamento
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Lista de Itens */}
            {formData.items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Equipamentos Selecionados ({formData.items.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {formData.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{item.equipmentName}</p>
                          <p className="text-sm text-gray-600">
                            R$ {item.dailyRate.toFixed(2)}/dia • {item.days} dia(s)
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">Qtd:</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(item.id, Number.parseInt(e.target.value) || 1)}
                              className="w-16 h-8"
                            />
                          </div>
                          <div className="text-right min-w-0">
                            <p className="font-semibold">R$ {item.total.toFixed(2)}</p>
                          </div>
                          {!budgetData && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Cálculos */}
                    <div className="space-y-2 pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <span>Subtotal:</span>
                        <span>R$ {totalValue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <Label htmlFor="discount">Desconto (R$):</Label>
                        <Input
                          id="discount"
                          type="number"
                          step="0.01"
                          min="0"
                          max={totalValue}
                          value={formData.discount}
                          onChange={(e) =>
                            setFormData({ ...formData, discount: Number.parseFloat(e.target.value) || 0 })
                          }
                          className="w-32"
                        />
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center font-semibold text-lg">
                        <span>Total Final:</span>
                        <span className="text-primary">R$ {finalValue.toFixed(2)}</span>
                      </div>
                      {formData.discount > 0 && (
                        <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                          Economia: R$ {formData.discount.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Observações */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  placeholder="Informações adicionais sobre o contrato..."
                  rows={4}
                  className="resize-none"
                />
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90"
              disabled={formData.items.length === 0 || saving}
            >
              {saving ? "Salvando..." : rental ? "Salvar Alterações" : "Criar Contrato"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
