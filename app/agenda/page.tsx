"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import { AppSidebar } from "../../components/app-sidebar"
import { PageHeader } from "../../components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import Link from "next/link"
import { getLogisticsEvents } from "../../lib/database/rentals"
import { formatDateCuiaba } from "@/lib/utils"

interface LogisticsEvent {
  id: string
  rental_id: string
  event_type: string
  event_date: string
  event_time: string
  status: string
  notes: string
  created_at: string
  rentals: {
    id: string
    client_name: string
    installation_location: string
    total_value: number
    rental_items: Array<{
      equipment_name: string
    }>
  }
}

const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

// Spinner de loading otimizado
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-96">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-text-secondary">Carregando eventos da agenda...</p>
    </div>
  </div>
);

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<LogisticsEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const data = await getLogisticsEvents()
      setEvents(data)
    } catch (error) {
      console.error("Erro ao carregar eventos:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = useCallback((date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }, [])

  const getFirstDayOfMonth = useCallback((date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }, [])

  const formatDateKey = useCallback((year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }, [])

  // Memoizar busca de eventos do dia
  const getEventsForDate = useCallback((dateKey: string) => {
    return events.filter((event: LogisticsEvent) => event.event_date === dateKey)
  }, [events])

  const previousMonth = useCallback(() => {
    setCurrentDate((prev: Date) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }, [])

  const nextMonth = useCallback(() => {
    setCurrentDate((prev: Date) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }, [])

  const goToToday = useCallback(() => {
    const today = new Date()
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))
  }, [])

  const getStatusColor = useCallback((eventType: string) => {
    switch (eventType) {
      case "Instalação":
        return "bg-primary/10 text-primary border border-primary/20"
      case "Retirada":
        return "bg-purple-100 text-purple-700 border border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200"
    }
  }, [])

  const formatTime = useCallback((timeString: string) => {
    if (timeString && timeString.includes(':')) {
      return timeString.substring(0, 5)
    }
    return timeString
  }, [])

  // Memoizar renderização do calendário
  const renderCalendar = useCallback(() => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Dias vazios no início
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 border border-gray-200 bg-gray-50"></div>)
    }

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day)
      const eventsForDay = getEventsForDate(dateKey)
      // Corrigir para comparar com a data local, não UTC
      const today = new Date()
      const localDateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
      const isToday = dateKey === localDateKey

      days.push(
        <Link
          key={day}
          href={`/agenda/${dateKey}`}
          className={`h-32 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer ${
            isToday ? "bg-primary/10 border-primary ring-2 ring-primary/20" : "bg-white"
          }`}
        >
          <div className="p-2 h-full flex flex-col">
            <div className={`text-sm font-medium mb-1 ${isToday ? "text-primary font-bold" : "text-gray-900"}`}>
              {day}
              {isToday && <span className="ml-1 text-xs">(Hoje)</span>}
            </div>
            <div className="flex-1 space-y-1 overflow-hidden">
              {eventsForDay.slice(0, 3).map((event: LogisticsEvent, index: number) => {
                // event_time agora é uma string no formato HH:mm
                const timeString = event.event_time
                
                return (
                <div
                  key={event.id}
                    className={`text-xs p-1 rounded truncate ${getStatusColor(event.event_type)}`}
                    title={`${event.rentals.client_name} - ${event.event_type}`}
                >
                    <div className="font-medium truncate">{event.rentals.client_name}</div>
                  <div className="truncate">
                      {formatTime(timeString)} - {event.event_type}
                    </div>
                  </div>
                )
              })}
              {eventsForDay.length > 3 && <div className="text-xs text-gray-500 font-medium">+{eventsForDay.length - 3} mais</div>}
            </div>
          </div>
        </Link>,
      )
    }

    return days
  }, [currentDate, getDaysInMonth, getFirstDayOfMonth, formatDateKey, getEventsForDate, getStatusColor, formatTime])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader 
          title="Agenda" 
          description="Visualize todos os eventos agendados" 
        />

        <main className="flex-1 space-y-6 p-6 bg-background">
          {/* Calendário */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </CardTitle>
                  <CardDescription>
                    {loading ? "Carregando eventos..." : "Clique em uma data para ver os detalhes dos eventos"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={previousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button onClick={goToToday} variant="outline" size="sm">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Hoje
                  </Button>
                  <Button variant="outline" size="sm" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingSpinner />
              ) : (
                <>
              <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
                {/* Cabeçalho dos dias da semana */}
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="bg-gray-100 border-b border-gray-200 p-3 text-center text-sm font-medium text-gray-700"
                  >
                    {day}
                  </div>
                ))}

                {/* Dias do calendário */}
                {renderCalendar()}
              </div>

              {/* Legenda */}
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-primary/10 border border-primary/20"></div>
                      <span className="text-gray-900 font-medium">Instalação</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-purple-100 border border-purple-200"></div>
                      <span className="text-gray-900 font-medium">Retirada</span>
                </div>
              </div>
                </>
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
