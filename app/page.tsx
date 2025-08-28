import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Page() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // This is handled by the middleware
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Sempre preferir login ao entrar pela raiz quando não há sessão válida
  if (!session) {
    redirect('/login');
  }

  // Sessão existe: validar perfil
  const { data: profile, error } = await supabase
    .from('company_profiles')
    .select('trial_end, status')
    .eq('user_id', session.user.id)
    .single();

  if (error || !profile) {
    // Sem perfil ainda: enviar para criar perfil
    redirect('/create-profile');
  }

  const now = new Date();
  const trialEnd = new Date(profile.trial_end);
  const isTrialExpired = now > trialEnd;

  // Apenas direciona ao dashboard para status ativo ou trial válido
  if (
    profile.status === 'active' ||
    (!isTrialExpired && profile.status === 'trial')
  ) {
    redirect('/dashboard');
  }

  // Outros casos (ex: trial expirado) ainda permitem criar perfil a partir da raiz
  redirect('/create-profile');
}
