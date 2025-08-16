import { NextRequest, NextResponse } from 'next/server';
import { 
  addContactToAudience, 
  updateContactInAudience, 
  checkContactInAudience,
  unsubscribeContactFromAudience 
} from '@/lib/resend-contacts';

/**
 * GET - Verifica se um contato existe na audiência
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    console.log('🔍 Resend Contacts API: Verificando email:', email);

    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email é obrigatório' 
      }, { status: 400 });
    }

    // Verificar se o contato está na audiência
    const result = await checkContactInAudience(email);

    if (!result.success) {
      console.error('❌ Resend Contacts API: Erro ao verificar:', result.error);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao verificar contato',
        details: result.error
      }, { status: 500 });
    }

    console.log('✅ Resend Contacts API: Verificação concluída:', {
      email,
      exists: result.exists,
      contactId: result.contact?.id
    });
    
    return NextResponse.json({ 
      success: true, 
      exists: result.exists,
      contact: result.contact
    });

  } catch (error) {
    console.error('❌ Resend Contacts API: Erro inesperado:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

/**
 * POST - Adiciona um novo contato à audiência
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, unsubscribed = false } = body;
    
    console.log('🔍 Resend Contacts API: Adicionando contato:', { email, firstName, lastName });

    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email é obrigatório' 
      }, { status: 400 });
    }

    // Primeiro verificar se o contato já existe
    const checkResult = await checkContactInAudience(email);
    
    if (checkResult.success && checkResult.exists) {
      console.log('ℹ️ Resend Contacts API: Contato já existe, atualizando...');
      
      // Se já existe, atualizar em vez de adicionar
      const updateResult = await updateContactInAudience({
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        unsubscribed
      });

      if (!updateResult.success) {
        console.error('❌ Resend Contacts API: Erro ao atualizar contato existente:', updateResult.error);
        return NextResponse.json({ 
          success: false, 
          error: 'Erro ao atualizar contato',
          details: updateResult.error
        }, { status: 500 });
      }

      console.log('✅ Resend Contacts API: Contato atualizado com sucesso:', updateResult.contactId);
      return NextResponse.json({ 
        success: true, 
        action: 'updated',
        contactId: updateResult.contactId,
        message: 'Contato atualizado com sucesso'
      });
    }

    // Se não existe, adicionar novo contato
    const addResult = await addContactToAudience({
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      unsubscribed
    });

    if (!addResult.success) {
      console.error('❌ Resend Contacts API: Erro ao adicionar contato:', addResult.error);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao adicionar contato',
        details: addResult.error
      }, { status: 500 });
    }

    console.log('✅ Resend Contacts API: Contato adicionado com sucesso:', addResult.contactId);
    return NextResponse.json({ 
      success: true, 
      action: 'added',
      contactId: addResult.contactId,
      message: 'Contato adicionado com sucesso'
    });

  } catch (error) {
    console.error('❌ Resend Contacts API: Erro inesperado:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

/**
 * PUT - Atualiza um contato existente na audiência
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, unsubscribed } = body;
    
    console.log('🔍 Resend Contacts API: Atualizando contato:', { email, firstName, lastName, unsubscribed });

    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email é obrigatório' 
      }, { status: 400 });
    }

    // Verificar se o contato existe antes de atualizar
    const checkResult = await checkContactInAudience(email);
    
    if (!checkResult.success) {
      console.error('❌ Resend Contacts API: Erro ao verificar contato:', checkResult.error);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao verificar contato',
        details: checkResult.error
      }, { status: 500 });
    }

    if (!checkResult.exists) {
      console.log('ℹ️ Resend Contacts API: Contato não existe, criando...');
      
      // Se não existe, criar em vez de atualizar
      const addResult = await addContactToAudience({
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        unsubscribed: unsubscribed || false
      });

      if (!addResult.success) {
        console.error('❌ Resend Contacts API: Erro ao criar contato:', addResult.error);
        return NextResponse.json({ 
          success: false, 
          error: 'Erro ao criar contato',
          details: addResult.error
        }, { status: 500 });
      }

      console.log('✅ Resend Contacts API: Contato criado com sucesso:', addResult.contactId);
      return NextResponse.json({ 
        success: true, 
        action: 'created',
        contactId: addResult.contactId,
        message: 'Contato criado com sucesso'
      });
    }

    // Se existe, atualizar
    const updateResult = await updateContactInAudience({
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      unsubscribed: unsubscribed || false
    });

    if (!updateResult.success) {
      console.error('❌ Resend Contacts API: Erro ao atualizar contato:', updateResult.error);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao atualizar contato',
        details: updateResult.error
      }, { status: 500 });
    }

    console.log('✅ Resend Contacts API: Contato atualizado com sucesso:', updateResult.contactId);
    return NextResponse.json({ 
      success: true, 
      action: 'updated',
      contactId: updateResult.contactId,
      message: 'Contato atualizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Resend Contacts API: Erro inesperado:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

/**
 * DELETE - Remove/desinscreve um contato da audiência
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    console.log('🔍 Resend Contacts API: Desinscrevendo contato:', email);

    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email é obrigatório' 
      }, { status: 400 });
    }

    // Desinscrever contato da audiência
    const result = await unsubscribeContactFromAudience(email);

    if (!result.success) {
      console.error('❌ Resend Contacts API: Erro ao desinscrever contato:', result.error);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao desinscrever contato',
        details: result.error
      }, { status: 500 });
    }

    console.log('✅ Resend Contacts API: Contato desinscrito com sucesso:', result.contactId);
    return NextResponse.json({ 
      success: true, 
      contactId: result.contactId,
      message: 'Contato desinscrito com sucesso'
    });

  } catch (error) {
    console.error('❌ Resend Contacts API: Erro inesperado:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}
