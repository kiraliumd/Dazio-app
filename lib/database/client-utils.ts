import { supabase } from "../supabase"

/**
 * Obtém o company_id do usuário autenticado (versão cliente)
 */
export async function getCurrentUserCompanyId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('❌ getCurrentUserCompanyId: Usuário não autenticado')
      return null
    }

    const { data: companyProfile, error } = await supabase
      .from('company_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('❌ getCurrentUserCompanyId: Erro ao buscar perfil da empresa:', error)
      return null
    }

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