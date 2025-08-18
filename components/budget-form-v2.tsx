"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Plus,
  Trash2,
  Calculator,
  ChevronLeft,
  ChevronRight,
  User,
  Package,
  FileText,
  Search,
  MapPin,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { getClients } from "../lib/database/clients"
import { getEquipments } from "../lib/database/equipments"
import { transformClientFromDB, transformEquipmentFromDB } from "../lib/utils/data-transformers"
import type { RecurrenceType } from "../lib/utils/data-transformers"

export interface BudgetItem {
  id: string
  equipmentName: string
  quantity: number
  dailyRate: number
  days: number
  total: number
}

export interface Budget {
  id: string
  number: string
  clientId: string
  clientName: string
  createdAt: string
  startDate: string
  endDate: string
  installationLocation?: string
  items: BudgetItem[]
  subtotal: number
  discount: number
  totalValue: number
  status: "Pendente" | "Aprovado" | "Rejeitado"
  observations: string
  recurrenceType?: RecurrenceType
  recurrenceInterval?: number
  recurrenceEndDate?: string
}

interface BudgetFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  budget?: Budget
  onSave: (budget: Omit<Budget, "id" | "number" | "createdAt"> & { id?: string }) => void
}

const steps = [
  { id: 1, title: "Dados Básicos", icon: User, description: "Cliente, recorrência e período" },
  { id: 2, title: "Equipamentos", icon: Package, description: "Selecionar itens" },
  { id: 3, title: "Finalização", icon: FileText, description: "Resumo e observações" },
]

