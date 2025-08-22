import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth-context'

interface TrialStatus {
  isActive: boolean
  isExpired: boolean
  daysLeft: number
  trialEnd: string | null
  status: 'trial' | 'active' | 'expired' | 'cancelled'
  totalTrialDays: number
  usedTrialDays: number
}

export function useTrialStatus() {
  const { user } = useAuth()
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      checkTrialStatus()
    } else {
      setLoading(false)
    }
  }, [user]) // Apenas user como dependência

  const checkTrialStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/trial/status')
      const { data, error: apiError } = await response.json()

      if (apiError) {
        setError(apiError)
        return
      }

      setTrialStatus(data)
    } catch (err) {
      if (process.env.NODE_ENV === "development") { console.error('Erro ao verificar status do trial:', err)
      setError('Erro ao verificar status do trial')
    } finally {
      setLoading(false)
    }
  }

  const refreshTrialStatus = () => {
    checkTrialStatus()
  }

  return {
    trialStatus,
    loading,
    error,
    refreshTrialStatus
  }
}
