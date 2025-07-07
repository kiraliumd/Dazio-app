"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import { AppSidebar } from "../../components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { getLogisticsEvents } from "../../lib/database/rentals"

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

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  const getEventsForDate = (dateKey: string) => {
    return events.filter((event) => {
      // Usar event_date da nova estrutura da tabela
      const eventDate = event.event_date
      return eventDate === dateKey
    })
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))
  }

  const getStatusColor = (eventType: string) => {
    switch (eventType) {
      case "Instalação":
        return "bg-accent/20 text-accent"
      case "Retirada":
        return "bg-purple-100 text-purple-700"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatTime = (timeString: string) => {
    // Extrair apenas hora e minuto (HH:mm) do formato HH:mm:ss
    if (timeString && timeString.includes(':')) {
      return timeString.substring(0, 5); // Pega apenas HH:mm
    }
    return timeString;
  }

  const renderCalendar = () => {
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
      const today = new Date()
      const isToday = dateKey === today.toISOString().split("T")[0]

      days.push(
        <Link
          key={day}
          href={`/agenda/${dateKey}`}
          className={`h-32 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer ${
            isToday ? "bg-primary/10 border-primary ring-2 ring-primary/20" : "bg-background"
          }`}
        >
          <div className="p-2 h-full flex flex-col">
            <div className={`text-sm font-medium mb-1 ${isToday ? "text-primary font-bold" : "text-gray-900"}`}>
              {day}
              {isToday && <span className="ml-1 text-xs">(Hoje)</span>}
            </div>
            <div className="flex-1 space-y-1 overflow-hidden">
              {eventsForDay.slice(0, 3).map((event, index) => {
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
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">Agenda</h1>
              <p className="text-sm text-gray-600">Visualize todos os eventos agendados</p>
            </div>
            <Button onClick={goToToday} variant="outline">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Hoje
            </Button>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6 bg-gray-50">
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
                  <Button variant="outline" size="sm" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando eventos da agenda...</p>
                  </div>
                </div>
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
                  <div className="w-3 h-3 rounded bg-accent/20 border border-accent/40"></div>
                      <span>Instalação</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-purple-100 border border-purple-300"></div>
                      <span>Retirada</span>
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
