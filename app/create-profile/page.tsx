'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function CreateProfilePage() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    company_name: '',
    cnpj: '',
    address: '',
    phone: '',
    website: ''
  });
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);

    // Verificar se já tem perfil
    const { data: profile } = await supabase
      .from('company_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      router.push('/dashboard');
      return;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      // Criar perfil da empresa
      const { data: profileResult, error: profileError } = await supabase
        .from('company_profiles')
        .insert({
          user_id: user.id,
          company_name: formData.company_name,
          cnpj: formData.cnpj,
          address: formData.address,
          phone: formData.phone,
          website: formData.website
        })
        .select()
        .single();

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError);
        toast.error('Erro ao criar perfil da empresa');
        return;
      }

      // Criar configurações da empresa
      const { error: settingsError } = await supabase
        .from('company_settings')
        .insert({
          company_id: profileResult.id,
          company_name: formData.company_name,
          cnpj: formData.cnpj,
          address: formData.address,
          phone: formData.phone,
          website: formData.website,
          contract_template: `CONTRATO DE LOCAÇÃO DE EQUIPAMENTOS

CONTRATANTE: {company_name}
CNPJ: {cnpj}
Endereço: {address}
Telefone: {phone}

CONTRATADO: {client_name}
Documento: {client_document}
Endereço: {client_address}
Telefone: {client_phone}
Email: {client_email}

OBJETO DO CONTRATO:
A locação dos seguintes equipamentos:

{equipment_list}

PERÍODO DE LOCAÇÃO:
Data de início: {start_date}
Data de término: {end_date}
Horário de instalação: {installation_time}
Horário de retirada: {removal_time}

LOCAL DE INSTALAÇÃO:
{installation_location}

VALORES:
Valor total: R$ {total_value}
Desconto: R$ {discount}
Valor final: R$ {final_value}

CONDIÇÕES GERAIS:
1. O contratado se compromete a devolver os equipamentos no estado em que foram recebidos.
2. Qualquer dano ou perda será de responsabilidade do contratado.
3. O pagamento deve ser realizado conforme acordado entre as partes.
4. Este contrato está sujeito às leis brasileiras.

Assinaturas:

_____________________
{company_name}
Contratante

_____________________
{client_name}
Contratado

Data: {contract_date}`
        });

      if (settingsError) {
        console.error('Erro ao criar configurações:', settingsError);
        toast.error('Erro ao criar configurações da empresa');
        return;
      }

      toast.success('Perfil da empresa criado com sucesso!');
      router.push('/dashboard');

    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Criar Perfil da Empresa</CardTitle>
          <CardDescription>
            Complete as informações da sua empresa para começar a usar o Dazio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="company_name">Nome da Empresa *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                required
                placeholder="Digite o nome da sua empresa"
              />
            </div>

            <div>
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div>
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua, número, bairro, cidade"
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.suaempresa.com.br"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando perfil...
                </>
              ) : (
                'Criar Perfil'
              )}
            </Button>
          </form>

          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Esta página é temporária para usuários que não têm perfil de empresa.
              Após criar o perfil, você será redirecionado para o dashboard.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
} 