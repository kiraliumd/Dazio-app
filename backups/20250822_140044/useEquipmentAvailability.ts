"use client"

import { useState } from "react"

interface RentalPeriod {
  startDate: string
  endDate: string
  equipmentName: string
  quantity: number
}

interface AvailabilityInfo {
  equipmentName: string
  totalStock: number
  availableQuantity: number
  isAvailable: boolean
  conflictingRentals: Array<{
    clientName: string
    startDate: string
    endDate: string
    quantity: number
  }>
}

// Dados mockados de estoque de equipamentos
const equipmentStock = {
  "Mesa de Som Yamaha MG16XU": 3,
  "Projetor Epson 5000 Lumens": 2,
  "Kit Iluminação LED RGB": 5,
  "Tenda 10x10m": 4,
  "Caixa de Som JBL SRX815P": 8,
  "Telão 3x2m": 3,
  "Moving Head LED": 6,
  "Microfone Sem Fio": 10,
  "Arranjo Floral Premium": 15,
  "Cadeira Tiffany": 100,
}

// Dados mockados de locações existentes
const existingRentals: RentalPeriod[] = [
  {
    startDate: "2024-12-15",
    endDate: "2024-12-16",
    equipmentName: "Mesa de Som Yamaha MG16XU",
    quantity: 1,
  },
  {
    startDate: "2024-12-15",
    endDate: "2024-12-17",
    equipmentName: "Kit Iluminação LED RGB",
    quantity: 2,
  },
  {
    startDate: "2024-12-20",
    endDate: "2024-12-22",
    equipmentName: "Projetor Epson 5000 Lumens",
    quantity: 2,
  },
  {
    startDate: "2024-12-18",
    endDate: "2024-12-19",
    equipmentName: "Tenda 10x10m",
    quantity: 1,
  },
  {
    startDate: "2024-12-25",
    endDate: "2024-12-26",
    equipmentName: "Caixa de Som JBL SRX815P",
    quantity: 3,
  },
]

// Dados mockados de clientes para os conflitos
const clientNames = {
  "2024-12-15": "Maria Silva Santos",
  "2024-12-20": "Eventos & Cia Ltda",
  "2024-12-18": "João Pedro Oliveira",
  "2024-12-25": "Ana Costa Ferreira",
}

export function useEquipmentAvailability() {
  const [availabilityCache, setAvailabilityCache] = useState<Map<string, AvailabilityInfo>>(new Map())

  const checkAvailability = (
    equipmentName: string,
    startDate: string,
    endDate: string,
    requestedQuantity = 1,
    excludeRentalId?: string,
  ): AvailabilityInfo => {
    const cacheKey = `${equipmentName}-${startDate}-${endDate}-${requestedQuantity}`

    if (availabilityCache.has(cacheKey)) {
      return availabilityCache.get(cacheKey)!
    }

    const totalStock = equipmentStock[equipmentName as keyof typeof equipmentStock] || 0

    // Verificar conflitos no período
    const conflictingRentals = existingRentals.filter((rental) => {
      if (rental.equipmentName !== equipmentName) return false

      // Verificar se há sobreposição de datas
      const rentalStart = new Date(rental.startDate)
      const rentalEnd = new Date(rental.endDate)
      const requestStart = new Date(startDate)
      const requestEnd = new Date(endDate)

      return (
        (requestStart <= rentalEnd && requestEnd >= rentalStart) ||
        (rentalStart <= requestEnd && rentalEnd >= requestStart)
      )
    })

    // Calcular quantidade ocupada no período
    const occupiedQuantity = conflictingRentals.reduce((sum, rental) => sum + rental.quantity, 0)
    const availableQuantity = Math.max(0, totalStock - occupiedQuantity)
    const isAvailable = availableQuantity >= requestedQuantity

    const result: AvailabilityInfo = {
      equipmentName,
      totalStock,
      availableQuantity,
      isAvailable,
      conflictingRentals: conflictingRentals.map((rental) => ({
        clientName: clientNames[rental.startDate as keyof typeof clientNames] || "Cliente não identificado",
        startDate: rental.startDate,
        endDate: rental.endDate,
        quantity: rental.quantity,
      })),
    }

    // Cache do resultado
    setAvailabilityCache((prev) => new Map(prev).set(cacheKey, result))

    return result
  }

  const checkMultipleAvailability = (
    items: Array<{ equipmentName: string; quantity: number }>,
    startDate: string,
    endDate: string,
  ) => {
    return items.map((item) => ({
      ...item,
      availability: checkAvailability(item.equipmentName, startDate, endDate, item.quantity),
    }))
  }

  const clearCache = () => {
    setAvailabilityCache(new Map())
  }

  return {
    checkAvailability,
    checkMultipleAvailability,
    clearCache,
  }
}
