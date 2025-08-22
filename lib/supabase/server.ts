import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  try {
    const cookieStore = await cookies();

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              console.warn('Erro ao definir cookies no servidor:', error);
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
        auth: {
          persistSession: false, // Importante: não persistir sessão no servidor
          autoRefreshToken: false, // Importante: não auto-refresh no servidor
        },
      }
    );
  } catch (error) {
    console.error('Erro ao criar cliente Supabase do servidor:', error);
    throw error;
  }
}
