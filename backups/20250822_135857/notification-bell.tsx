"use client"

import { Bell, Check, X } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateCuiaba } from "@/lib/utils"
import { getRecurringRentals } from "@/lib/database/recurring-rentals"
import { transformRentalFromDB } from "@/lib/utils/data-transformers"
import type { Rental } from "@/lib/utils/data-transformers"

interface Notification {
  id: string
  title: string
  message: string
  rentalId: string
  clientName: string
  dueDate: string
  createdAt: string
  isRead: boolean
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Buscar notificações de recorrência
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const dbRentals = await getRecurringRentals(50)
      const rentals = dbRentals.map(transformRentalFromDB)
      
      const today = new Date()
      const notificationsList: Notification[] = []

      rentals.forEach((rental) => {
        if (rental.nextOccurrenceDate && rental.recurrenceStatus === "active") {
          const nextDate = new Date(rental.nextOccurrenceDate)
          const daysUntilDue = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

          // Notificação apenas para hoje (data da recorrência)
          if (daysUntilDue === 0) {
            notificationsList.push({
              id: `recurrence-${rental.id}-today`,
              title: "Recorrência Hoje",
              message: `A locação recorrente de ${rental.clientName} vence hoje.`,
              rentalId: rental.id,
              clientName: rental.clientName,
              dueDate: rental.nextOccurrenceDate,
              createdAt: new Date().toISOString(),
              isRead: false,
            })
          }
        }
      })

      setNotifications(notificationsList)
    } catch (error) {
      if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.error("Erro ao buscar notificações:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    
    // Atualizar notificações a cada hora
    const interval = setInterval(fetchNotifications, 60 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, []) // Array vazio para executar apenas uma vez

  const unreadCount = notifications.filter(n => !n.isRead).length

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    )
  }

  const getNotificationIcon = () => "📅"
  const getNotificationColor = () => "border-blue-200 bg-blue-50"

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 p-0"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notificações</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Carregando notificações...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Nenhuma notificação
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {notifications.map((notification) => (
                                 <Card 
                   key={notification.id} 
                   className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                     notification.isRead ? 'opacity-60' : ''
                   } ${getNotificationColor()}`}
                   onClick={() => markAsRead(notification.id)}
                 >
                   <CardHeader className="pb-2">
                     <div className="flex items-start justify-between">
                       <div className="flex items-center gap-2">
                         <span className="text-lg">{getNotificationIcon()}</span>
                         <CardTitle className="text-sm font-medium">
                           {notification.title}
                         </CardTitle>
                       </div>
                       {!notification.isRead && (
                         <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                       )}
                     </div>
                   </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-xs">
                      {notification.message}
                    </CardDescription>
                    <div className="mt-2 text-xs text-gray-500">
                      Vence em: {formatDateCuiaba(notification.dueDate, "dd/MM/yyyy")}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
} 