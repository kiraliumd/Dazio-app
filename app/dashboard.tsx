"use client"

import { useEffect, useState } from "react"

;
import { useRouter } from "next/navigation";
import { Calendar, DollarSign, FileText, TrendingUp, Users, Package, BarChart3, Clock, Wrench } from "lucide-react"

import { AppSidebar } from "../components/app-sidebar"
import { MetricCard } from "../components/metric-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { getDashboardMetrics, type DashboardMetrics } from "../lib/database/dashboard"

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      // Adicionar um pequeno delay para evitar flash de loading muito rápido
      const [metricsData] = await Promise.all([
        getDashboardMetrics(),
        new Promise(resolve => setTimeout(resolve, 300)) // Delay mínimo de 300ms
      ])
      setMetrics(metricsData)
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const metricsData = metrics
    ? [
        {
          title: "Orçamentos Pendentes",
          value: metrics.pendingBudgets,
          icon: FileText,
          description: "Aguardando aprovação",
          variant: "accent" as const,
        },
        {
          title: "Locações Ativas",
          value: metrics.activeRentals,
          icon: TrendingUp,
          description: "Em andamento",
        },
        {
          title: "Faturamento do Mês",
          value: formatCurrency(metrics.monthlyRevenue),
          icon: DollarSign,
          description: "Receita atual",
          variant: "accent" as const,
        },
        {
          title: "Eventos Agendados",
          value: metrics.scheduledEvents,
          icon: Calendar,
          description: "Próximos 7 dias",
        },
      ]
    : []

  const quickActions = [
    {
      title: "Orçamentos",
      description: "Criar e gerenciar orçamentos",
      icon: FileText,
      color: "bg-blue-500",
      hoverColor: "hover:bg-blue-600",
      path: "/orcamentos",
      count: metrics?.pendingBudgets || 0,
      countLabel: "pendentes",
    },
    {
      title: "Locações",
      description: "Contratos e locações ativas",
      icon: TrendingUp,
      color: "bg-green-500",
      hoverColor: "hover:bg-green-600",
      path: "/locacoes",
      count: metrics?.activeRentals || 0,
      countLabel: "ativas",
    },
    {
      title: "Agenda",
      description: "Eventos e compromissos",
      icon: Calendar,
      color: "bg-purple-500",
      hoverColor: "hover:bg-purple-600",
      path: "/agenda",
      count: metrics?.scheduledEvents || 0,
      countLabel: "agendados",
    },
    {
      title: "Relatórios",
      description: "Análises e relatórios",
      icon: BarChart3,
      color: "bg-orange-500",
      hoverColor: "hover:bg-orange-600",
      path: "/relatorios",
      count: 0,
      countLabel: "disponíveis",
    },
  ]

  const handleQuickAction = (path: string) => {
    router.push(path)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
              <p className="text-sm text-gray-600">Bem-vindo de volta! Aqui está o resumo do seu negócio.</p>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6 bg-gray-50">
          {/* Cards de Métricas */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-4 rounded-full" />
                      </div>
                      <Skeleton className="h-8 w-20 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </CardContent>
                  </Card>
                ))
              : metricsData.map((metric, index) => (
                  <MetricCard
                    key={index}
                    title={metric.title}
                    value={metric.value}
                    icon={metric.icon}
                    description={metric.description}
                    variant={metric.variant}
                  />
                ))}
          </div>

          

          {/* Seção de Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Clock className="h-6 w-6" />
                Ações Rápidas
              </CardTitle>
              <CardDescription>Acesse rapidamente as principais funcionalidades do sistema</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-200 bg-transparent"
                onClick={() => router.push("/orcamentos")}
              >
                <FileText className="h-6 w-6 text-blue-600" />
                <div className="text-center">
                  <div className="font-medium text-foreground">Orçamentos</div>
                  <div className="text-xs text-gray-500">Criar e gerenciar</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-green-50 hover:border-green-200 bg-transparent"
                onClick={() => router.push("/locacoes")}
              >
                <Wrench className="h-6 w-6 text-green-600" />
                <div className="text-center">
                  <div className="font-medium text-foreground">Locações</div>
                  <div className="text-xs text-gray-500">Contratos ativos</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-purple-50 hover:border-purple-200 bg-transparent"
                onClick={() => router.push("/agenda")}
              >
                <Calendar className="h-6 w-6 text-purple-600" />
                <div className="text-center">
                  <div className="font-medium text-foreground">Agenda</div>
                  <div className="text-xs text-gray-500">Instalações e desmontagens</div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
