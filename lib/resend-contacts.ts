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

/**
 * Adiciona um novo contato à audiência do Resend
 */
export async function addContactToAudience(contactData: ContactData) {
  try {
    if (!AUDIENCE_ID) {
      console.warn('⚠️ RESEND_AUDIENCE_ID não configurado. Contato não será adicionado à audiência.');
      return { success: false, error: 'AUDIENCE_ID não configurado' };
    }

    console.log('🔍 Resend Contacts: Adicionando contato à audiência:', contactData.email);

    const { data, error } = await resend.contacts.create({
      email: contactData.email,
      firstName: contactData.firstName || '',
      lastName: contactData.lastName || '',
      unsubscribed: contactData.unsubscribed || false,
      audienceId: AUDIENCE_ID,
    });

    if (error) {
      console.error('❌ Resend Contacts: Erro ao adicionar contato:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Resend Contacts: Contato adicionado com sucesso:', data?.id);
    return { success: true, contactId: data?.id };

  } catch (error) {
    console.error('❌ Resend Contacts: Erro inesperado:', error);
    return { success: false, error: 'Erro interno' };
  }
}

/**
 * Atualiza um contato existente na audiência do Resend
 */
export async function updateContactInAudience(contactData: ContactData) {
  try {
    if (!AUDIENCE_ID) {
      console.warn('⚠️ RESEND_AUDIENCE_ID não configurado. Contato não será atualizado na audiência.');
      return { success: false, error: 'AUDIENCE_ID não configurado' };
    }

    console.log('🔍 Resend Contacts: Atualizando contato na audiência:', contactData.email);

    const { data, error } = await resend.contacts.update({
      email: contactData.email,
      audienceId: AUDIENCE_ID,
      firstName: contactData.firstName,
      lastName: contactData.lastName,
      unsubscribed: contactData.unsubscribed,
    });

    if (error) {
      console.error('❌ Resend Contacts: Erro ao atualizar contato:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Resend Contacts: Contato atualizado com sucesso:', data?.id);
    return { success: true, contactId: data?.id };

  } catch (error) {
    console.error('❌ Resend Contacts: Erro inesperado:', error);
    return { success: false, error: 'Erro interno' };
  }
}

/**
 * Remove um contato da audiência do Resend (desinscreve)
 */
export async function unsubscribeContactFromAudience(email: string) {
  try {
    if (!AUDIENCE_ID) {
      console.warn('⚠️ RESEND_AUDIENCE_ID não configurado. Contato não será desinscrito da audiência.');
      return { success: false, error: 'AUDIENCE_ID não configurado' };
    }

    console.log('🔍 Resend Contacts: Desinscrevendo contato da audiência:', email);

    const { data, error } = await resend.contacts.update({
      email: email,
      audienceId: AUDIENCE_ID,
      unsubscribed: true,
    });

    if (error) {
      console.error('❌ Resend Contacts: Erro ao desinscrever contato:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Resend Contacts: Contato desinscrito com sucesso:', data?.id);
    return { success: true, contactId: data?.id };

  } catch (error) {
    console.error('❌ Resend Contacts: Erro inesperado:', error);
    return { success: false, error: 'Erro interno' };
  }
}

/**
 * Verifica se um contato existe na audiência
 */
export async function checkContactInAudience(email: string) {
  try {
    if (!AUDIENCE_ID) {
      console.warn('⚠️ RESEND_AUDIENCE_ID não configurado. Não é possível verificar contato.');
      return { success: false, error: 'AUDIENCE_ID não configurado' };
    }

    console.log('🔍 Resend Contacts: Verificando contato na audiência:', email);

    // Lista todos os contatos da audiência para verificar se o email existe
    const { data, error } = await resend.contacts.list({
      audienceId: AUDIENCE_ID,
    });

    if (error) {
      console.error('❌ Resend Contacts: Erro ao listar contatos:', error);
      return { success: false, error: error.message };
    }

    const contact = data?.data?.find(contact => contact.email === email);
    
    if (contact) {
      console.log('✅ Resend Contacts: Contato encontrado:', contact.id);
      return { success: true, exists: true, contact };
    } else {
      console.log('ℹ️ Resend Contacts: Contato não encontrado');
      return { success: true, exists: false };
    }

  } catch (error) {
    console.error('❌ Resend Contacts: Erro inesperado:', error);
    return { success: false, error: 'Erro interno' };
  }
} 