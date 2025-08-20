"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Calendar, DollarSign, FileText, TrendingUp, Users, Package } from "lucide-react"
import { AppSidebar } from "../../../components/app-sidebar"
import { PageHeader } from "../../../components/page-header"
import { MetricCard } from "../../../components/metric-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useRentalsForReports, useBudgetsForReports } from "@/lib/hooks/use-optimized-data"
import { 
  type RentalReport,
  type BudgetReport 
} from "../../../lib/database/reports"

// Estados para dados dos relatórios

const periodOptions = [
  { value: "30", label: "Últimos 30 dias" },
  { value: "7", label: "Últimos 7 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "custom", label: "Período personalizado" },
]

export default function RelatoriosPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("30")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [filteredRentals, setFilteredRentals] = useState<RentalReport[]>([])
  const [filteredBudgets, setFilteredBudgets] = useState<BudgetReport[]>([])

  // Calcular datas baseado no período selecionado
  const calculateDateRange = useCallback(() => {
    const today = new Date()
    let start: Date
    let end: Date = today

    if (selectedPeriod === "custom") {
      if (startDate && endDate) {
        start = new Date(startDate)
        end = new Date(endDate)
      } else {
        return { start: null, end: null }
      }
    } else {
      const days = Number.parseInt(selectedPeriod)
      start = new Date(today.getTime() - days * 24 * 60 * 60 * 1000)
    }

    return { start, end }
  }, [selectedPeriod, startDate, endDate])

  // Calcular datas para os hooks
  const dateRange = useMemo(() => {
    const { start, end } = calculateDateRange()
    if (!start || !end) return { startDate: "", endDate: "" }
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    }
  }, [calculateDateRange])

  // Usar hooks otimizados para dados
  const { 
    data: rentals, 
    loading: rentalsLoading, 
    error: rentalsError,
    refresh: refreshRentals 
  } = useRentalsForReports(dateRange.startDate, dateRange.endDate, {
    useCache: true,
    ttl: 2 * 60 * 1000, // 2 minutos para relatórios
  })

  const { 
    data: budgets, 
    loading: budgetsLoading, 
    error: budgetsError,
    refresh: refreshBudgets 
  } = useBudgetsForReports(dateRange.startDate, dateRange.endDate, {
    useCache: true,
    ttl: 2 * 60 * 1000, // 2 minutos para relatórios
  })

  // Calcular loading geral
  const loading = rentalsLoading || budgetsLoading

  // Tratar erros
  useEffect(() => {
    if (rentalsError) {
      console.error('Erro ao carregar locações para relatórios:', rentalsError)
    }
    if (budgetsError) {
      console.error('Erro ao carregar orçamentos para relatórios:', budgetsError)
    }
  }, [rentalsError, budgetsError])

  // Atualizar dados filtrados quando os dados mudarem
  useEffect(() => {
    if (rentals && Array.isArray(rentals)) {
      setFilteredRentals(rentals)
    }
    if (budgets && Array.isArray(budgets)) {
      setFilteredBudgets(budgets)
    }
  }, [rentals, budgets])

  // Carregar dados na montagem
  useEffect(() => {
    console.log('📦 Relatórios: Dados sendo carregados pelos hooks otimizados')
  }, [])

  // Calcular métricas
  const totalRevenue = filteredRentals.reduce((sum, rental) => sum + rental.finalValue, 0)
  const contractsCount = filteredRentals.length
  const budgetsCount = filteredBudgets.length
  const averageTicket = contractsCount > 0 ? totalRevenue / contractsCount : 0

  // Top 3 clientes
  const getTopClients = () => {
    const clientStats = filteredRentals.reduce(
      (acc, rental) => {
        if (!acc[rental.clientName]) {
          acc[rental.clientName] = {
            name: rental.clientName,
            contracts: 0,
            totalValue: 0,
          }
        }
        acc[rental.clientName].contracts += 1
        acc[rental.clientName].totalValue += rental.finalValue
        return acc
      },
      {} as Record<string, { name: string; contracts: number; totalValue: number }>,
    )

    return Object.values(clientStats)
      .sort((a, b) => b.contracts - a.contracts)
      .slice(0, 3)
  }

  // Equipamentos mais alugados
  const getTopEquipments = () => {
    const equipmentStats = filteredRentals.reduce(
      (acc, rental) => {
        rental.items.forEach((item) => {
          if (!acc[item.equipmentName]) {
            acc[item.equipmentName] = {
              name: item.equipmentName,
              quantity: 0,
              rentals: 0,
            }
          }
          acc[item.equipmentName].quantity += item.quantity
          acc[item.equipmentName].rentals += 1
        })
        return acc
      },
      {} as Record<string, { name: string; quantity: number; rentals: number }>,
    )

    return Object.values(equipmentStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
  }

  const topClients = getTopClients()
  const topEquipments = getTopEquipments()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader 
          title="Relatórios" 
          description="Análise de desempenho e métricas do negócio" 
        />

        <main className="flex-1 space-y-6 p-6 bg-background">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Filtros de Período</CardTitle>
              <CardDescription>Selecione o período para análise dos dados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 items-end">
                <div className="grid gap-2">
                  <Label htmlFor="period" className="text-gray-900 font-medium">Período</Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedPeriod === "custom" && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="startDate" className="text-gray-900 font-medium">Data Inicial</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endDate" className="text-gray-900 font-medium">Data Final</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Métricas Principais */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Receita Total"
              value={formatCurrency(totalRevenue)}
              icon={DollarSign}
              description="Receita total do período"
            />
            <MetricCard
              title="Contratos"
              value={contractsCount.toString()}
              icon={FileText}
              description="Número de contratos realizados"
            />
            <MetricCard
              title="Orçamentos"
              value={budgetsCount.toString()}
              icon={TrendingUp}
              description="Orçamentos gerados"
            />
            <MetricCard
              title="Ticket Médio"
              value={formatCurrency(averageTicket)}
              icon={Calendar}
              description="Valor médio por contrato"
            />
          </div>

          {/* Análises Detalhadas */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Clientes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Top 3 Clientes</CardTitle>
                <CardDescription>Clientes com mais contratos no período</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-text-secondary">Carregando...</span>
                  </div>
                ) : topClients.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary">
                    Nenhum cliente encontrado no período selecionado.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topClients.map((client, index) => (
                      <div key={client.name} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{client.name}</div>
                            <div className="text-sm text-text-secondary">{client.contracts} contrato(s)</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-foreground">{formatCurrency(client.totalValue)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Equipamentos Mais Alugados */}
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Equipamentos Mais Alugados</CardTitle>
                <CardDescription>Equipamentos com maior demanda no período</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-text-secondary">Carregando...</span>
                  </div>
                ) : topEquipments.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary">
                    Nenhum equipamento encontrado no período selecionado.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topEquipments.map((equipment, index) => (
                      <div key={equipment.name} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{equipment.name}</div>
                            <div className="text-sm text-text-secondary">{equipment.rentals} locação(ões)</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-foreground">{equipment.quantity} unidade(s)</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>


        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
