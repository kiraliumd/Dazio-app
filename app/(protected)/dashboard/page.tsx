"use client"

import { useEffect, useState } from "react"
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
import { getDashboardMetrics, type DashboardMetrics } from "../../../lib/database/dashboard"
import { useAuth } from "../../../lib/auth-context"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { TrialWrapper } from "@/components/trial-wrapper"

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const router = useRouter()
  const { user, signOut } = useAuth()

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      console.log('Dashboard: Carregando dados...')
      
      // Adicionar um pequeno delay para evitar flash de loading muito rápido
      const [metricsData] = await Promise.all([
        getDashboardMetrics(),
        new Promise(resolve => setTimeout(resolve, 300)) // Delay mínimo de 300ms
      ])
      
      setMetrics(metricsData)
      console.log('Dashboard: Dados carregados com sucesso')
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
          value: metrics.pendingBudgets || 0,
          icon: FileText,
          description: "Aguardando aprovação",
          variant: "accent" as const,
        },
        {
          title: "Total de Locações no Mês",
          value: metrics.monthlyRentals || 0,
          icon: TrendingUp,
          description: "Contratos fechados",
        },
        {
          title: "Faturamento do Mês",
          value: formatCurrency(metrics.monthlyRevenue || 0),
          icon: DollarSign,
          description: "Receita atual",
          variant: "accent" as const,
        },
        {
          title: "Eventos Agendados",
          value: metrics.scheduledEvents || 0,
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
                <span>Olá, {user?.email}</span>
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

      {/* Modal de Confirmação de Logout */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja sair do sistema? Você será redirecionado para a página de login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sim, Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
