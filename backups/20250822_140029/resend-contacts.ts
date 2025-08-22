import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// ID da audiência do Resend - você deve configurar isso nas variáveis de ambiente
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

export interface ContactData {
  email: string;
  firstName?: string;
  lastName?: string;
  unsubscribed?: boolean;
}

export interface ContactResult {
  success: boolean;
  contactId?: string;
  error?: string;
}

export interface CheckContactResult {
  success: boolean;
  exists?: boolean;
  contact?: any;
  error?: string;
}

/**
 * Adiciona um novo contato à audiência do Resend
 */
export async function addContactToAudience(contactData: ContactData): Promise<ContactResult> {
  try {
    if (!AUDIENCE_ID) {
      if (process.env.NODE_ENV === "development") { console.warn('⚠️ RESEND_AUDIENCE_ID não configurado. Contato não será adicionado à audiência.'); }
      return { success: false, error: 'AUDIENCE_ID não configurado' };
    }

    if (process.env.NODE_ENV === "development") { console.log('🔍 Resend Contacts: Adicionando contato à audiência:', contactData.email); }

    // Primeiro verificar se o contato já existe
    const existingContact = await checkContactInAudience(contactData.email);
    
    if (existingContact.success && existingContact.exists) {
      if (process.env.NODE_ENV === "development") { console.log('ℹ️ Resend Contacts: Contato já existe, atualizando em vez de adicionar'); }
      
      // Se já existe, atualizar em vez de adicionar
      return await updateContactInAudience(contactData);
    }

    const { data, error } = await resend.contacts.create({
      email: contactData.email,
      firstName: contactData.firstName || '',
      lastName: contactData.lastName || '',
      unsubscribed: contactData.unsubscribed || false,
      audienceId: AUDIENCE_ID,
    });

    if (error) {
      if (process.env.NODE_ENV === "development") { console.error('❌ Resend Contacts: Erro ao adicionar contato:', error); }
      
      // Se o erro for de contato duplicado, tentar atualizar
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        if (process.env.NODE_ENV === "development") { console.log('ℹ️ Resend Contacts: Contato duplicado detectado, tentando atualizar...'); }
        return await updateContactInAudience(contactData);
      }
      
      return { success: false, error: error.message };
    }

    if (process.env.NODE_ENV === "development") { console.log('✅ Resend Contacts: Contato adicionado com sucesso:', data?.id); }
    return { success: true, contactId: data?.id };

  } catch (error) {
    if (process.env.NODE_ENV === "development") { console.error('❌ Resend Contacts: Erro inesperado:', error); }
    return { success: false, error: 'Erro interno' };
  }
}

/**
 * Atualiza um contato existente na audiência do Resend
 */
export async function updateContactInAudience(contactData: ContactData): Promise<ContactResult> {
  try {
    if (!AUDIENCE_ID) {
      if (process.env.NODE_ENV === "development") { console.warn('⚠️ RESEND_AUDIENCE_ID não configurado. Contato não será atualizado na audiência.'); }
      return { success: false, error: 'AUDIENCE_ID não configurado' };
    }

    if (process.env.NODE_ENV === "development") { console.log('🔍 Resend Contacts: Atualizando contato na audiência:', contactData.email); }

    // Primeiro verificar se o contato existe
    const existingContact = await checkContactInAudience(contactData.email);
    
    if (!existingContact.success) {
      if (process.env.NODE_ENV === "development") { console.error('❌ Resend Contacts: Erro ao verificar contato existente:', existingContact.error); }
      return { success: false, error: existingContact.error };
    }

    if (!existingContact.exists) {
      if (process.env.NODE_ENV === "development") { console.log('ℹ️ Resend Contacts: Contato não existe, criando em vez de atualizar'); }
      
      // Se não existe, criar em vez de atualizar
      return await addContactToAudience(contactData);
    }

    const { data, error } = await resend.contacts.update({
      email: contactData.email,
      audienceId: AUDIENCE_ID,
      firstName: contactData.firstName,
      lastName: contactData.lastName,
      unsubscribed: contactData.unsubscribed,
    });

    if (error) {
      if (process.env.NODE_ENV === "development") { console.error('❌ Resend Contacts: Erro ao atualizar contato:', error); }
      return { success: false, error: error.message };
    }

    if (process.env.NODE_ENV === "development") { console.log('✅ Resend Contacts: Contato atualizado com sucesso:', data?.id); }
    return { success: true, contactId: data?.id };

  } catch (error) {
    if (process.env.NODE_ENV === "development") { console.error('❌ Resend Contacts: Erro inesperado:', error); }
    return { success: false, error: 'Erro interno' };
  }
}

/**
 * Remove um contato da audiência do Resend (desinscreve)
 */
export async function unsubscribeContactFromAudience(email: string): Promise<ContactResult> {
  try {
    if (!AUDIENCE_ID) {
      if (process.env.NODE_ENV === "development") { console.warn('⚠️ RESEND_AUDIENCE_ID não configurado. Contato não será desinscrito da audiência.'); }
      return { success: false, error: 'AUDIENCE_ID não configurado' };
    }

    if (process.env.NODE_ENV === "development") { console.log('🔍 Resend Contacts: Desinscrevendo contato da audiência:', email); }

    const { data, error } = await resend.contacts.update({
      email: email,
      audienceId: AUDIENCE_ID,
      unsubscribed: true,
    });

    if (error) {
      if (process.env.NODE_ENV === "development") { console.error('❌ Resend Contacts: Erro ao desinscrever contato:', error); }
      return { success: false, error: error.message };
    }

    if (process.env.NODE_ENV === "development") { console.log('✅ Resend Contacts: Contato desinscrito com sucesso:', data?.id); }
    return { success: true, contactId: data?.id };

  } catch (error) {
    if (process.env.NODE_ENV === "development") { console.error('❌ Resend Contacts: Erro inesperado:', error); }
    return { success: false, error: 'Erro interno' };
  }
}

/**
 * Verifica se um contato existe na audiência
 */
export async function checkContactInAudience(email: string): Promise<CheckContactResult> {
  try {
    if (!AUDIENCE_ID) {
      if (process.env.NODE_ENV === "development") { console.warn('⚠️ RESEND_AUDIENCE_ID não configurado. Não é possível verificar contato.'); }
      return { success: false, error: 'AUDIENCE_ID não configurado' };
    }

    if (process.env.NODE_ENV === "development") { console.log('🔍 Resend Contacts: Verificando contato na audiência:', email); }

    // Lista todos os contatos da audiência para verificar se o email existe
    const { data, error } = await resend.contacts.list({
      audienceId: AUDIENCE_ID,
    });

    if (error) {
      if (process.env.NODE_ENV === "development") { console.error('❌ Resend Contacts: Erro ao listar contatos:', error); }
      return { success: false, error: error.message };
    }

    const contact = data?.data?.find(contact => contact.email === email);
    
    if (contact) {
      if (process.env.NODE_ENV === "development") { console.log('✅ Resend Contacts: Contato encontrado:', contact.id); }
      return { success: true, exists: true, contact };
    } else {
      if (process.env.NODE_ENV === "development") { console.log('ℹ️ Resend Contacts: Contato não encontrado'); }
      return { success: true, exists: false };
    }

  } catch (error) {
    if (process.env.NODE_ENV === "development") { console.error('❌ Resend Contacts: Erro inesperado:', error); }
    return { success: false, error: 'Erro interno' };
  }
} 