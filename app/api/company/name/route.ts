import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Buscar perfil para obter company_id
    const { data: profile, error: profileError } = await supabase
      .from('company_profiles')
      .select('id, company_name')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ name: user.email || 'Usuário' })
    }

    const name = profile.company_name || user.email || 'Usuário'
    return NextResponse.json({ name })
  } catch (e) {
    return NextResponse.json({ name: 'Usuário' })
  }
}


