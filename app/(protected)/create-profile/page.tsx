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
    city: '',
    state: '',
    zip_code: '',
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

  const validateForm = () => {
    const requiredFields = [
      { field: 'company_name', label: 'Nome da empresa' },
      { field: 'cnpj', label: 'CNPJ' },
      { field: 'address', label: 'Endereço' },
      { field: 'city', label: 'Cidade' },
      { field: 'state', label: 'Estado' },
      { field: 'zip_code', label: 'CEP' },
      { field: 'phone', label: 'Telefone' }
    ];

    for (const { field, label } of requiredFields) {
      if (!formData[field as keyof typeof formData] || formData[field as keyof typeof formData].trim() === '') {
        toast.error(`Campo obrigatório: ${label}`);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      console.log('🔍 Create Profile: Iniciando criação de perfil...');
      console.log('🔍 Create Profile: Dados do formulário:', formData);

      // Validar e preparar dados para inserção
      const profileData = {
        user_id: user.id,
        company_name: formData.company_name.trim(),
        cnpj: formData.cnpj.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zip_code: formData.zip_code.trim(),
        phone: formData.phone.trim(),
        website: formData.website?.trim() || null,
        industry: null,
        employee_count: null,
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
        status: 'trial'
      };

      // Verificar se todos os campos obrigatórios estão preenchidos
      const requiredFields = ['company_name', 'cnpj', 'address', 'city', 'state', 'zip_code', 'phone'];
      for (const field of requiredFields) {
        if (!profileData[field as keyof typeof profileData] || profileData[field as keyof typeof profileData] === '') {
          console.error(`❌ Create Profile: Campo obrigatório vazio: ${field}`);
          toast.error(`Campo obrigatório não preenchido: ${field}`);
          return;
        }
      }

      console.log('🔍 Create Profile: Dados para inserção:', profileData);

      const { data: profileResult, error: profileError } = await supabase
        .from('company_profiles')
        .insert(profileData)
        .select()
        .single();

      if (profileError) {
        console.error('❌ Create Profile: Erro ao criar perfil:', profileError);
        toast.error(`Erro ao criar perfil da empresa: ${profileError.message}`);
        return;
      }

      console.log('✅ Create Profile: Perfil criado com sucesso:', profileResult);

      // Atualizar template padrão diretamente no profile (já migrado)
      const settingsData = {
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
      };

      console.log('🔍 Create Profile: Atualizando template no profile...');

      const { error: settingsError } = await supabase
        .from('company_profiles')
        .update(settingsData)
        .eq('id', profileResult.id)
        .select('id')
        .single();

      if (settingsError) {
        console.error('❌ Create Profile: Erro ao criar configurações:', settingsError);
        toast.error(`Erro ao criar configurações da empresa: ${settingsError.message}`);
        return;
      }

      console.log('✅ Create Profile: Template atualizado no profile');

      toast.success('Perfil da empresa criado com sucesso!');
      router.push('/');

    } catch (error) {
      console.error('❌ Create Profile: Erro inesperado:', error);
      toast.error('Erro inesperado ao criar perfil da empresa');
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
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Criar Perfil da Empresa</CardTitle>
          <CardDescription>
            Complete as informações da sua empresa para começar a usar o Dazio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  required
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
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
            </div>

            <div>
              <Label htmlFor="address">Endereço *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                placeholder="Rua, número, bairro"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                  placeholder="São Paulo"
                />
              </div>

              <div>
                <Label htmlFor="state">Estado *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                  placeholder="SP"
                />
              </div>

              <div>
                <Label htmlFor="zip_code">CEP *</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  required
                  placeholder="00000-000"
                />
              </div>
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