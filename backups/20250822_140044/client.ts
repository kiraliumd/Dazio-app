import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Criar o cliente Supabase
const supabaseClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'dazio-auth'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'dazio-admin'
    }
  }
});

// Exportar o cliente diretamente
export const supabase = supabaseClient;

// Função helper para criar cliente (mantém compatibilidade)
export function createClient() {
  return supabaseClient;
} 