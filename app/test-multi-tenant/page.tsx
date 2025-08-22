'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  testAuthenticationAndAccess,
  testDatabaseFunction,
} from '@/lib/database/test-utils';
import {
  getCurrentUserCompanyId,
  getCurrentUserCompanyProfile,
} from '@/lib/database/client-utils';
import { useAuth } from '@/lib/auth-context';

export default function TestMultiTenantPage() {
  const { user, session } = useAuth();
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [hasLoadedCompanyInfo, setHasLoadedCompanyInfo] = useState(false);

  useEffect(() => {
    if (user && !hasLoadedCompanyInfo) {
      loadCompanyInfo();
      setHasLoadedCompanyInfo(true);
    }
  }, [user]); // Apenas user como dependência

  const loadCompanyInfo = async () => {
    try {
      console.log('🔄 Carregando informações da empresa...');
      const id = await getCurrentUserCompanyId();
      const profile = await getCurrentUserCompanyProfile();
      setCompanyId(id);
      setCompanyProfile(profile);
      console.log('✅ Informações da empresa carregadas');
    } catch (error) {
      console.error('Erro ao carregar informações da empresa:', error);
    }
  };

  const runTests = async () => {
    setLoading(true);
    try {
      const results = await testAuthenticationAndAccess();
      const functionResults = await testDatabaseFunction();

      setTestResults({
        auth: results,
        function: functionResults,
      });
    } catch (error) {
      console.error('Erro ao executar testes:', error);
      setTestResults({ error: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Teste Multi-Tenant</CardTitle>
          <CardDescription>
            Teste de funcionalidades multi-tenant e isolamento de dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Status da Autenticação</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={user ? 'default' : 'destructive'}>
                    {user ? 'Autenticado' : 'Não Autenticado'}
                  </Badge>
                </div>
                {user && (
                  <div className="text-sm text-muted-foreground">
                    <p>Email: {user.email}</p>
                    <p>ID: {user.id}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Informações da Empresa</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={companyId ? 'default' : 'destructive'}>
                    {companyId
                      ? 'Empresa Encontrada'
                      : 'Empresa Não Encontrada'}
                  </Badge>
                </div>
                {companyId && (
                  <div className="text-sm text-muted-foreground">
                    <p>Company ID: {companyId}</p>
                    {companyProfile && (
                      <p>Nome: {companyProfile.company_name}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={runTests}
              disabled={loading || !user}
              className="w-full"
            >
              {loading ? 'Executando Testes...' : 'Executar Testes'}
            </Button>
          </div>

          {testResults && (
            <div className="mt-6">
              <h3 className="font-semibold mb-4">Resultados dos Testes</h3>
              <div className="space-y-4">
                {testResults.error ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <h4 className="font-medium text-red-800">Erro</h4>
                    <p className="text-red-600">{String(testResults.error)}</p>
                  </div>
                ) : (
                  <>
                    {testResults.auth && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">
                            Teste de Autenticação
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                            {JSON.stringify(testResults.auth, null, 2)}
                          </pre>
                        </CardContent>
                      </Card>
                    )}

                    {testResults.function && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">
                            Teste de Função
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                            {JSON.stringify(testResults.function, null, 2)}
                          </pre>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
