"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../lib/auth-context'
import { Loader2, AlertTriangle, Lock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface TrialGuardProps {
  children: React.ReactNode
}

interface TrialStatus {
  isActive: boolean
  isExpired: boolean
  daysLeft: number
  trialEnd: string | null
  status: 'trial' | 'active' | 'expired' | 'cancelled'
}

export function TrialGuard({ children }: TrialGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null)
  const [checkingTrial, setCheckingTrial] = useState(true)

  useEffect(() => {
    if (user && !loading) {
      checkTrialStatus()
    }
  }, [user, loading])

  const checkTrialStatus = async () => {
    try {
      setCheckingTrial(true)
      
      const response = await fetch('/api/company/profile')
      const { data: profile } = await response.json()

      if (!profile) {
        setTrialStatus({
          isActive: false,
          isExpired: true,
          daysLeft: 0,
          trialEnd: null,
          status: 'expired'
        })
        return
      }

      const now = new Date()
      const trialEnd = new Date(profile.trial_end)
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const isExpired = now > trialEnd

      const status: TrialStatus = {
        isActive: !isExpired && profile.status === 'trial',
        isExpired,
        daysLeft: Math.max(0, daysLeft),
        trialEnd: profile.trial_end,
        status: profile.status as 'trial' | 'active' | 'expired' | 'cancelled'
      }

      setTrialStatus(status)

      // Se o trial expirou e não está na página de assinatura, redirecionar
      if (isExpired && profile.status === 'trial' && window.location.pathname !== '/assinatura-gestao') {
        router.replace('/assinatura-gestao')
      }
    } catch (error) {
      console.error('Erro ao verificar status do trial:', error)
      setTrialStatus({
        isActive: false,
        isExpired: true,
        daysLeft: 0,
        trialEnd: null,
        status: 'expired'
      })
    } finally {
      setCheckingTrial(false)
    }
  }

  // Se ainda está carregando
  if (loading || checkingTrial) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  // Se não há usuário, não aplicar TrialGuard
  if (!user) {
    return <>{children}</>
  }

  // Se o trial expirou e não está na página de assinatura
  if (trialStatus?.isExpired && trialStatus?.status === 'trial' && window.location.pathname !== '/assinatura-gestao') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <Lock className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Acesso Bloqueado
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Seu período de teste expirou
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Para continuar usando o sistema, você precisa fazer upgrade para um plano pago.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/assinatura-gestao')}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  Gerenciar Assinatura
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => router.push('/login')}
                  className="w-full"
                >
                  Sair do Sistema
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Se tem assinatura ativa ou trial ativo, permitir acesso
  if (trialStatus?.status === 'active' || trialStatus?.isActive) {
    return <>{children}</>
  }

  // Para outros casos (cancelled, etc), redirecionar para assinatura
  if (trialStatus?.status === 'cancelled' && window.location.pathname !== '/assinatura-gestao') {
    router.replace('/assinatura-gestao')
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Redirecionando...</p>
        </div>
      </div>
    )
  }

  // Fallback: permitir acesso
  return <>{children}</>
}
