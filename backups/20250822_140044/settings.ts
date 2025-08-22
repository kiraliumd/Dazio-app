import { supabase } from "../supabase";
import { getCurrentUserCompanyId } from "./client-utils";

// Define a interface para os dados de configuração da empresa
export interface CompanySettings {
  id?: string;
  company_name: string | null;
  cnpj: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  contract_template: string | null;
  updated_at?: string;
}

/**
 * Busca as configurações da empresa do usuário logado.
 * @returns {Promise<CompanySettings>}
 */
export async function getCompanySettings(): Promise<CompanySettings> {
  const companyId = await getCurrentUserCompanyId();
  if (!companyId) {
    throw new Error('Usuário não autenticado ou empresa não encontrada');
  }

  const { data, error } = await supabase
    .from("company_profiles")
    .select("company_name, cnpj, address, phone, email, website, contract_template")
    .eq('id', companyId)
    .single();

  if (error && error.code !== "PGRST116") { // PGRST116: a consulta não retornou linhas
    console.error("Erro ao buscar configurações da empresa:", error);
    throw error;
  }

  // Se não houver dados (tabela vazia), retorna um objeto padrão
  if (!data) {
    return {
      company_name: "",
      cnpj: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      contract_template: "",
    };
  }

  return data;
}

/**
 * Atualiza as configurações da empresa do usuário logado.
 * @param {Omit<CompanySettings, "id" | "updated_at">} settings - Os novos dados de configuração.
 * @returns {Promise<CompanySettings>}
 */
export async function updateCompanySettings(
  settings: Omit<CompanySettings, "id" | "updated_at">
): Promise<CompanySettings> {
  const companyId = await getCurrentUserCompanyId();
  if (!companyId) {
    throw new Error('Usuário não autenticado ou empresa não encontrada');
  }

  const { data, error } = await supabase
    .from("company_profiles")
    .update(settings)
    .eq('id', companyId)
    .select("company_name, cnpj, address, phone, email, website, contract_template")
    .single();

  if (error) {
    console.error("Erro ao atualizar configurações da empresa:", error);
    throw error;
  }

  return data;
}
