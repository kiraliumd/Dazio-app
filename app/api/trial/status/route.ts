import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Buscar perfil da empresa
    const { data: profile, error } = await supabase
      .from('company_profiles')
      .select('trial_end, status, trial_start')
      .eq('user_id', user.id)
      .single()

    if (error || !profile) {
      return NextResponse.json(
        { error: 'Perfil não encontrado' },
        { status: 404 }
      )
    }

    const now = new Date()
    const trialEnd = new Date(profile.trial_end)
    const trialStart = new Date(profile.trial_start)
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const isExpired = now > trialEnd
    const isActive = !isExpired && profile.status === 'trial'

    const trialStatus = {
      isActive,
      isExpired,
      daysLeft: Math.max(0, daysLeft),
      trialEnd: profile.trial_end,
      trialStart: profile.trial_start,
      status: profile.status as 'trial' | 'active' | 'expired' | 'cancelled',
      totalTrialDays: Math.ceil((trialEnd.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24)),
      usedTrialDays: Math.ceil((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24))
    }

    return NextResponse.json({ data: trialStatus })
  } catch (error) {
    console.error('Erro ao verificar status do trial:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
