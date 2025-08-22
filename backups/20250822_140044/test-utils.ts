import { supabase } from "../supabase"

/**
 * Testa a autenticação e acesso aos dados
 */
export async function testAuthenticationAndAccess() {
  console.log('🧪 TESTE: Iniciando diagnóstico de autenticação e acesso')
  
  try {
    // 1. Verificar usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ TESTE: Erro ao obter usuário:', userError)
      return { success: false, error: 'Erro ao obter usuário' }
    }
    
    if (!user) {
      console.error('❌ TESTE: Usuário não autenticado')
      return { success: false, error: 'Usuário não autenticado' }
    }
    
    console.log('✅ TESTE: Usuário autenticado:', user.email, 'ID:', user.id)
    
    // 2. Testar acesso direto à tabela company_profiles
    const { data: companyProfile, error: profileError } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (profileError) {
      console.error('❌ TESTE: Erro ao acessar company_profiles:', profileError)
      return { success: false, error: 'Erro ao acessar company_profiles', details: profileError }
    }
    
    if (!companyProfile) {
      console.error('❌ TESTE: Perfil da empresa não encontrado')
      return { success: false, error: 'Perfil da empresa não encontrado' }
    }
    
    console.log('✅ TESTE: Perfil da empresa encontrado:', companyProfile)
    
    // 3. Testar acesso aos dados com RLS
    const { data: budgets, error: budgetsError } = await supabase
      .from('budgets')
      .select('id, number, company_id')
      .limit(5)
    
    if (budgetsError) {
      console.error('❌ TESTE: Erro ao acessar budgets:', budgetsError)
      return { success: false, error: 'Erro ao acessar budgets', details: budgetsError }
    }
    
    console.log('✅ TESTE: Budgets acessados com sucesso:', budgets?.length || 0, 'registros')
    
    // 4. Testar acesso aos clientes
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, company_id')
      .limit(5)
    
    if (clientsError) {
      console.error('❌ TESTE: Erro ao acessar clients:', clientsError)
      return { success: false, error: 'Erro ao acessar clients', details: clientsError }
    }
    
    console.log('✅ TESTE: Clients acessados com sucesso:', clients?.length || 0, 'registros')
    
    // 5. Testar acesso aos equipamentos
    const { data: equipments, error: equipmentsError } = await supabase
      .from('equipments')
      .select('id, name, company_id')
      .limit(5)
    
    if (equipmentsError) {
      console.error('❌ TESTE: Erro ao acessar equipments:', equipmentsError)
      return { success: false, error: 'Erro ao acessar equipments', details: equipmentsError }
    }
    
    console.log('✅ TESTE: Equipments acessados com sucesso:', equipments?.length || 0, 'registros')
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      company: companyProfile,
      data: {
        budgets: budgets?.length || 0,
        clients: clients?.length || 0,
        equipments: equipments?.length || 0
      }
    }
    
  } catch (error) {
    console.error('❌ TESTE: Erro inesperado:', error)
    return { success: false, error: 'Erro inesperado', details: error }
  }
}

/**
 * Testa a função get_user_company_id() do banco
 */
export async function testDatabaseFunction() {
  console.log('🧪 TESTE: Testando função get_user_company_id()')
  
  try {
    const { data, error } = await supabase.rpc('get_user_company_id')
    
    if (error) {
      console.error('❌ TESTE: Erro na função get_user_company_id:', error)
      return { success: false, error: 'Erro na função get_user_company_id', details: error }
    }
    
    console.log('✅ TESTE: Função get_user_company_id retornou:', data)
    return { success: true, companyId: data }
    
  } catch (error) {
    console.error('❌ TESTE: Erro inesperado na função:', error)
    return { success: false, error: 'Erro inesperado na função', details: error }
  }
} 