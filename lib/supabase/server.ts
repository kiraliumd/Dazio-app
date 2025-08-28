import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  try {
    const cookieStore = await cookies();

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Server Supabase: Cookies disponíveis:', 
        cookieStore.getAll().map(c => c.name)
      );
    }

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const allCookies = cookieStore.getAll();
            if (process.env.NODE_ENV === 'development') {
              console.log('🔍 Server Supabase: getAll() chamado, retornando:', 
                allCookies.map(c => c.name)
              );
            }
            return allCookies;
          },
          setAll(cookiesToSet) {
            try {
              if (process.env.NODE_ENV === 'development') {
                console.log('🔍 Server Supabase: setAll() chamado com:', 
                  cookiesToSet.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' }))
                );
              }
              
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
              
              if (process.env.NODE_ENV === 'development') {
                console.log('✅ Server Supabase: Cookies definidos com sucesso');
              }
            } catch (error) {
              console.warn('❌ Server Supabase: Erro ao definir cookies:', error);
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
    console.error('❌ Server Supabase: Erro ao criar cliente:', error);
    throw error;
  }
}
