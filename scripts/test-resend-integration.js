const { Resend } = require('resend');

// Teste básico da integração do Resend
async function testResendIntegration() {
  console.log('🧪 Testando integração do Resend...');
  
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY não encontrada nas variáveis de ambiente');
      return;
    }
    
    console.log('✅ RESEND_API_KEY encontrada');
    
    // Teste de envio de email
    const { data, error } = await resend.emails.send({
      from: 'Dazio <noreply@dazio.com>',
      to: ['test@example.com'], // Substitua por um email real para teste
      subject: 'Teste de Integração - Dazio',
      html: `
        <h1>Teste de Integração</h1>
        <p>Se você recebeu este email, a integração do Resend está funcionando corretamente!</p>
        <p>Data do teste: ${new Date().toLocaleString('pt-BR')}</p>
      `
    });

    if (error) {
      console.error('❌ Erro ao enviar email:', error);
      return;
    }

    console.log('✅ Email enviado com sucesso!');
    console.log('📧 ID do email:', data?.id);
    console.log('📧 Status:', data?.status);
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testResendIntegration();
}

module.exports = { testResendIntegration }; 