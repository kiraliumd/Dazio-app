"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../lib/auth-context'
import { AlertTriangle, Lock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
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
  const [hasCheckedOnce, setHasCheckedOnce] = useState(false)
  const CACHE_KEY = 'trial-status-cache'
  const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutos

  useEffect(() => {
    if (user && !loading) {
      try {
        const raw = sessionStorage.getItem(CACHE_KEY)
        if (raw) {
          const cached = JSON.parse(raw) as { status: TrialStatus; cachedAt: number }
          const isFresh = Date.now() - cached.cachedAt < CACHE_TTL_MS
          if (isFresh && cached.status) {
            setTrialStatus(cached.status)
            setCheckingTrial(false)
            setHasCheckedOnce(true)
            // Atualiza em background sem bloquear UI
            checkTrialStatus(false)
            return
          }
        }
      } catch {}
      // Sem cache fresco: checar normalmente (pode mostrar loader apenas na primeira vez)
      checkTrialStatus(true)
    }
  }, [user, loading])

  const checkTrialStatus = async (blockUI: boolean = true) => {
    try {
      if (blockUI) setCheckingTrial(true)
      
      const response = await fetch('/api/company/profile', { cache: 'no-store' })
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
      // Cachear
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ status, cachedAt: Date.now() }))
      } catch {}

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
      if (blockUI) setCheckingTrial(false)
      setHasCheckedOnce(true)
    }
  }

  // Se ainda está carregando
  if (loading || (checkingTrial && !hasCheckedOnce)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-10 w-1/2 mx-auto" />
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
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-6 w-40 mx-auto" />
          <Skeleton className="h-10 w-1/2 mx-auto" />
        </div>
      </div>
    )
  }

  // Fallback: permitir acesso
  return <>{children}</>
}
