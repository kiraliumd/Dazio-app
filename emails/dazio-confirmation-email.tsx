import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Button, Hr, Img } from '@react-email/components';

interface DazioConfirmationEmailProps {
  userEmail: string;
  confirmationUrl: string;
}

export const DazioConfirmationEmail: React.FC<DazioConfirmationEmailProps> = ({
  userEmail,
  confirmationUrl,
}) => {
  return (
    <Html>
      <Head>
        <title>Confirme seu email - Dazio</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Body style={{ 
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        margin: 0,
        padding: 0,
        backgroundColor: '#F8F8F8',
        color: '#1A1A1A'
      }}>
        <Container style={{ 
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          {/* Header com logo sem fundo */}
          <Section
            style={{
              backgroundColor: '#FFFFFF',
              padding: '24px',
              textAlign: 'center',
            }}
         >
            <Img
              src={
                'https://ohernchd3ti5wjig.public.blob.vercel-storage.com/logo-dazio.svg'
              }
              width={120}
              height={48}
              alt="Dazio"
              style={{ margin: '0 auto', display: 'block' }}
            />
          </Section>

          {/* Conteúdo principal */}
          <Section style={{ padding: '48px 32px' }}>
            <Text style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#1A1A1A',
              margin: '0 0 16px 0',
              textAlign: 'center',
              letterSpacing: '-0.025em'
            }}>
              Bem-vindo ao Dazio! 🎉
            </Text>

            <Text style={{
              fontSize: '16px',
              color: '#707070',
              margin: '0 0 32px 0',
              textAlign: 'center',
              lineHeight: '1.6'
            }}>
              Estamos muito felizes em tê-lo conosco! Para começar a usar sua conta, 
              confirme seu endereço de email clicando no botão abaixo.
            </Text>

            {/* Botão de confirmação */}
            <div style={{ textAlign: 'center', margin: '32px 0' }}>
              <Button
                href={confirmationUrl}
                style={{
                  backgroundColor: '#FF7A00',
                  color: '#FFFFFF',
                  padding: '16px 32px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: '600',
                  display: 'inline-block',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(255, 122, 0, 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                Confirmar Email
              </Button>
            </div>

            <Text style={{
              fontSize: '14px',
              color: '#707070',
              margin: '24px 0 0 0',
              textAlign: 'center',
              lineHeight: '1.5'
            }}>
              Se o botão não funcionar, copie e cole este link no seu navegador:
            </Text>

            <Text style={{
              fontSize: '14px',
              color: '#FF7A00',
              margin: '8px 0 0 0',
              textAlign: 'center',
              wordBreak: 'break-all',
              fontFamily: 'monospace'
            }}>
              {confirmationUrl}
            </Text>
          </Section>

          <Hr style={{ 
            border: 'none',
            borderTop: '1px solid #E0E0E0',
            margin: '0'
          }} />

          {/* Footer */}
          <Section style={{ 
            padding: '24px 32px',
            backgroundColor: '#F8F8F8'
          }}>
            <Text style={{
              fontSize: '14px',
              color: '#707070',
              margin: '0 0 16px 0',
              textAlign: 'center'
            }}>
              <strong>Email cadastrado:</strong> {userEmail}
            </Text>

            <Text style={{
              fontSize: '12px',
              color: '#707070',
              margin: '0 0 16px 0',
              textAlign: 'center',
              lineHeight: '1.5'
            }}>
              Este link de confirmação expira em 24 horas. 
              Se você não solicitou esta conta, pode ignorar este email.
            </Text>

            <Text style={{
              fontSize: '12px',
              color: '#707070',
              margin: '0 0 8px 0',
              textAlign: 'center'
            }}>
              © 2024 Dazio. Todos os direitos reservados.
            </Text>

            <Text style={{
              fontSize: '11px',
              color: '#707070',
              margin: '0',
              textAlign: 'center'
            }}>
              <a href={`${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${userEmail}`} 
                 style={{ color: '#707070', textDecoration: 'underline' }}>
                Desinscrever-se
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default DazioConfirmationEmail; 