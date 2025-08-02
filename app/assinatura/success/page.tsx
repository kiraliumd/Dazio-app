import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircleIcon } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircleIcon className="w-16 h-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Assinatura Criada com Sucesso!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              Parabéns! Sua assinatura foi criada com sucesso. Você agora tem acesso completo ao sistema Dazio Admin.
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-800 mb-2">O que acontece agora?</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Você tem 7 dias de teste gratuito</li>
                <li>• Após o período de teste, será cobrado automaticamente</li>
                <li>• Você pode cancelar a qualquer momento</li>
                <li>• Acesse todas as funcionalidades do sistema</li>
              </ul>
            </div>

            <div className="flex gap-4 justify-center">
              <Link href="/dashboard">
                <Button className="bg-blue-500 hover:bg-blue-600">
                  Ir para o Dashboard
                </Button>
              </Link>
              <Link href="/assinatura/dashboard">
                <Button variant="outline">
                  Gerenciar Assinatura
                </Button>
              </Link>
            </div>

            {searchParams.session_id && (
              <p className="text-xs text-gray-500 mt-4">
                ID da sessão: {searchParams.session_id}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 