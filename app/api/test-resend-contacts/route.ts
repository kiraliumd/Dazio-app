import { NextRequest, NextResponse } from 'next/server';
import {
  addContactToAudience,
  updateContactInAudience,
  checkContactInAudience,
  unsubscribeContactFromAudience,
} from '@/lib/resend-contacts';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || 'test@example.com';

    console.log('🧪 Test Resend Contacts API: Testando com email:', email);

    // Testar verificação de contato
    console.log('1️⃣ Testando verificação de contato...');
    const checkResult = await checkContactInAudience(email);
    console.log('✅ Verificação:', checkResult);

    // Testar adição de contato
    console.log('2️⃣ Testando adição de contato...');
    const addResult = await addContactToAudience({
      email,
      firstName: 'Teste',
      lastName: 'Usuário',
      unsubscribed: false,
    });
    console.log('✅ Adição:', addResult);

    // Testar atualização de contato
    console.log('3️⃣ Testando atualização de contato...');
    const updateResult = await updateContactInAudience({
      email,
      firstName: 'Teste Atualizado',
      lastName: 'Usuário Modificado',
      unsubscribed: false,
    });
    console.log('✅ Atualização:', updateResult);

    // Testar nova verificação
    console.log('4️⃣ Testando nova verificação...');
    const finalCheckResult = await checkContactInAudience(email);
    console.log('✅ Verificação final:', finalCheckResult);

    return NextResponse.json({
      success: true,
      tests: {
        check: checkResult,
        add: addResult,
        update: updateResult,
        finalCheck: finalCheckResult,
      },
      message: 'Testes de contatos do Resend concluídos',
    });
  } catch (error) {
    console.error('❌ Test Resend Contacts API: Erro:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro durante os testes',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, action } = body;

    console.log('🧪 Test Resend Contacts API: Testando ação:', {
      email,
      firstName,
      lastName,
      action,
    });

    let result;

    switch (action) {
      case 'add':
        result = await addContactToAudience({
          email,
          firstName,
          lastName,
          unsubscribed: false,
        });
        break;
      case 'update':
        result = await updateContactInAudience({
          email,
          firstName,
          lastName,
          unsubscribed: false,
        });
        break;
      case 'check':
        result = await checkContactInAudience(email);
        break;
      case 'unsubscribe':
        result = await unsubscribeContactFromAudience(email);
        break;
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Ação inválida. Use: add, update, check, unsubscribe',
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      result,
    });
  } catch (error) {
    console.error('❌ Test Resend Contacts API: Erro:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro durante o teste',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