export function BudgetFormV2({ open, onOpenChange, budget, onSave }: BudgetFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Verificar se o orçamento está aprovado e não pode ser editado
  const isApprovedBudget = budget?.status === "Aprovado"

  // Função para formatar datas
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return ""
      
      // Se já estiver no formato YYYY-MM-DD, converter para pt-BR
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        return date.toLocaleDateString("pt-BR")
      }
      
      // Se for timestamp UTC, converter para timezone local
      if (dateString.includes('T') && dateString.includes('+')) {
        const utcDate = new Date(dateString)
        if (isNaN(utcDate.getTime())) {
          throw new Error("Data inválida")
        }
        return utcDate.toLocaleDateString("pt-BR")
      }
      
      // Para outros formatos, tentar conversão simples
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        throw new Error("Data inválida")
      }
      return date.toLocaleDateString("pt-BR")
    } catch (error) {
      return dateString
    }
  }

  // Função para converter timestamp UTC para formato de input date
  const formatDateForInput = (dateString: string): string => {
    try {
      if (!dateString) return ""
      
      // Se já estiver no formato YYYY-MM-DD, usar diretamente
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString
      }
      
      // Se for timestamp UTC, converter para timezone local
      if (dateString.includes('T') && dateString.includes('+')) {
        const utcDate = new Date(dateString)
        if (isNaN(utcDate.getTime())) {
          throw new Error("Data inválida")
        }
        
        // Converter para timezone local e formatar como YYYY-MM-DD
        const year = utcDate.getFullYear()
        const month = String(utcDate.getMonth() + 1).padStart(2, '0')
        const day = String(utcDate.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      
      // Para outros formatos, tentar conversão simples
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        throw new Error("Data inválida")
      }
      
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    } catch (error) {
      return ""
    }
  }
  const [formData, setFormData] = useState({
    clientId: "",
    clientName: "",
    startDate: "",
    endDate: "",
    installationLocation: "",
    items: [] as BudgetItem[],
    discount: 0,
    observations: "",
    // Campos de recorrência
    isRecurring: false,
    recurrenceType: "weekly" as RecurrenceType,
    recurrenceInterval: 1,
    recurrenceEndDate: "",
  })

  // Estado separado para o input de intervalo (permite valores vazios)
  const [intervalInputValue, setIntervalInputValue] = useState("1")

  const [selectedEquipment, setSelectedEquipment] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [equipmentSearch, setEquipmentSearch] = useState("")

  // Estados para dados do Supabase
  const [clients, setClients] = useState<any[]>([])
  const [equipments, setEquipments] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  const loadData = async () => {
    try {
      setLoadingData(true)
      const [dbClients, dbEquipments] = await Promise.all([getClients(), getEquipments()])

      const transformedClients = dbClients.map(transformClientFromDB)
      const transformedEquipments = dbEquipments
        .map(transformEquipmentFromDB)
        .filter((eq) => eq.status === "Disponível")

      setClients(transformedClients)
      setEquipments(transformedEquipments)
    } catch (error) {
      alert("Erro ao carregar dados. Tente novamente.")
    } finally {
      setLoadingData(false)
    }
  }

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open && !budget) {
      // Abrindo formulário para novo orçamento
      setCurrentStep(1)
      setIsSubmitting(false)
      setFormData({
        clientId: "",
        clientName: "",
        startDate: "",
        endDate: "",
        installationLocation: "",
        items: [],
        discount: 0,
        observations: "",
        // Campos de recorrência
        isRecurring: false,
        recurrenceType: "weekly",
        recurrenceInterval: 1,
        recurrenceEndDate: "",
      })
      setIntervalInputValue("1")
      setSelectedEquipment("")
      setQuantity(1)
      setEquipmentSearch("")
    } else if (open && budget) {
      // Abrindo formulário para editar orçamento
      setCurrentStep(1)
      setIsSubmitting(false)
      setFormData({
        clientId: budget.clientId,
        clientName: budget.clientName,
        startDate: formatDateForInput(budget.startDate),
        endDate: formatDateForInput(budget.endDate),
        installationLocation: budget.installationLocation || "",
        items: budget.items,
        discount: budget.discount,
        observations: budget.observations,
        // Campos de recorrência
        isRecurring: budget.recurrenceType ? true : false,
        recurrenceType: budget.recurrenceType || "weekly",
        recurrenceInterval: budget.recurrenceInterval || 1,
        recurrenceEndDate: budget.recurrenceEndDate || "",
      })
      setIntervalInputValue((budget.recurrenceInterval || 1).toString())
      setEquipmentSearch("")
    }
    // Não resetar quando o modal está fechando (open = false)
  }, [open, budget])

  // Calcular dias reais da locação (para exibição)
  const calculateRealDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate)
      const end = new Date(formData.endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      return diffDays
    }
    return 1
  }

  // Calcular dias para faturamento (máximo 30 dias)
  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate)
      const end = new Date(formData.endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      // Para faturamento, sempre usar máximo de 30 dias
      return Math.min(diffDays, 30)
    }
    return 1
  }

  // Filtrar equipamentos baseado na busca
  const filteredEquipments = equipments.filter(
    (equipment) =>
      equipment.name.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
      equipment.category?.toLowerCase().includes(equipmentSearch.toLowerCase()),
  )

  const days = calculateDays()

  // Calcular valores
  const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0)
  const totalValue = subtotal - formData.discount

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

  // Calcular automaticamente data de término e renovação para recorrências
  useEffect(() => {
    if (formData.isRecurring && formData.startDate && formData.recurrenceType && formData.recurrenceInterval > 0) {
      try {
        const startDate = new Date(formData.startDate + 'T00:00:00')
        
        if (isNaN(startDate.getTime())) {
          console.error("Data de início inválida:", formData.startDate)
          return
        }
        
        // Calcular data de término baseada na duração
        let endDate = new Date(startDate)
        switch (formData.recurrenceType) {
          case "weekly":
            endDate.setDate(startDate.getDate() + (formData.recurrenceInterval * 7))
            break
          case "monthly":
            endDate.setMonth(startDate.getMonth() + formData.recurrenceInterval)
            break
          case "yearly":
            endDate.setFullYear(startDate.getFullYear() + formData.recurrenceInterval)
            break
        }
        
        // Calcular data de renovação (30 dias após início para mensal, etc.)
        let renewalDate = new Date(startDate)
        switch (formData.recurrenceType) {
          case "weekly":
            renewalDate.setDate(startDate.getDate() + 7)
            break
          case "monthly":
            renewalDate.setDate(startDate.getDate() + 30)
            break
          case "yearly":
            renewalDate.setDate(startDate.getDate() + 365)
            break
        }
        
        // Formatar datas para YYYY-MM-DD
        const formatDateForInput = (date: Date) => {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }
        
        const newEndDate = formatDateForInput(endDate)
        const newRenewalDate = formatDateForInput(renewalDate)
        
        setFormData(prev => ({
          ...prev,
          endDate: newEndDate,
          recurrenceEndDate: newRenewalDate
        }))
      } catch (error) {
        console.error("Erro ao calcular datas de recorrência:", error)
      }
    }
  }, [formData.isRecurring, formData.startDate, formData.recurrenceType, formData.recurrenceInterval])



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
        const newItem: BudgetItem = {
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

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceedToNextStep = () => {
    if (currentStep === 1) {
      const hasBasicData = formData.clientId && formData.startDate && formData.endDate
      
      // Validar se as datas são válidas
      const isStartDateValid = formData.startDate && /^\d{4}-\d{2}-\d{2}$/.test(formData.startDate)
      const isEndDateValid = formData.endDate && /^\d{4}-\d{2}-\d{2}$/.test(formData.endDate)
      
      // Se for recorrente, verificar se tem tipo e duração (datas são calculadas automaticamente)
      if (formData.isRecurring) {
        return hasBasicData && 
               isStartDateValid && 
               isEndDateValid &&
               formData.recurrenceType && 
               formData.recurrenceInterval > 0
      }
      
      return hasBasicData && isStartDateValid && isEndDateValid
    }
    if (currentStep === 2) {
      return formData.items.length > 0
    }
    return true
  }

  const handleSaveBudget = async () => {
    if (!canProceedToNextStep()) {
      alert("Por favor, preencha todos os campos obrigatórios.")
      return
    }

    setIsSubmitting(true)

    try {
      const totalValue = formData.items.reduce((sum, item) => sum + item.total, 0)
      const finalValue = totalValue - formData.discount

      const budgetData = {
        ...formData,
        subtotal: totalValue,
        totalValue: finalValue,
        status: "Pendente" as const,
        // Campos de recorrência
        recurrenceType: formData.isRecurring ? formData.recurrenceType : "weekly",
        recurrenceInterval: formData.isRecurring ? formData.recurrenceInterval : 1,
        recurrenceEndDate: formData.isRecurring ? formData.recurrenceEndDate : undefined,
      }

      await onSave(budgetData)
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao salvar orçamento:", error)
      alert("Erro ao salvar orçamento. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepIndicator = () => (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between w-full overflow-x-auto pb-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-shrink-0">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                currentStep >= step.id
                  ? "bg-primary border-primary text-primary-foreground shadow-md"
                  : "border-gray-300 text-gray-400 bg-white"
              }`}
            >
              <step.icon className="h-5 w-5" />
            </div>
            <div className="ml-3 mr-6 min-w-0">
              <p className={`text-sm font-semibold truncate ${currentStep >= step.id ? "text-primary" : "text-gray-500"}`}>
                {step.title}
              </p>
              <p className="text-xs text-gray-500 truncate max-w-[120px]">{step.description}</p>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 transition-all duration-200 ${
                currentStep > step.id ? "bg-primary" : "bg-gray-200"
              } mr-6`} />
            )}
          </div>
        ))}
      </div>
      
      {/* Indicador de progresso */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${(currentStep / steps.length) * 100}%` }}
        />
      </div>
      
      {/* Indicador de etapa atual */}
      <div className="text-center mt-3">
        <span className="text-sm font-medium text-primary">
          Etapa {currentStep} de {steps.length}
        </span>
      </div>
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Informações do Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="client">Cliente *</Label>
            <Select value={formData.clientId} onValueChange={handleClientChange} disabled={loadingData || isApprovedBudget}>
              <SelectTrigger>
                <SelectValue placeholder={loadingData ? "Carregando clientes..." : "Selecione o cliente"} />
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
              disabled={isApprovedBudget}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Configuração de Recorrência</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isRecurring"
              checked={formData.isRecurring}
              onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
              className="mr-2 h-4 w-4 text-primary focus:ring-primary"
              disabled={isApprovedBudget}
            />
            <Label htmlFor="isRecurring" className="text-sm">
              Orçamento recorrente
            </Label>
          </div>

          {formData.isRecurring && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="recurrenceType">Tipo de Recorrência *</Label>
                  <Select
                    value={formData.recurrenceType}
                    onValueChange={(value) => setFormData({ ...formData, recurrenceType: value as RecurrenceType })}
                    disabled={isApprovedBudget}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de recorrência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="recurrenceInterval">Duração *</Label>
                  <Input
                    type="number"
                    min="1"
                    max="99"
                    value={intervalInputValue}
                    disabled={isApprovedBudget}
                    onChange={(e) => {
                      const inputValue = e.target.value
                      setIntervalInputValue(inputValue)
                      
                      // Atualizar o formData apenas se o valor for válido
                      const value = parseInt(inputValue)
                      if (!isNaN(value) && value > 0) {
                        setFormData(prev => ({ ...prev, recurrenceInterval: value }))
                      }
                    }}
                    onBlur={() => {
                      // Quando sair do campo, garantir que tenha um valor válido
                      const value = parseInt(intervalInputValue) || 1
                      setIntervalInputValue(value.toString())
                      setFormData(prev => ({ ...prev, recurrenceInterval: value }))
                    }}
                    placeholder="Ex: 1, 3, 6, 12"
                  />
                  <p className="text-xs text-gray-600">
                    {formData.recurrenceType === "weekly" && "Duração em semanas (ex: 1 = 1 semana, 4 = 1 mês)"}
                    {formData.recurrenceType === "monthly" && "Duração em meses (ex: 1 = 1 mês, 3 = 3 meses, 6 = 6 meses)"}
                    {formData.recurrenceType === "yearly" && "Duração em anos (ex: 1 = 1 ano, 2 = 2 anos)"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Data de Início *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    disabled={isApprovedBudget}
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
                    readOnly
                  />
                </div>
              </div>

              {formData.startDate && formData.recurrenceType && formData.recurrenceInterval > 0 && (
                <div className="bg-blue-50 text-blue-700 p-4 rounded-lg border border-blue-200">
                  <strong>Resumo da Locação Recorrente:</strong>
                  <br />
                  <span className="text-sm">
                    Início: {formatDate(formData.startDate)} | 
                    Término: {formData.endDate ? formatDate(formData.endDate) : "Calculando..."} | 
                    Duração: {formData.recurrenceInterval} 
                    {formData.recurrenceType === "weekly" ? " semana(s)" : 
                     formData.recurrenceType === "monthly" ? " mês(es)" : 
                     formData.recurrenceType === "yearly" ? " ano(s)" : ""}
                  </span>
                  <br />
                  <span className="text-xs text-blue-600">
                    Período real: {calculateRealDays()} dia(s) | 
                    Faturamento: {calculateDays()} dia(s) (máx. 30) | 
                    Renovação: {formData.recurrenceEndDate ? formatDate(formData.recurrenceEndDate) : "Calculando..."}
                  </span>
                  {!formData.endDate && (
                    <div className="text-xs text-orange-600 mt-1">
                      ⚠️ Aguardando cálculo automático da data de término...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {!formData.isRecurring && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Período da Locação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Data de Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
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
                  disabled={isApprovedBudget}
                />
              </div>
            </div>

            {formData.startDate && formData.endDate && (
              <div className="bg-primary/10 text-primary p-4 rounded-lg border border-primary/20">
                <strong>{calculateRealDays()} dia(s)</strong> de locação
                {calculateRealDays() > 30 && (
                  <div className="text-xs text-gray-600 mt-1">
                    Faturamento: {calculateDays()} dia(s) (máximo 30 dias)
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Adicionar Equipamentos</CardTitle>
          {calculateRealDays() > 30 && (
            <p className="text-sm text-gray-600">
              ⚠️ Período de {calculateRealDays()} dias detectado. O faturamento será limitado a 30 dias conforme política da empresa.
            </p>
          )}
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
                  disabled={loadingData || isApprovedBudget}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 grid gap-2">
                <Label>Equipamento</Label>
                <Select value={selectedEquipment} onValueChange={setSelectedEquipment} disabled={loadingData || isApprovedBudget}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={loadingData ? "Carregando equipamentos..." : "Selecione um equipamento"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEquipments.length > 0 ? (
                      filteredEquipments.map((equipment) => (
                        <SelectItem key={equipment.id} value={equipment.name}>
                          <div className="flex items-center justify-between w-full">
                            <span>{equipment.name}</span>
                            <span className="text-sm text-gray-500 ml-2">R$ {equipment.dailyRate.toFixed(2)}/dia</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-results" disabled>
                        {loadingData ? "Carregando..." : "Nenhum equipamento encontrado"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {equipmentSearch && !loadingData && (
                  <p className="text-sm text-gray-600">{filteredEquipments.length} equipamento(s) encontrado(s)</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                  disabled={isApprovedBudget}
                />
              </div>
            </div>
          </div>

          {selectedEquipment && selectedEquipment !== "no-results" && (
            <div className="space-y-3">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center">
                  <span>Total do item:</span>
                  <span className="font-semibold">
                    R${" "}
                    {(quantity * (equipments.find((e) => e.name === selectedEquipment)?.dailyRate || 0) * days).toFixed(
                      2,
                    )}
                  </span>
                </div>
                {calculateRealDays() > 30 && (
                  <div className="text-xs text-gray-600 mt-1">
                    Baseado em {days} dias de faturamento (máximo 30 dias)
                  </div>
                )}
              </div>

              {(() => {
                const equipment = equipments.find((e) => e.name === selectedEquipment)
                return equipment ? (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Package className="h-4 w-4" />
                      <span className="font-medium">{equipment.name}</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      Categoria: {equipment.category || "Não especificada"} • R$ {equipment.dailyRate.toFixed(2)} por
                      dia
                    </p>
                  </div>
                ) : null
              })()}
            </div>
          )}

          <Button
            type="button"
            onClick={addEquipment}
            disabled={!selectedEquipment || selectedEquipment === "no-results" || loadingData || isApprovedBudget}
            className="w-full bg-transparent"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Equipamento
          </Button>
        </CardContent>
      </Card>

      {formData.items.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Equipamentos Selecionados ({formData.items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {formData.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.equipmentName}</p>
                    <p className="text-sm text-gray-600">
                      R$ {item.dailyRate.toFixed(2)}/dia • {item.days} dia(s)
                      {calculateRealDays() > 30 && (
                        <span className="text-xs text-gray-500 ml-1">
                          (faturamento)
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Qtd:</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItemQuantity(item.id, Number.parseInt(e.target.value) || 1)}
                        className="w-20 h-8"
                      />
                    </div>
                    <div className="text-right min-w-0">
                      <p className="font-semibold">R$ {item.total.toFixed(2)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Resumo do Orçamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="font-medium">Cliente:</span>
                <span className="text-right max-w-xs text-sm font-medium">{formData.clientName}</span>
              </div>

              {formData.installationLocation && (
                <div className="flex justify-between items-start">
                  <span className="font-medium">Local:</span>
                  <span className="text-right max-w-xs text-sm">{formData.installationLocation}</span>
                </div>
              )}

              <div className="flex justify-between items-start">
                <span className="font-medium">Período:</span>
                <span className="text-right max-w-xs text-sm">
                  {formData.startDate && formData.endDate
                    ? `${formatDate(formData.startDate)} - ${formatDate(formData.endDate)}`
                    : "Datas não definidas"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium">Duração:</span>
                <span className="font-medium">{calculateRealDays()} dia(s)</span>
              </div>
            </div>

            <div className="space-y-3">
              {formData.isRecurring && (
                <div className="flex justify-between items-start">
                  <span className="font-medium">Recorrência:</span>
                  <span className="text-right text-sm max-w-xs">
                    {formData.recurrenceType === "weekly" ? "Semanal" : 
                     formData.recurrenceType === "monthly" ? "Mensal" : 
                     formData.recurrenceType === "yearly" ? "Anual" : "Nenhum"} 
                    - Duração: {formData.recurrenceInterval} 
                    {formData.recurrenceType === "weekly" ? " semana(s)" : 
                     formData.recurrenceType === "monthly" ? " mês(es)" : 
                     formData.recurrenceType === "yearly" ? " ano(s)" : ""}
                  </span>
                </div>
              )}

              {formData.isRecurring && formData.recurrenceEndDate && (
                <div className="flex justify-between items-start">
                  <span className="font-medium">Próxima Renovação:</span>
                  <span className="text-right text-sm font-medium">
                    {formatDate(formData.recurrenceEndDate)}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="font-medium">Equipamentos:</span>
                <span className="font-medium">{formData.items.length} item(s)</span>
              </div>

              {calculateRealDays() > 30 && (
                <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                  ⚠️ Faturamento limitado a {calculateDays()} dias (máximo 30)
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Itens do Orçamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {formData.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.equipmentName}</p>
                  <p className="text-gray-600 text-sm">
                    {item.quantity}x • {item.days} dia(s)
                    {calculateRealDays() > 30 && (
                      <span className="text-xs text-gray-500 ml-1">
                        (faturamento)
                      </span>
                    )}
                  </p>
                </div>
                <span className="font-medium ml-4">R$ {item.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Valores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-lg">Subtotal:</span>
              <span className="text-lg font-medium">R$ {formData.items.reduce((sum, item) => sum + item.total, 0).toFixed(2)}</span>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="discount">Desconto (R$)</Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                min="0"
                max={formData.items.reduce((sum, item) => sum + item.total, 0)}
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: Number.parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
                disabled={isApprovedBudget}
                className="max-w-[200px]"
              />
            </div>

            <Separator />

            <div className="flex justify-between items-center py-3 bg-primary/5 rounded-lg px-4">
              <span className="text-xl font-bold">Total Final:</span>
              <span className="text-2xl font-bold text-primary">R$ {(formData.items.reduce((sum, item) => sum + item.total, 0) - formData.discount).toFixed(2)}</span>
            </div>

            {formData.discount > 0 && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                💰 Economia: R$ {formData.discount.toFixed(2)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.observations}
            onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
            placeholder="Informações adicionais sobre o orçamento..."
            rows={4}
            className="resize-none"
            disabled={isApprovedBudget}
          />
        </CardContent>
      </Card>
    </div>
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="!w-[1000px] !min-w-[1000px] !max-w-[1000px] w-[1000px] min-w-[1000px] max-w-[1000px] overflow-y-auto"
      >
        <SheetHeader className="pb-6 pr-12">
          <SheetTitle className="text-foreground flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {budget ? "Editar Orçamento" : "Novo Orçamento"}
          </SheetTitle>
          <SheetDescription>
            {budget ? "Faça as alterações necessárias no orçamento." : "Crie um novo orçamento seguindo as etapas."}
          </SheetDescription>
        </SheetHeader>

        {isApprovedBudget && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <p className="text-yellow-800 text-sm font-medium">
                Orçamento Aprovado
              </p>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              Este orçamento foi aprovado e não pode ser editado. Para fazer alterações, crie um novo orçamento.
            </p>
          </div>
        )}

        <div className="space-y-6 pr-2">
          {renderStepIndicator()}

          <div className="min-h-[400px]">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep4()}
          </div>

          <div className="flex justify-between pt-6 border-t pb-4">
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                {isApprovedBudget ? "Fechar" : "Cancelar"}
              </Button>

              {currentStep > 1 && !isApprovedBudget && (
                <Button type="button" variant="outline" onClick={prevStep} disabled={isSubmitting}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
              )}
            </div>

            <div>
              {currentStep < 3 && !isApprovedBudget ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceedToNextStep() || isSubmitting || loadingData}
                  className="bg-primary hover:bg-primary/90"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : currentStep === 3 && !isApprovedBudget ? (
                <Button
                  type="button"
                  onClick={handleSaveBudget}
                  className="bg-primary hover:bg-primary/90"
                  disabled={formData.items.length === 0 || isSubmitting || loadingData}
                >
                  {isSubmitting ? "Salvando..." : budget ? "Salvar Alterações" : "Criar Orçamento"}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
