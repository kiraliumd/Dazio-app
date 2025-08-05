import { supabase } from "../supabase"
import { createClient } from "../supabase/server"

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
 * Obtém o company_id do usuário autenticado (versão servidor)
 */
export async function getCurrentUserCompanyIdServer(): Promise<string | null> {
  try {
    const supabaseServer = await createClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    
    if (!user) {
      console.error('❌ getCurrentUserCompanyIdServer: Usuário não autenticado')
      return null
    }

    const { data: companyProfile, error } = await supabaseServer
      .from('company_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('❌ getCurrentUserCompanyIdServer: Erro ao buscar perfil da empresa:', error)
      return null
    }

    return companyProfile.id
  } catch (error) {
    console.error('❌ getCurrentUserCompanyIdServer: Erro inesperado:', error)
    return null
  }
}

/**
 * Obtém o company_id por user_id (versão servidor)
 */
export async function getCompanyIdByUserId(userId: string): Promise<string | null> {
  try {
    const supabaseServer = await createClient()
    
    const { data: companyProfile, error } = await supabaseServer
      .from('company_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('❌ getCompanyIdByUserId: Erro ao buscar perfil da empresa:', error)
      return null
    }

    return companyProfile.id
  } catch (error) {
    console.error('❌ getCompanyIdByUserId: Erro inesperado:', error)
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