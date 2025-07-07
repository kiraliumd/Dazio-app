"use client";

import { useState, useEffect, useRef } from 'react';
import { AppSidebar } from "../../components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getCompanySettings, updateCompanySettings, CompanySettings } from "../../lib/database/settings";
import { useToast } from "@/components/ui/use-toast";
import { Save, CheckCircle, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [originalSettings, setOriginalSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { toast } = useToast();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const companySettings = await getCompanySettings();
        setSettings(companySettings);
        setOriginalSettings(companySettings);
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível buscar os dados da empresa. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [toast]);

  // Verificar mudanças nos dados
  useEffect(() => {
    if (settings && originalSettings) {
      const hasAnyChanges = Object.keys(settings).some(key => {
        const typedKey = key as keyof CompanySettings;
        return settings[typedKey] !== originalSettings[typedKey];
      });
      setHasChanges(hasAnyChanges);
    }
  }, [settings, originalSettings]);

  // Cleanup timeout quando componente for desmontado
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    if (settings) {
      setSettings({ ...settings, [id]: value });
    }
  };

  const handleSave = async () => {
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
      });
      
      // Atualizar dados originais após salvar
      setOriginalSettings(settings);
      setHasChanges(false);
      setSaveSuccess(true);
      
      // Limpar feedback de sucesso após 3 segundos
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      
      toast({
        title: "Configurações Salvas",
        description: "Os dados da empresa foram atualizados com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">Configurações</h1>
              <p className="text-sm text-gray-600">Gerencie as informações da sua empresa</p>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6 bg-gray-50">
          <Tabs defaultValue="company-data">
            <TabsList className="mb-4">
              <TabsTrigger value="company-data">Dados da Empresa</TabsTrigger>
              {/* Outras abas podem ser adicionadas aqui no futuro */}
            </TabsList>

            <TabsContent value="company-data">
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">Informações da Empresa</CardTitle>
                  <CardDescription>Atualize os dados que aparecerão em documentos e relatórios.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-gray-600">Carregando...</p>
                    </div>
                  ) : settings && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="company_name">Nome da Empresa</Label>
                          <Input id="company_name" value={settings.company_name || ''} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cnpj">CNPJ</Label>
                          <Input id="cnpj" value={settings.cnpj || ''} onChange={handleInputChange} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Endereço</Label>
                        <Textarea id="address" value={settings.address || ''} onChange={handleInputChange} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefone</Label>
                          <Input id="phone" value={settings.phone || ''} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">E-mail</Label>
                          <Input id="email" type="email" value={settings.email || ''} onChange={handleInputChange} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input id="website" value={settings.website || ''} onChange={handleInputChange} />
                      </div>
                    </>
                  )}
                </CardContent>
                <div className="border-t px-6 py-4 flex justify-between items-center">
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
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
