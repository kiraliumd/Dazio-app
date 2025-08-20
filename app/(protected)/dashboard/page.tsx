"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation";
import { Calendar, DollarSign, FileText, TrendingUp, Users, Package, BarChart3, Clock, Wrench, LogOut } from "lucide-react"

import { AppSidebar } from "../../../components/app-sidebar"
import { MetricCard } from "../../../components/metric-card"
import { NotificationBell } from "../../../components/notification-bell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useDashboardMetrics } from "@/lib/hooks/use-optimized-data"
import { type DashboardMetrics } from "../../../lib/database/dashboard"
import { useAuth } from "../../../lib/auth-context"
import { LogoutConfirmationModal } from "../../../components/logout-confirmation-modal"
import { TrialWrapper } from "@/components/trial-wrapper"
import { useCompanyName } from "@/hooks/useCompanyName"

// Cache com TTL para evitar refetches desnecessários
const dashboardCache = {
  metrics: null as DashboardMetrics | null,
  lastFetch: 0,
  ttl: 5 * 60 * 1000, // 5 minutos
};

export default function Dashboard() {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const { companyName, setCompanyName, refreshCompanyName } = useCompanyName()
  const router = useRouter()
  const { user, signOut } = useAuth()

  // Usar hooks otimizados para dados
  const { data: metrics, loading, error, refresh: refreshMetrics } = useDashboardMetrics({
    useCache: true,
    ttl: 1 * 60 * 1000, // 1 minuto para métricas
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000, // Auto-refresh a cada 5 minutos
  })

  // Tratar erros
  useEffect(() => {
    if (error) {
      console.error("Erro ao carregar dados do dashboard:", error)
    }
  }, [error])

  // Carregar dados quando usuário estiver disponível
  useEffect(() => {
    if (user && !metrics) {
      console.log('📦 Dashboard: Dados sendo carregados pelos hooks otimizados')
    }
  }, [user, metrics])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const metricsData = metrics && typeof metrics === 'object' && 'pendingBudgets' in metrics
    ? [
        {
          title: "Orçamentos Pendentes",
          value: (metrics as DashboardMetrics).pendingBudgets || 0,
          icon: FileText,
          description: "Aguardando aprovação",
          variant: "accent" as const,
        },
        {
          title: "Total de Locações no Mês",
          value: (metrics as DashboardMetrics).monthlyRentals || 0,
          icon: Package,
          description: "Locações ativas",
          variant: "default" as const,
        },
        {
          title: "Receita do Mês",
          value: formatCurrency((metrics as DashboardMetrics).monthlyRevenue || 0),
          icon: DollarSign,
          description: "Faturamento mensal",
          variant: "default" as const,
        },
        {
          title: "Eventos Agendados",
          value: (metrics as DashboardMetrics).scheduledEvents || 0,
          icon: Calendar,
          description: "Para hoje",
          variant: "default" as const,
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
      count: metrics && typeof metrics === 'object' && 'pendingBudgets' in metrics ? (metrics as DashboardMetrics).pendingBudgets || 0 : 0,
      countLabel: "pendentes",
    },
    {
      title: "Locações",
      description: "Contratos e locações ativas",
      icon: TrendingUp,
      color: "bg-green-500",
      hoverColor: "hover:bg-green-600",
      path: "/locacoes",
      count: metrics && typeof metrics === 'object' && 'activeRentals' in metrics ? (metrics as DashboardMetrics).activeRentals || 0 : 0,
      countLabel: "ativas",
    },
    {
      title: "Agenda",
      description: "Eventos e compromissos",
      icon: Calendar,
      color: "bg-purple-500",
      hoverColor: "hover:bg-purple-600",
      path: "/agenda",
      count: metrics && typeof metrics === 'object' && 'scheduledEvents' in metrics ? (metrics as DashboardMetrics).scheduledEvents || 0 : 0,
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

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Erro no logout:", error)
    }
  }

  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
              <p className="text-sm text-text-secondary">Bem-vindo de volta! Aqui está o resumo do seu negócio.</p>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Olá, {companyName || user?.email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6 bg-background">
          <TrialWrapper>
            <div className="space-y-6">
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
                <CardContent className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-200 bg-transparent"
                    onClick={() => router.push("/orcamentos")}
                  >
                    <FileText className="h-6 w-6 text-blue-600" />
                    <div className="text-center">
                      <div className="font-medium text-foreground">Orçamentos</div>
                      <div className="text-xs text-text-secondary">Criar e gerenciar</div>
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
                      <div className="text-xs text-text-secondary">Contratos ativos</div>
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
                      <div className="text-xs text-text-secondary">Instalações e desmontagens</div>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TrialWrapper>
        </main>
      </SidebarInset>
      </SidebarProvider>

      {/* Modal de Confirmação de Logout - Componente Reutilizável */}
      <LogoutConfirmationModal
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        onConfirm={handleLogout}
      />
    </>
  )
}
