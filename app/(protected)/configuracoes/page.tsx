'use client';

import { AuthGuard } from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useCompanyName } from '@/hooks/useCompanyName';
import { AlertCircle, CheckCircle, Key, Lock, Save } from 'lucide-react';
import {
    lazy,
    Suspense,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { AppSidebar } from '../../../components/app-sidebar';
import { PageHeader } from '../../../components/page-header';
import { useAuth } from '../../../lib/auth-context';
import {
    CompanySettings,
    getCompanySettings,
    updateCompanySettings,
} from '../../../lib/database/settings';

// Lazy load do componente pesado
const EquipmentCategoriesManager = lazy(() =>
  import('../../../components/equipment-categories-manager').then(module => ({
    default: module.EquipmentCategoriesManager,
  }))
);

// Componente de loading para lazy components
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
  </div>
);

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [originalSettings, setOriginalSettings] =
    useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { toast } = useToast();
  const { user, updateUser } = useAuth();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { setCompanyName: setHeaderCompanyName } = useCompanyName();

  // Memoizar a função de carregamento
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const companySettings = await getCompanySettings();
      setSettings(companySettings);
      setOriginalSettings(companySettings);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: 'Erro ao carregar dados',
        description:
          'Não foi possível buscar os dados da empresa. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSettings();
  }, []); // Array vazio para executar apenas uma vez

  // Verificar mudanças nos dados - memoizado
  const checkForChanges = useCallback(() => {
    if (settings && originalSettings) {
      const hasAnyChanges = Object.keys(settings).some(key => {
        const typedKey = key as keyof CompanySettings;
        return settings[typedKey] !== originalSettings[typedKey];
      });
      setHasChanges(hasAnyChanges);
    }
  }, [settings, originalSettings]);

  useEffect(() => {
    checkForChanges();
  }, [checkForChanges]);

  // Cleanup timeout quando componente for desmontado
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { id, value } = e.target;
      if (settings) {
        setSettings({ ...settings, [id]: value });
      }
    },
    [settings]
  );

  const handleSave = useCallback(async () => {
    if (!settings) return;

    try {
      setIsSaving(true);
      setSaveSuccess(false);

      await updateCompanySettings({
        company_name: settings.company_name,
        cnpj: settings.cnpj,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        website: settings.website,
        contract_template: settings.contract_template,
      });

      // Atualizar dados originais após salvar
      setOriginalSettings(settings);
      setHasChanges(false);
      setSaveSuccess(true);
      // Atualizar header imediatamente e em outras abas
      if (settings.company_name) {
        setHeaderCompanyName(settings.company_name);
        try {
          sessionStorage.setItem('company_name', settings.company_name);
          window.dispatchEvent(
            new CustomEvent('companyNameChanged', {
              detail: settings.company_name,
            })
          );
        } catch {}
      }

      // Limpar feedback de sucesso após 3 segundos
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);

      toast({
        title: 'Configurações Salvas',
        description: 'Os dados da empresa foram atualizados com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar os dados. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [settings, toast]);

  // Memoizar o handler de mudanças de categorias
  const handleCategoriesChange = useCallback(() => {
    // Forçar recarregamento das categorias em outras páginas
    window.dispatchEvent(new CustomEvent('categoriesChanged'));
  }, []);

  // Memoizar o handler do modelo de exemplo
  const handleUseExampleTemplate = useCallback(() => {
    if (settings) {
      const exampleTemplate = `CONTRATO DE LOCAÇÃO DE BENS MÓVEIS

Pelo presente instrumento de locação de bens móveis que entre si, fazem como LOCADORA: {company_name}, {address}, Telefone: {phone}, CPF/CNPJ: {cnpj}, neste ato representada por seu representante legal infra-assinado e que doravante será designado LOCADORA e de outro lado: {client_name}, situada na {client_address}, doravante denominada LOCATÁRIA, Contrataram a locação dos bens móveis abaixo descritos, com respectivos valores unitários, mediante as condições estabelecidas nas cláusulas seguintes:

1-) OBJETO DO CONTRATO:
A Locadora aluga os bens móveis, abaixo descritos de sua propriedade para uso exclusivo no endereço aqui especificado:

Local de entrega: {installation_location}
Observações: {observations}

PERÍODO: {start_date} às {installation_time} horas até {end_date} às {removal_time} horas totalizando {total_days} dia(s), totalizando {final_value}, {final_value_extenso}.

Forma de Pagamento: Transferência Bancária

EQUIPAMENTOS LOCADOS:
{equipment_list}

CLÁUSULA SEGUNDA: DO PAGAMENTO:
Como pagamento pela locação de bens móveis de que se trata a Cláusula Primeira, a LOCATÁRIA pagará a LOCADORA a importância certa de {final_value}.

CLÁUSULA TERCEIRA:
A LOCATÁRIA fica a obrigação de devolver os materiais locados, ao final do evento ou na loja, no estado em que os recebeu, além de pagar pontualmente o aluguel acordado e de conservá-los como se fossem seus.

Em caso de avaria, extravio, danos por força maior e/ou furto do material locado, a LOCADORA se reserva o direito de emitir cobrança bancária a LOCATÁRIA, no valor correspondente ao reparo e/ou substituição do material conforme preço de reposição descrito no contrato.

CLÁUSULA QUARTA: ANUÊNCIA DAS PARTES:
Caso haja rescisão contratual por uma das partes - depois de assinado o presente contrato, restará para aquele que rescindir pagar uma multa de 50% (cinquenta por cento) do valor total do contrato.

Após o evento realizado, em caso de haver inadimplência de alguma parcela em aberto, fica também estipulada a multa de 2% (dois por cento) do valor total do contrato. Fica reservado o direito da LOCADORA de não realizar a montagem e locação dos materiais ora contratados, caso haja algum inadimplemento ou rescisão contratual mediante notificação.

CLÁUSULA QUINTA: DO PERÍODO E LOCAL:
A data de locação dos materiais descritos na Cláusula Primeira corresponde no período das datas mencionadas.

CLÁUSULA SEXTA: DAS RESPONSABILIDADES:
A LOCATÁRIA se responsabiliza pela retirada, transporte e devolução dos materiais em perfeitas condições de uso no dia, local e hora da devolução dos mesmos, caso escolha retirar e devolver o material na empresa. A LOCATÁRIA também se responsabiliza por conferir o material na entrega e/ou retirada, assim como na recolha e/ou devolução dos mesmos, não sendo aceitas reclamações posteriores. A retirada e devolução dos equipamentos locados serão efetuadas através do comprovante de entrega e de devolução emitidos pela LOCADORA. Os mesmos deverão ser assinados pela LOCADORA e pela LOCATÁRIA ou por representantes autorizados.

CLÁUSULA SÉTIMA: DO FORO:
Em caso de alguma controvérsia as partes elegem o Foro de Cuiabá-MT para dirimir quaisquer problemas que surgir relativos a este contrato.

PARÁGRAFO ÚNICO: Renuncia a LOCATÁRIA qualquer foro diverso a este eleito nesta cláusula por mais privilegiado que seja. Por estarem assim acordados e ajustados, firmam o presente contrato em duas vias de teor e forma igual para um só efeito.

CUIABÁ - MT, {contract_date}

_____________________                    _____________________
{company_name}                           {client_name}
LOCADORA                                 LOCATÁRIA`;
      setSettings({ ...settings, contract_template: exampleTemplate });
    }
  }, [settings]);

  // Memoizar o componente de loading
  const LoadingComponent = useMemo(
    () => (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-gray-600">Carregando...</p>
      </div>
    ),
    []
  );

  // Memoizar o componente de feedback de mudanças
  const ChangesFeedback = useMemo(
    () => (
      <div className="flex items-center gap-2">
        {hasChanges && !isSaving && (
          <div className="flex items-center gap-2 text-amber-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Há alterações não salvas</span>
          </div>
        )}
        {saveSuccess && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>Alterações salvas com sucesso!</span>
          </div>
        )}
      </div>
    ),
    [hasChanges, isSaving, saveSuccess]
  );

  // Memoizar o botão de salvar
  const SaveButton = useMemo(
    () => (
      <Button
        onClick={handleSave}
        disabled={isSaving || loading || !hasChanges}
        className="min-w-[140px]"
      >
        {isSaving ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Salvando...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Salvar Alterações
          </>
        )}
      </Button>
    ),
    [handleSave, isSaving, loading, hasChanges]
  );

  // Componente de configurações de segurança
  function SecuritySettings() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
      e.preventDefault();

      if (newPassword !== confirmPassword) {
        toast({
          title: 'Erro',
          description: 'As senhas não coincidem.',
          variant: 'destructive',
        });
        return;
      }

      if (newPassword.length < 6) {
        toast({
          title: 'Erro',
          description: 'A nova senha deve ter pelo menos 6 caracteres.',
          variant: 'destructive',
        });
        return;
      }

      setPasswordLoading(true);
      try {
        const { error } = await updateUser({ password: newPassword } as any);

        if (error) {
          toast({
            title: 'Erro',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Sucesso',
            description: 'Senha alterada com sucesso!',
          });
          setNewPassword('');
          setConfirmPassword('');
        }
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Erro inesperado ao alterar senha.',
          variant: 'destructive',
        });
      } finally {
        setPasswordLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        {/* Alterar Senha */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Key className="h-5 w-5" />
              Alterar Senha
            </CardTitle>
            <CardDescription>
              Atualize sua senha de acesso ao sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha"
                  required
                  disabled={passwordLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirme a nova senha"
                  required
                  disabled={passwordLoading}
                />
              </div>
              <Button type="submit" disabled={passwordLoading}>
                {passwordLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Alterando...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Alterar Senha
                  </>
                )}
              </Button>
            </form>

            {/* Dicas de Segurança incorporadas */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                🔒 Dicas de Segurança
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use uma senha forte com pelo menos 8 caracteres</li>
                <li>
                  • Combine letras maiúsculas, minúsculas, números e símbolos
                </li>
                <li>• Não compartilhe suas credenciais de acesso</li>
                <li>• Faça logout ao sair do sistema</li>
                <li>• Mantenha seu navegador atualizado</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <PageHeader
            title="Configurações"
            description="Gerencie as informações da sua empresa"
          />

          <main className="flex-1 space-y-6 p-6 bg-gray-50">
            <Tabs defaultValue="company-data">
              <TabsList className="mb-4">
                <TabsTrigger value="company-data">Dados da Empresa</TabsTrigger>
                <TabsTrigger value="equipment-categories">
                  Categorias de Equipamentos
                </TabsTrigger>
                <TabsTrigger value="contract-template">
                  Contrato de Locação
                </TabsTrigger>
                <TabsTrigger value="security">Segurança</TabsTrigger>
              </TabsList>

              <TabsContent value="company-data">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-foreground">
                      Informações da Empresa
                    </CardTitle>
                    <CardDescription>
                      Atualize os dados que aparecerão em documentos e
                      relatórios.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {loading
                      ? LoadingComponent
                      : settings && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label htmlFor="company_name">
                                  Nome da Empresa
                                </Label>
                                <Input
                                  id="company_name"
                                  value={settings.company_name || ''}
                                  onChange={handleInputChange}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="cnpj">CNPJ</Label>
                                <Input
                                  id="cnpj"
                                  value={settings.cnpj || ''}
                                  onChange={handleInputChange}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="address">Endereço</Label>
                              <Textarea
                                id="address"
                                value={settings.address || ''}
                                onChange={handleInputChange}
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label htmlFor="phone">Telefone</Label>
                                <Input
                                  id="phone"
                                  value={settings.phone || ''}
                                  onChange={handleInputChange}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="email">E-mail</Label>
                                <Input
                                  id="email"
                                  type="email"
                                  value={settings.email || ''}
                                  onChange={handleInputChange}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="website">Website</Label>
                              <Input
                                id="website"
                                value={settings.website || ''}
                                onChange={handleInputChange}
                              />
                            </div>
                          </>
                        )}
                  </CardContent>
                  <div className="border-t px-6 py-4 flex justify-between items-center">
                    {ChangesFeedback}
                    {SaveButton}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="equipment-categories">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-foreground">
                          Categorias de Equipamentos
                        </CardTitle>
                        <CardDescription>
                          Organize seus equipamentos em categorias para
                          facilitar a busca e organização.
                        </CardDescription>
                      </div>
                      <Suspense fallback={<LoadingSpinner />}>
                        <EquipmentCategoriesManager
                          headerOnly={true}
                          onCategoriesChange={handleCategoriesChange}
                        />
                      </Suspense>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<LoadingSpinner />}>
                      <EquipmentCategoriesManager
                        onCategoriesChange={handleCategoriesChange}
                      />
                    </Suspense>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contract-template">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-foreground">
                      Modelo de Contrato de Locação
                    </CardTitle>
                    <CardDescription>
                      Personalize o modelo de contrato que será usado para gerar
                      documentos PDF.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {loading
                      ? LoadingComponent
                      : settings && (
                          <div className="space-y-6">
                            {/* Guia de Variáveis */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <h3 className="font-semibold text-blue-900 mb-3">
                                📝 Guia de Variáveis Disponíveis
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <h4 className="font-medium text-blue-800 mb-2">
                                    🏢 Dados da Empresa
                                  </h4>
                                  <div className="space-y-1">
                                    <div>
                                      <code className="bg-blue-100 px-1 rounded">
                                        {'{company_name}'}
                                      </code>{' '}
                                      - Nome da empresa
                                    </div>
                                    <div>
                                      <code className="bg-blue-100 px-1 rounded">
                                        {'{cnpj}'}
                                      </code>{' '}
                                      - CNPJ da empresa
                                    </div>
                                    <div>
                                      <code className="bg-blue-100 px-1 rounded">
                                        {'{address}'}
                                      </code>{' '}
                                      - Endereço da empresa
                                    </div>
                                    <div>
                                      <code className="bg-blue-100 px-1 rounded">
                                        {'{phone}'}
                                      </code>{' '}
                                      - Telefone da empresa
                                    </div>
                                    <div>
                                      <code className="bg-blue-100 px-1 rounded">
                                        {'{email}'}
                                      </code>{' '}
                                      - E-mail da empresa
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium text-blue-800 mb-2">
                                    👤 Dados do Cliente
                                  </h4>
                                  <div className="space-y-1">
                                    <div>
                                      <code className="bg-blue-100 px-1 rounded">
                                        {'{client_name}'}
                                      </code>{' '}
                                      - Nome do cliente
                                    </div>
                                    <div>
                                      <code className="bg-blue-100 px-1 rounded">
                                        {'{client_document}'}
                                      </code>{' '}
                                      - Documento do cliente
                                    </div>
                                    <div>
                                      <code className="bg-blue-100 px-1 rounded">
                                        {'{client_address}'}
                                      </code>{' '}
                                      - Endereço do cliente
                                    </div>
                                    <div>
                                      <code className="bg-blue-100 px-1 rounded">
                                        {'{client_phone}'}
                                      </code>{' '}
                                      - Telefone do cliente
                                    </div>
                                    <div>
                                      <code className="bg-blue-100 px-1 rounded">
                                        {'{client_email}'}
                                      </code>{' '}
                                      - E-mail do cliente
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium text-blue-800 mb-2">
                                    📅 Datas e Horários
                                  </h4>
                                  <div className="space-y-1">
                                    <div>
                                      <code className="bg-blue-100 px-1 rounded">
                                        {'{start_date}'}
                                      </code>{' '}
                                      - Data de início (dd/mm/aaaa)
                                    </div>
                                    <div>
                                      <code className="bg-blue-100 px-1 rounded">
                                        {'{end_date}'}
                                      </code>{' '}
                                      - Data de término (dd/mm/aaaa)
                                    </div>
                                    <div>
                                      <code className="bg-blue-100 px-1 rounded">
                                        {'{installation_time}'}
                                      </code>{' '}
                                      - Horário de instalação
                                    </div>
                                    <div>
                                      <code className="bg-blue-100 px-1 rounded">
                                        {'{removal_time}'}
                                      </code>{' '}
                                      - Horário de remoção
                                    </div>
                                    <div>
                                      <code className="bg-blue-100 px-1 rounded">
                                        {'{contract_date}'}
                                      </code>{' '}
                                      - Data atual (dd/mm/aaaa)
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium text-blue-800 mb-2">
                                    💰 Valores e Detalhes
                                  </h4>
                                  <div className="space-y-1">
                                    <div>
                                      <code className="bg-blue-100 px-1 rounded">
                                        {'{equipment_list}'}
                                      </code>{' '}
                                      - Lista completa dos equipamentos
                                    </div>
                                    <div>
                                      <code className="bg-blue-100 px-1 rounded">
                                        {'{installation_location}'}
                                      </code>{' '}
                                      - Local de instalação
                                    </div>
                                    <div>
                                      <code className="bg-blue-100 px-1 rounded">
                                        {'{total_value}'}
                                      </code>{' '}
                                      - Valor total sem desconto
                                    </div>
                                    <div>
                                      <code className="bg-blue-100 px-1 rounded">
                                        {'{discount}'}
                                      </code>{' '}
                                      - Valor do desconto
                                    </div>
                                    <div>
                                      <code className="bg-blue-100 px-1 rounded">
                                        {'{final_value}'}
                                      </code>{' '}
                                      - Valor final com desconto
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4 p-3 bg-blue-100 rounded border-l-4 border-blue-400">
                                <p className="text-blue-800 text-sm">
                                  <strong>💡 Dica:</strong> Use essas variáveis
                                  entre chaves {'{}'} no seu modelo. Elas serão
                                  automaticamente substituídas pelos dados reais
                                  quando o contrato for gerado.
                                </p>
                              </div>
                            </div>

                            {/* Modelo de Exemplo */}
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-gray-900">
                                  📄 Modelo de Exemplo
                                </h3>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleUseExampleTemplate}
                                >
                                  Usar Modelo
                                </Button>
                              </div>
                              <p className="text-sm text-gray-600">
                                Clique em &quot;Usar Modelo&quot; para carregar
                                um exemplo básico de contrato que você pode
                                personalizar conforme suas necessidades.
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="contract_template">
                                Modelo do Contrato
                              </Label>
                              <Textarea
                                id="contract_template"
                                value={settings.contract_template || ''}
                                onChange={handleInputChange}
                                placeholder="Digite o modelo do contrato usando as variáveis disponíveis..."
                                rows={20}
                                className="font-mono text-sm"
                              />
                            </div>
                          </div>
                        )}
                  </CardContent>
                  <div className="border-t px-6 py-4 flex justify-between items-center">
                    {ChangesFeedback}
                    {SaveButton}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <SecuritySettings />
              </TabsContent>
            </Tabs>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
