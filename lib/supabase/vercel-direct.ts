import { createClient } from '@supabase/supabase-js';

// Cliente para conexão direta do Vercel (sem autenticação de sessão)
export function createVercelDirectClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Chave de serviço para operações diretas

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Cliente para operações que precisam de autenticação de usuário
export function createUserClient(userId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // Definir o usuário atual para operações
  // Método setUser não existe mais na versão atual do Supabase
  // return client.auth.admin.setUser(userId);
  throw new Error('setUser não está disponível na versão atual do Supabase');
}
