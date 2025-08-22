import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export { resend };

// Tipos para os emails
export interface EmailData {
  to: string;
  subject: string;
  html: string;
}

// Função para enviar email de confirmação
export async function sendConfirmationEmail(email: string, token: string) {
  const confirmationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirme seu email - Dazio</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          max-width: 120px;
          height: auto;
        }
        .content {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .button {
          display: inline-block;
          background: #007bff;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          color: #666;
          font-size: 14px;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo-dazio.svg" alt="Dazio" class="logo">
      </div>
      
      <div class="content">
        <h2>Bem-vindo ao Dazio!</h2>
        <p>Obrigado por se cadastrar. Para começar a usar sua conta, confirme seu endereço de email clicando no botão abaixo:</p>
        
        <div style="text-align: center;">
          <a href="${confirmationUrl}" class="button">Confirmar Email</a>
        </div>
        
        <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
        <p style="word-break: break-all; color: #007bff;">${confirmationUrl}</p>
        
        <p>Este link expira em 24 horas.</p>
      </div>
      
      <div class="footer">
        <p>Se você não criou uma conta no Dazio, pode ignorar este email.</p>
        <p>&copy; 2025 Dazio. Todos os direitos reservados.</p>
      </div>
    </body>
    </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Dazio <transacional@dazio.com.br>',
      to: [email],
      subject: 'Confirme seu email - Dazio',
      html: html,
    });

    if (error) {
      if (process.env.NODE_ENV === "development") { console.error('Erro ao enviar email:', error); }
      throw error;
    }

    if (process.env.NODE_ENV === "development") { console.log('Email enviado com sucesso:', data); }
    return data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") { console.error('Erro ao enviar email de confirmação:', error); }
    throw error;
  }
}

// Função para enviar email de redefinição de senha
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Redefinir senha - Dazio</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          max-width: 120px;
          height: auto;
        }
        .content {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .button {
          display: inline-block;
          background: #dc3545;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          color: #666;
          font-size: 14px;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo-dazio.svg" alt="Dazio" class="logo">
      </div>
      
      <div class="content">
        <h2>Redefinir sua senha</h2>
        <p>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:</p>
        
        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Redefinir Senha</a>
        </div>
        
        <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
        <p style="word-break: break-all; color: #dc3545;">${resetUrl}</p>
        
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou a redefinição de senha, pode ignorar este email.</p>
      </div>
      
      <div class="footer">
        <p>&copy; 2025 Dazio. Todos os direitos reservados.</p>
      </div>
    </body>
    </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Dazio <transacional@dazio.com.br>',
      to: [email],
      subject: 'Redefinir senha - Dazio',
      html: html,
    });

    if (error) {
      if (process.env.NODE_ENV === "development") { console.error('Erro ao enviar email:', error); }
      throw error;
    }

    if (process.env.NODE_ENV === "development") { console.log('Email de redefinição enviado com sucesso:', data); }
    return data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") { console.error('Erro ao enviar email de redefinição:', error); }
    throw error;
  }
} 