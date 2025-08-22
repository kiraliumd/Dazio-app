import { supabase } from '../supabase';

// Cache para evitar chamadas repetidas
let companyIdCache: {
  id: string | null;
  timestamp: number;
  ttl: number;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Obtém o company_id do usuário autenticado (versão cliente)
 */
export async function getCurrentUserCompanyId(): Promise<string | null> {
  try {
    // Verificar cache primeiro
    if (
      companyIdCache &&
      Date.now() - companyIdCache.timestamp < companyIdCache.ttl
    ) {
      console.log(
        '🔍 getCurrentUserCompanyId: Usando cache, ID:',
        companyIdCache.id
      );
      return companyIdCache.id;
    }

    console.log('🔍 getCurrentUserCompanyId: Iniciando busca do company_id');

    // 1. Verificar se há usuário autenticado
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error(
        '❌ getCurrentUserCompanyId: Erro ao obter usuário:',
        userError
      );
      return null;
    }

    if (!user) {
      console.error('❌ getCurrentUserCompanyId: Usuário não autenticado');
      return null;
    }

    console.log(
      '🔍 getCurrentUserCompanyId: Usuário encontrado:',
      user.email,
      'ID:',
      user.id
    );

    // 2. Buscar o perfil da empresa
    const { data: companyProfile, error } = await supabase
      .from('company_profiles')
      .select('id, company_name')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error(
        '❌ getCurrentUserCompanyId: Erro ao buscar perfil da empresa:',
        error
      );

      // Se não encontrou perfil, verificar se é erro de "não encontrado"
      if (error.code === 'PGRST116') {
        console.log(
          '⚠️ getCurrentUserCompanyId: Usuário não tem perfil de empresa criado'
        );

        // Redirecionar para página de criação de perfil se estiver no browser
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (
            currentPath !== '/create-profile' &&
            currentPath !== '/login' &&
            currentPath !== '/cadastro'
          ) {
            console.log(
              '🔄 getCurrentUserCompanyId: Redirecionando para criação de perfil'
            );
            window.location.href = '/create-profile';
            return null;
          }
        }
      }

      // Se não encontrou perfil, vamos verificar se existe algum
      const { data: allProfiles, error: listError } = await supabase
        .from('company_profiles')
        .select('id, user_id, company_name')
        .limit(5);

      if (listError) {
        console.error(
          '❌ getCurrentUserCompanyId: Erro ao listar perfis:',
          listError
        );
      } else {
        console.log(
          '🔍 getCurrentUserCompanyId: Perfis existentes:',
          allProfiles
        );
      }

      // Cachear resultado negativo por um tempo menor
      companyIdCache = {
        id: null,
        timestamp: Date.now(),
        ttl: 1 * 60 * 1000, // 1 minuto para resultados negativos
      };

      return null;
    }

    console.log(
      '✅ getCurrentUserCompanyId: Company ID encontrado:',
      companyProfile.id,
      'Empresa:',
      companyProfile.company_name
    );

    // Cachear resultado positivo
    companyIdCache = {
      id: companyProfile.id,
      timestamp: Date.now(),
      ttl: CACHE_TTL,
    };

    return companyProfile.id;
  } catch (error) {
    console.error('❌ getCurrentUserCompanyId: Erro inesperado:', error);
    return null;
  }
}

/**
 * Limpa o cache do company_id (útil para logout ou mudanças de usuário)
 */
export function clearCompanyIdCache() {
  companyIdCache = null;
  console.log('🧹 getCurrentUserCompanyId: Cache limpo');
}

/**
 * Verifica se o usuário tem acesso a um recurso específico da empresa
 */
export async function validateCompanyAccess(
  companyId: string
): Promise<boolean> {
  try {
    const userCompanyId = await getCurrentUserCompanyId();
    return userCompanyId === companyId;
  } catch (error) {
    console.error('❌ validateCompanyAccess: Erro ao validar acesso:', error);
    return false;
  }
}

/**
 * Obtém informações completas do perfil da empresa do usuário atual
 */
export async function getCurrentUserCompanyProfile() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: companyProfile, error } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('❌ getCurrentUserCompanyProfile: Erro:', error);

      // Se não encontrou perfil, redirecionar para criação
      if (error.code === 'PGRST116' && typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (
          currentPath !== '/create-profile' &&
          currentPath !== '/login' &&
          currentPath !== '/cadastro'
        ) {
          console.log(
            '🔄 getCurrentUserCompanyProfile: Redirecionando para criação de perfil'
          );
          window.location.href = '/create-profile';
        }
      }

      return null;
    }

    return companyProfile;
  } catch (error) {
    console.error('❌ getCurrentUserCompanyProfile: Erro inesperado:', error);
    return null;
  }
}
