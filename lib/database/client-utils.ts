import { supabase } from "../supabase"

/**
 * Obtém o company_id do usuário autenticado (versão cliente)
 */
export async function getCurrentUserCompanyId(): Promise<string | null> {
  try {
    console.log('🔍 getCurrentUserCompanyId: Iniciando busca do company_id')
    
    // 1. Verificar se há usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ getCurrentUserCompanyId: Erro ao obter usuário:', userError)
      return null
    }
    
    if (!user) {
      console.error('❌ getCurrentUserCompanyId: Usuário não autenticado')
      return null
    }

    console.log('🔍 getCurrentUserCompanyId: Usuário encontrado:', user.email, 'ID:', user.id)

    // 2. Buscar o perfil da empresa
    const { data: companyProfile, error } = await supabase
      .from('company_profiles')
      .select('id, company_name')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('❌ getCurrentUserCompanyId: Erro ao buscar perfil da empresa:', error)
      
      // Se não encontrou perfil, vamos verificar se existe algum
      const { data: allProfiles, error: listError } = await supabase
        .from('company_profiles')
        .select('id, user_id, company_name')
        .limit(5)
      
      if (listError) {
        console.error('❌ getCurrentUserCompanyId: Erro ao listar perfis:', listError)
      } else {
        console.log('🔍 getCurrentUserCompanyId: Perfis existentes:', allProfiles)
      }
      
      return null
    }

    console.log('✅ getCurrentUserCompanyId: Company ID encontrado:', companyProfile.id, 'Empresa:', companyProfile.company_name)
    return companyProfile.id
  } catch (error) {
    console.error('❌ getCurrentUserCompanyId: Erro inesperado:', error)
    return null
  }
}

/**
 * Verifica se o usuário tem acesso a um recurso específico da empresa
 */
export async function validateCompanyAccess(companyId: string): Promise<boolean> {
  try {
    const userCompanyId = await getCurrentUserCompanyId()
    return userCompanyId === companyId
  } catch (error) {
    console.error('❌ validateCompanyAccess: Erro ao validar acesso:', error)
    return false
  }
}

/**
 * Obtém informações completas do perfil da empresa do usuário atual
 */
export async function getCurrentUserCompanyProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return null
    }

    const { data: companyProfile, error } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('❌ getCurrentUserCompanyProfile: Erro:', error)
      return null
    }

    return companyProfile
  } catch (error) {
    console.error('❌ getCurrentUserCompanyProfile: Erro inesperado:', error)
    return null
  }
} 