"use client"

import { useState, useEffect, use } from "react"
import { ArrowLeft, Calendar, Clock, MapPin, Package, DollarSign, Copy, CalendarDays, MessageSquare } from "lucide-react"
import { AppSidebar } from "../../../components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"
import { getLogisticsEvents } from "../../../lib/database/rentals"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { supabase } from "../../../lib/supabase"

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

export default function AgendaDatePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = use(params)
  const [events, setEvents] = useState<LogisticsEvent[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Estado para modal de reagendamento
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [rescheduleEvent, setRescheduleEvent] = useState<LogisticsEvent | null>(null)
  const [newDate, setNewDate] = useState("")
  const [newTime, setNewTime] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadEvents()
  }, [date])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const allEvents = await getLogisticsEvents()
      const eventsForDate = allEvents.filter((event) => {
        // Usar event_date da nova estrutura da tabela
        return event.event_date === date
      })
      setEvents(eventsForDate)
    } catch (error) {
      console.error("Erro ao carregar eventos:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      // Evitar problemas de fuso horário criando a data no fuso local
      const [year, month, day] = dateString.split('-').map(Number)
      const date = new Date(year, month - 1, day) // month - 1 porque Date usa 0-11
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    } catch (error) {
      return dateString
    }
  }

  const formatTime = (timeString: string) => {
    // Extrair apenas hora e minuto (HH:mm) do formato HH:mm:ss
    if (timeString && timeString.includes(':')) {
      return timeString.substring(0, 5); // Pega apenas HH:mm
    }
    return timeString;
  }

  const getStatusColor = (eventType: string) => {
    switch (eventType) {
      case "Instalação":
        return "bg-accent/20 text-accent border-accent/40"
      case "Retirada":
        return "bg-purple-100 text-purple-700 border-purple-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getStatusIcon = (eventType: string) => {
    switch (eventType) {
      case "Instalação":
        return <Package className="h-4 w-4" />
      case "Retirada":
        return <Package className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copiado!",
        description: "Resumo copiado para a área de transferência",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar para a área de transferência",
        variant: "destructive",
      })
    }
  }

  const generateWhatsAppMessage = () => {
    const formattedDate = formatDate(date)
    let message = `📅 *Resumo da Agenda - ${formattedDate}*\n\n`
    
    if (events.length === 0) {
      message += "Nenhum evento agendado para esta data."
    } else {
      events.forEach((event, index) => {
        message += `${index + 1}. *${event.event_type}* - ${event.event_time}\n`
        message += `   👤 ${event.rentals.client_name}\n`
        message += `   📍 ${event.rentals.installation_location}\n`
        message += `   💰 R$ ${event.rentals.total_value.toFixed(2).replace(".", ",")}\n\n`
      })
    }
    
    return message
  }

  const openWhatsApp = () => {
    const message = generateWhatsAppMessage()
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
  }

  const handleReschedule = (eventId: string) => {
    const event = events.find(e => e.id === eventId)
    if (event) {
      setRescheduleEvent(event)
      setNewDate(event.event_date)
      setNewTime(event.event_time)
      setRescheduleOpen(true)
    }
  }

  const handleRescheduleSave = async () => {
    if (!rescheduleEvent) return
    setSaving(true)
    const { error } = await supabase
      .from("rental_logistics_events")
      .update({ event_date: newDate, event_time: newTime })
      .eq("id", rescheduleEvent.id)
    setSaving(false)
    setRescheduleOpen(false)
    if (error) {
      toast({
        title: "Erro ao reagendar",
        description: error.message,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Evento reagendado com sucesso!"
      })
      // Atualizar eventos na tela
      loadEvents()
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/agenda">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Agenda</h1>
                <p className="text-sm text-gray-600">
                  {formatDate(date)}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6 bg-gray-50">
          {/* Botões de ação */}
          {!loading && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {events.length} evento{events.length !== 1 ? 's' : ''} para {formatDate(date)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generateWhatsAppMessage())}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Resumo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openWhatsApp}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Enviar WhatsApp
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando eventos...</p>
              </div>
            </div>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum evento agendado</h3>
                <p className="text-gray-600">Não há eventos programados para esta data.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <Card key={event.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={getStatusColor(event.event_type)}>
                        {getStatusIcon(event.event_type)}
                        <span className="ml-1">{event.event_type}</span>
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {formatTime(event.event_time)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg text-foreground mb-2">
                          {event.rentals.client_name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <MapPin className="h-4 w-4" />
                          <span>{event.rentals.installation_location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="h-4 w-4" />
                          <span>R$ {event.rentals.total_value.toFixed(2).replace(".", ",")}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Equipamentos:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {event.rentals.rental_items.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                          <Package className="h-4 w-4 text-gray-400" />
                              <span>{item.equipment_name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-green-600" />
                            <span>Horário: {formatTime(event.event_time)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {event.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReschedule(event.id)}
                          >
                            <CalendarDays className="h-4 w-4 mr-2" />
                            Reagendar
                          </Button>
                          <Link href={`/locacoes`}>
                            <Button variant="outline" size="sm">
                              Ver Contrato
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </SidebarInset>
      <Toaster />

      {/* Modal de reagendamento */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reagendar Evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nova Data</label>
              <Input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Novo Horário</label>
              <Input
                type="time"
                value={newTime}
                onChange={e => setNewTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleRescheduleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
