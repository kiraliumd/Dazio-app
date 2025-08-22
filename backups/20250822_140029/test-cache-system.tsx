"use client"

import { useState } from 'react'
import { useBudgetsWithCRUD } from '@/lib/hooks/use-optimized-data'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function TestCacheSystem() {
  const [testBudget, setTestBudget] = useState({
    clientId: 'test-client',
    clientName: 'Cliente Teste',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    installationLocation: 'Local Teste',
    subtotal: 1000,
    discount: 100,
    totalValue: 900,
    status: 'Pendente' as const,
    observations: 'Orçamento de teste para validar cache',
    isRecurring: false,
  })

  const [testItems] = useState([
    {
      equipmentName: 'Equipamento Teste',
      quantity: 2,
      dailyRate: 50,
      days: 10,
      total: 1000,
    }
  ])

  const { 
    data: budgets, 
    loading, 
    error, 
    createBudget, 
    updateBudget, 
    deleteBudget,
    forceRefresh 
  } = useBudgetsWithCRUD(10)

  const handleCreateTestBudget = async () => {
    try {
      if (process.env.NODE_ENV === "development") { console.log('🧪 Teste: Criando orçamento de teste...')
      const result = await createBudget(testBudget, testItems)
      if (process.env.NODE_ENV === "development") { console.log('✅ Teste: Orçamento criado:', result)
      
      // O cache deve ser invalidado automaticamente
      // e a lista deve ser atualizada em tempo real
    } catch (error) {
      if (process.env.NODE_ENV === "development") { console.error('❌ Teste: Erro ao criar orçamento:', error)
    }
  }

  const handleUpdateTestBudget = async (id: string) => {
    try {
      if (process.env.NODE_ENV === "development") { console.log('🧪 Teste: Atualizando orçamento...')
      const updateData = { ...testBudget, totalValue: 950 }
      const result = await updateBudget(id, updateData, testItems)
      if (process.env.NODE_ENV === "development") { console.log('✅ Teste: Orçamento atualizado:', result)
      
      // O cache deve ser invalidado automaticamente
      // e as alterações devem aparecer imediatamente
    } catch (error) {
      if (process.env.NODE_ENV === "development") { console.error('❌ Teste: Erro ao atualizar orçamento:', error)
    }
  }

  const handleDeleteTestBudget = async (id: string) => {
    try {
      if (process.env.NODE_ENV === "development") { console.log('🧪 Teste: Excluindo orçamento...')
      const result = await deleteBudget(id)
      if (process.env.NODE_ENV === "development") { console.log('✅ Teste: Orçamento excluído:', result)
      
      // O cache deve ser invalidado automaticamente
      // e o orçamento deve ser removido da lista
    } catch (error) {
      if (process.env.NODE_ENV === "development") { console.error('❌ Teste: Erro ao excluir orçamento:', error)
    }
  }

  const handleForceRefresh = () => {
    if (process.env.NODE_ENV === "development") { console.log('🧪 Teste: Forçando refresh manual...')
    forceRefresh()
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Teste do Sistema de Cache
          <Badge variant="secondary">Cache Automático</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Teste o sistema de cache em tempo real. Crie, edite e exclua orçamentos para ver
          como o cache é invalidado automaticamente e a lista é atualizada em tempo real.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Controles de Teste */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleCreateTestBudget} variant="default">
            ➕ Criar Orçamento Teste
          </Button>
          <Button onClick={handleForceRefresh} variant="outline">
            🔄 Refresh Manual
          </Button>
        </div>

        {/* Status do Sistema */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-900">Status</div>
            <div className="text-2xl font-bold text-blue-700">
              {loading ? '⏳' : '✅'}
            </div>
            <div className="text-xs text-blue-600">
              {loading ? 'Carregando...' : 'Pronto'}
            </div>
          </div>
          
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-sm font-medium text-green-900">Orçamentos</div>
            <div className="text-2xl font-bold text-green-700">
              {budgets?.length || 0}
            </div>
            <div className="text-xs text-green-600">
              {budgets?.length || 0} orçamento(s) carregado(s)
            </div>
          </div>
          
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="text-sm font-medium text-purple-900">Cache</div>
            <div className="text-2xl font-bold text-purple-700">
              🧠
            </div>
            <div className="text-xs text-purple-600">
              Sistema ativo
            </div>
          </div>
        </div>

        {/* Lista de Orçamentos */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Orçamentos em Tempo Real</h3>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-800">❌ Erro: {error.message}</div>
            </div>
          )}
          
          {loading && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm text-yellow-800">⏳ Carregando orçamentos...</div>
            </div>
          )}
          
          {budgets && budgets.length > 0 ? (
            <div className="space-y-2">
              {budgets.slice(0, 5).map((budget: any) => (
                <div key={budget.id} className="p-3 border rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-medium">{budget.number || 'Sem número'}</div>
                    <div className="text-sm text-muted-foreground">
                      {budget.clientName} - R$ {budget.totalValue}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleUpdateTestBudget(budget.id)}
                    >
                      ✏️ Editar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDeleteTestBudget(budget.id)}
                    >
                      🗑️ Excluir
                    </Button>
                  </div>
                </div>
              ))}
              
              {budgets.length > 5 && (
                <div className="text-sm text-muted-foreground text-center py-2">
                  ... e mais {budgets.length - 5} orçamento(s)
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <div className="text-sm text-gray-600">
                Nenhum orçamento encontrado. Crie um orçamento de teste para começar!
              </div>
            </div>
          )}
        </div>

        {/* Instruções */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">📋 Como Testar:</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Clique em "Criar Orçamento Teste" para adicionar um novo orçamento</li>
            <li>Observe como ele aparece imediatamente na lista (sem refresh)</li>
            <li>Clique em "Editar" para modificar um orçamento existente</li>
            <li>Observe como as alterações são refletidas em tempo real</li>
            <li>Clique em "Excluir" para remover um orçamento</li>
            <li>Observe como ele é removido da lista imediatamente</li>
          </ol>
          
          <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800">
            💡 <strong>Dica:</strong> Abra o console do navegador para ver os logs de 
            invalidação de cache em tempo real!
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
