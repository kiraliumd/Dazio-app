import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface ConfirmationEmailProps {
  userEmail: string;
  confirmationUrl: string;
}

export const ConfirmationEmail: React.FC<ConfirmationEmailProps> = ({
  userEmail,
  confirmationUrl,
}) => {
  return (
    <Html>
      <Head />
      <Preview>Confirme seu email - Dazio</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src={`${process.env.NEXT_PUBLIC_APP_URL}/logo-dazio.svg`}
              width="120"
              height="48"
              alt="Dazio"
              style={logo}
            />
          </Section>

          <Section style={content}>
            <Heading style={h1}>Bem-vindo ao Dazio!</Heading>
            
            <Text style={text}>
              Obrigado por se cadastrar. Para começar a usar sua conta, confirme seu endereço de email clicando no botão abaixo:
            </Text>

            <Section style={buttonContainer}>
              <Link href={confirmationUrl} style={button}>
                Confirmar Email
              </Link>
            </Section>

            <Text style={text}>
              Se o botão não funcionar, copie e cole este link no seu navegador:
            </Text>
            
            <Text style={linkText}>
              {confirmationUrl}
            </Text>

            <Text style={text}>
              Este link expira em 24 horas.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Se você não criou uma conta no Dazio, pode ignorar este email.
            </Text>
            <Text style={footerText}>
              &copy; 2025 Dazio. Todos os direitos reservados.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ConfirmationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  textAlign: 'center' as const,
  marginBottom: '30px',
};

const logo = {
  margin: '0 auto',
};

const content = {
  padding: '0 40px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#007bff',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const linkText = {
  color: '#007bff',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  wordBreak: 'break-all' as const,
};

const footer = {
  borderTop: '1px solid #e5e7eb',
  marginTop: '40px',
  paddingTop: '20px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
}; 