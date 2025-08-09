"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth-context'
import { NotificationBell } from './notification-bell'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { LogOut } from 'lucide-react'
import { LogoutConfirmationModal } from './logout-confirmation-modal'

interface PageHeaderProps {
  title: string
  description: string
}

export function PageHeader({ title, description }: PageHeaderProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [companyName, setCompanyName] = useState<string>(
    typeof window !== 'undefined' ? (sessionStorage.getItem('company_name') || '') : ''
  )
  const { user, signOut } = useAuth()

  useEffect(() => {
    const fetchCompanyName = async () => {
      if (user) {
        try {
          const response = await fetch('/api/company/profile', { cache: 'force-cache' })
          const { data } = await response.json()
          if (data?.company_name) {
            setCompanyName(data.company_name)
            try { sessionStorage.setItem('company_name', data.company_name) } catch {}
          }
        } catch (error) {
          console.error('Erro ao buscar nome da empresa:', error)
        }
      }
    }

    fetchCompanyName()
  }, [user])

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Erro no logout:", error)
    }
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            <p className="text-sm text-text-secondary">{description}</p>
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

      {/* Modal de Confirmação de Logout - Componente Reutilizável */}
      <LogoutConfirmationModal
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        onConfirm={handleLogout}
      />
    </>
  )
} 