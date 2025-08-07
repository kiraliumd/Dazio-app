import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircleIcon } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionCancelPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <XCircleIcon className="w-16 h-16 text-red-500" />
            </div>
            <CardTitle className="text-2xl">Assinatura Cancelada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              O processo de assinatura foi cancelado. Nenhuma cobrança foi realizada.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">Ainda tem dúvidas?</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Entre em contato conosco para tirar dúvidas</li>
                <li>• Você pode tentar novamente a qualquer momento</li>
                <li>• Oferecemos 7 dias de teste gratuito</li>
                <li>• Cancele a qualquer momento sem compromisso</li>
              </ul>
            </div>

            <div className="flex gap-4 justify-center">
              <Link href="/assinatura">
                <Button className="bg-blue-500 hover:bg-blue-600">
                  Tentar Novamente
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline">
                  Voltar ao Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 