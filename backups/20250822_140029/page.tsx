import { TestSubscription } from '@/components/subscription/test-subscription';
import { SimpleTest } from '@/components/subscription/simple-test';
import { TestWithoutAuth } from '@/components/subscription/test-without-auth';
import { TestStripeNoAuth } from '@/components/subscription/test-stripe-no-auth';
import { TestSupabase } from '@/components/test-supabase';

export default function TesteStripePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">
            Teste de Integração
          </h1>
          <p className="text-gray-600">
            Página para testar as integrações
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Teste Supabase</h2>
            <TestSupabase />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Teste Simples</h2>
            <SimpleTest />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Teste API</h2>
            <TestWithoutAuth />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Teste Stripe (Sem Auth)</h2>
            <TestStripeNoAuth />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Teste Stripe (Com Auth)</h2>
            <TestSubscription />
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Status da Configuração</h2>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Variáveis de Ambiente</h3>
              <ul className="text-sm space-y-1">
                <li>✅ STRIPE_SECRET_KEY: {process.env.STRIPE_SECRET_KEY ? 'Configurada' : 'Não configurada'}</li>
                <li>✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'Configurada' : 'Não configurada'}</li>
                <li>✅ STRIPE_WEBHOOK_SECRET: {process.env.STRIPE_WEBHOOK_SECRET ? 'Configurada' : 'Não configurada'}</li>
                <li>✅ NEXT_PUBLIC_APP_URL: {process.env.NEXT_PUBLIC_APP_URL ? 'Configurada' : 'Não configurada'}</li>
                <li>✅ NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configurada' : 'Não configurada'}</li>
                <li>✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configurada' : 'Não configurada'}</li>
                <li>✅ STRIPE_MONTHLY_PRICE_ID: {process.env.STRIPE_MONTHLY_PRICE_ID || 'Não configurado'}</li>
                <li>✅ STRIPE_ANNUAL_PRICE_ID: {process.env.STRIPE_ANNUAL_PRICE_ID || 'Não configurado'}</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Produtos Stripe</h3>
              <ul className="text-sm space-y-1">
                <li>✅ Plano Mensal: prod_Sn2n2D1UuSgF4u</li>
                <li>✅ Plano Anual: prod_Sn2ndrRgXRp0rC</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Banco de Dados</h3>
              <ul className="text-sm space-y-1">
                <li>✅ Tabela subscriptions: Criada</li>
                <li>✅ Tabela subscription_payments: Criada</li>
                <li>✅ Tabela company_profiles: Criada</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 