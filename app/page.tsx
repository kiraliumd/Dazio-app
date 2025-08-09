import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // This is handled by the middleware
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Sempre preferir login ao entrar pela raiz quando não há sessão válida
  if (!session) {
    redirect('/login')
  }

  // Sessão existe: validar perfil antes de mandar para o dashboard
  const { data: profile, error } = await supabase
    .from('company_profiles')
    .select('trial_end, status')
    .eq('user_id', session.user.id)
    .single()

  if (error || !profile) {
    // Sem perfil: ir ao login (evita redirecionar para assinatura ao digitar a raiz)
    redirect('/login')
  }

  const now = new Date()
  const trialEnd = new Date(profile.trial_end)
  const isTrialExpired = now > trialEnd

  // Apenas direciona ao dashboard para status ativo ou trial válido
  if (profile.status === 'active' || (!isTrialExpired && profile.status === 'trial')) {
    redirect('/dashboard')
  }

  // Qualquer outro caso: ir ao login pela raiz
  redirect('/login')
}
