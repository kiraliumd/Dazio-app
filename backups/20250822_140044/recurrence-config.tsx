"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Calendar, Repeat, CalendarX } from "lucide-react"
import { format, addMonths, addWeeks, addDays, addYears } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { RecurrenceType } from "../lib/utils/data-transformers"

interface RecurrenceConfigProps {
  startDate: string
  endDate: string
  isRecurring: boolean
  recurrenceType: RecurrenceType
  recurrenceInterval: number
  recurrenceEndDate?: string
  onConfigChange: (config: {
    isRecurring: boolean
    recurrenceType: RecurrenceType
    recurrenceInterval: number
    recurrenceEndDate?: string
  }) => void
}

const recurrenceOptions = [
  { value: "none", label: "Sem recorrência" },
  { value: "daily", label: "Diária" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "yearly", label: "Anual" },
]

export function RecurrenceConfig({
  startDate,
  endDate,
  isRecurring,
  recurrenceType,
  recurrenceInterval,
  recurrenceEndDate,
  onConfigChange,
}: RecurrenceConfigProps) {
  const [showPreview, setShowPreview] = useState(false)

  const handleRecurrenceToggle = (checked: boolean) => {
    onConfigChange({
      isRecurring: checked,
      recurrenceType: checked ? "monthly" : "none",
      recurrenceInterval: 1,
      recurrenceEndDate: checked ? addMonths(new Date(endDate), 6).toISOString().split('T')[0] : undefined,
    })
  }

  const handleTypeChange = (type: RecurrenceType) => {
    onConfigChange({
      isRecurring,
      recurrenceType: type,
      recurrenceInterval,
      recurrenceEndDate,
    })
  }

  const handleIntervalChange = (interval: string) => {
    onConfigChange({
      isRecurring,
      recurrenceType,
      recurrenceInterval: parseInt(interval) || 1,
      recurrenceEndDate,
    })
  }

  const handleEndDateChange = (date: string) => {
    onConfigChange({
      isRecurring,
      recurrenceType,
      recurrenceInterval,
      recurrenceEndDate: date || undefined,
    })
  }

  const generatePreview = () => {
    if (!isRecurring || !startDate || !endDate) return []

    const preview = []
    const start = new Date(startDate)
    const end = new Date(endDate)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    let currentDate = new Date(startDate)
    const endRecurrence = recurrenceEndDate ? new Date(recurrenceEndDate) : addMonths(new Date(startDate), 12)

    for (let i = 0; i < 6 && currentDate <= endRecurrence; i++) {
      const occurrenceEnd = new Date(currentDate)
      occurrenceEnd.setDate(occurrenceEnd.getDate() + daysDiff - 1)

      preview.push({
        number: i + 1,
        startDate: format(currentDate, "dd/MM/yyyy", { locale: ptBR }),
        endDate: format(occurrenceEnd, "dd/MM/yyyy", { locale: ptBR }),
      })

      // Calcular próxima data
      switch (recurrenceType) {
        case "daily":
          currentDate = addDays(currentDate, recurrenceInterval)
          break
        case "weekly":
          currentDate = addWeeks(currentDate, recurrenceInterval)
          break
        case "monthly":
          currentDate = addMonths(currentDate, recurrenceInterval)
          break
        case "yearly":
          currentDate = addYears(currentDate, recurrenceInterval)
          break
        default:
          break
      }
    }

    return preview
  }

  const preview = generatePreview()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Repeat className="h-5 w-5" />
          Configuração de Recorrência
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle de recorrência */}
        <div className="flex items-center justify-between">
          <Label htmlFor="recurring" className="text-base font-medium">
            Locação Recorrente
          </Label>
          <Switch
            id="recurring"
            checked={isRecurring}
            onCheckedChange={handleRecurrenceToggle}
          />
        </div>

        {isRecurring && (
          <>
            <Separator />
            
            {/* Tipo de recorrência */}
            <div className="space-y-2">
              <Label htmlFor="recurrence-type">Tipo de Recorrência</Label>
              <Select value={recurrenceType} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {recurrenceOptions.slice(1).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Intervalo */}
            <div className="space-y-2">
              <Label htmlFor="recurrence-interval">Intervalo</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="recurrence-interval"
                  type="number"
                  min="1"
                  max="12"
                  value={recurrenceInterval}
                  onChange={(e) => handleIntervalChange(e.target.value)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">
                  {recurrenceType === "daily" && "dias"}
                  {recurrenceType === "weekly" && "semanas"}
                  {recurrenceType === "monthly" && "meses"}
                  {recurrenceType === "yearly" && "anos"}
                </span>
              </div>
            </div>

            {/* Data de fim da recorrência */}
            <div className="space-y-2">
              <Label htmlFor="recurrence-end-date" className="flex items-center gap-2">
                <CalendarX className="h-4 w-4" />
                Data de Fim da Recorrência
              </Label>
              <Input
                id="recurrence-end-date"
                type="date"
                value={recurrenceEndDate || ""}
                onChange={(e) => handleEndDateChange(e.target.value)}
                min={endDate}
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco para recorrência indefinida
              </p>
            </div>

            {/* Preview das ocorrências */}
            {preview.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Preview das Ocorrências
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? "Ocultar" : "Mostrar"}
                  </Button>
                </div>
                
                {showPreview && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {preview.map((occurrence) => (
                      <div
                        key={occurrence.number}
                        className="flex items-center justify-between p-2 bg-muted rounded-md text-sm"
                      >
                        <span className="font-medium">#{occurrence.number}</span>
                        <span>
                          {occurrence.startDate} - {occurrence.endDate}
                        </span>
                      </div>
                    ))}
                    {preview.length === 6 && (
                      <p className="text-xs text-muted-foreground text-center">
                        ... e mais ocorrências
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

import { Separator } from "@/components/ui/separator" 