'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { testAuthenticationAndAccess, testDatabaseFunction } from '@/lib/database/test-utils'
import { getCurrentUserCompanyId, getCurrentUserCompanyProfile } from '@/lib/database/client-utils'
import { useAuth } from '@/lib/auth-context'

export default function TestMultiTenantPage() {
  const { user, session } = useAuth()
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [companyProfile, setCompanyProfile] = useState<any>(null)

  useEffect(() => {
    if (user) {
      loadCompanyInfo()
    }
  }, [user])

  const loadCompanyInfo = async () => {
    try {
      const id = await getCurrentUserCompanyId()
      const profile = await getCurrentUserCompanyProfile()
      setCompanyId(id)
      setCompanyProfile(profile)
    } catch (error) {
      console.error('Erro ao carregar informações da empresa:', error)
    }
  }

  const runTests = async () => {
    setLoading(true)
    try {
      const results = await testAuthenticationAndAccess()
      const functionResults = await testDatabaseFunction()
      
      setTestResults({
        auth: results,
        function: functionResults
      })
    } catch (error) {
      console.error('Erro ao executar testes:', error)
      setTestResults({ error: error })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Teste Multi-Tenant</h1>
        <Button onClick={runTests} disabled={loading}>
          {loading ? 'Executando...' : 'Executar Testes'}
        </Button>
      </div>

      {/* Informações do Usuário */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <strong>Email:</strong> {user?.email || 'Não autenticado'}
            </div>
            <div>
              <strong>User ID:</strong> {user?.id || 'N/A'}
            </div>
            <div>
              <strong>Status:</strong> 
              <Badge variant={user ? 'default' : 'destructive'} className="ml-2">
                {user ? 'Autenticado' : 'Não autenticado'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações da Empresa */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <strong>Company ID:</strong> {companyId || 'Não encontrado'}
            </div>
            <div>
              <strong>Nome da Empresa:</strong> {companyProfile?.company_name || 'N/A'}
            </div>
            <div>
              <strong>CNPJ:</strong> {companyProfile?.cnpj || 'N/A'}
            </div>
            <div>
              <strong>Status:</strong> 
              <Badge variant={companyProfile ? 'default' : 'destructive'} className="ml-2">
                {companyProfile ? 'Encontrado' : 'Não encontrado'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados dos Testes */}
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados dos Testes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Teste de Autenticação */}
              <div>
                <h3 className="font-semibold mb-2">Teste de Autenticação e Acesso</h3>
                <div className="bg-gray-100 p-3 rounded">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(testResults.auth, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Teste da Função do Banco */}
              <div>
                <h3 className="font-semibold mb-2">Teste da Função get_user_company_id()</h3>
                <div className="bg-gray-100 p-3 rounded">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(testResults.function, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Resumo */}
              <div className="mt-4 p-4 bg-blue-50 rounded">
                <h3 className="font-semibold mb-2">Resumo</h3>
                <div className="space-y-1">
                  <div>
                    <strong>Autenticação:</strong> 
                    <Badge variant={testResults.auth?.success ? 'default' : 'destructive'} className="ml-2">
                      {testResults.auth?.success ? 'OK' : 'ERRO'}
                    </Badge>
                  </div>
                  <div>
                    <strong>Função do Banco:</strong> 
                    <Badge variant={testResults.function?.success ? 'default' : 'destructive'} className="ml-2">
                      {testResults.function?.success ? 'OK' : 'ERRO'}
                    </Badge>
                  </div>
                  <div>
                    <strong>Dados Encontrados:</strong> 
                    {testResults.auth?.success && (
                      <span className="ml-2">
                        {testResults.auth.data?.budgets || 0} orçamentos, 
                        {testResults.auth.data?.clients || 0} clientes, 
                        {testResults.auth.data?.equipments || 0} equipamentos
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 