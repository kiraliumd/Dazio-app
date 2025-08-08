import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Link,
  Preview,
  Section,
  Button,
  Hr,
  Img,
} from '@react-email/components'

interface ResetPasswordEmailProps {
  resetUrl: string
  userEmail: string
}

export const ResetPasswordEmail = ({
  resetUrl,
  userEmail,
}: ResetPasswordEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Redefinir sua senha - Dazio</Preview>
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
            <Text style={headerTitle}>Redefinir Senha</Text>
          </Section>

          <Section style={content}>
            <Text style={title}>Olá!</Text>
            <Text style={text}>
              Recebemos uma solicitação para redefinir a senha da sua conta no Dazio.
            </Text>
            
            <Text style={text}>
              Clique no botão abaixo para criar uma nova senha:
            </Text>
            
            <Section style={buttonContainer}>
              <Button style={button} href={resetUrl}>
                Redefinir Senha
              </Button>
            </Section>
            
            <Section style={warning}>
              <Text style={warningText}>
                <strong>Importante:</strong> Este link é válido por 1 hora. Se você não solicitou esta redefinição, ignore este email.
              </Text>
            </Section>
            
            <Text style={text}>
              Se o botão não funcionar, copie e cole este link no seu navegador:
            </Text>
            <Link href={resetUrl} style={link}>
              {resetUrl}
            </Link>
          </Section>

          <Hr style={hr} />
          
          <Section style={footer}>
            <Text style={footerText}>&copy; 2025 Dazio. Todos os direitos reservados.</Text>
            <Text style={footerText}>Este email foi enviado para {userEmail}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f8f8f8',
  fontFamily: 'Inter, Arial, sans-serif',
}

const container = {
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  maxWidth: '600px',
}

const header = {
  background: 'linear-gradient(135deg, #FF7A00 0%, #FFBF7F 100%)',
  padding: '40px 30px',
  textAlign: 'center' as const,
}

const logo = {
  marginBottom: '20px',
}

const headerTitle = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0',
}

const content = {
  padding: '40px 30px',
}

const title = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1a1a1a',
  marginBottom: '16px',
}

const text = {
  fontSize: '16px',
  color: '#707070',
  marginBottom: '24px',
  lineHeight: '1.6',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '16px 0',
}

const button = {
  backgroundColor: '#FF7A00',
  color: '#ffffff',
  textDecoration: 'none',
  padding: '16px 32px',
  borderRadius: '8px',
  fontWeight: '600',
  fontSize: '16px',
  display: 'inline-block',
}

const warning = {
  backgroundColor: '#fff3cd',
  border: '1px solid #ffeaa7',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
}

const warningText = {
  fontSize: '14px',
  color: '#856404',
  margin: '0',
}

const link = {
  color: '#FF7A00',
  textDecoration: 'none',
}

const hr = {
  borderColor: '#e0e0e0',
  margin: '0',
}

const footer = {
  backgroundColor: '#f8f8f8',
  padding: '24px 30px',
  textAlign: 'center' as const,
}

const footerText = {
  fontSize: '14px',
  color: '#707070',
  margin: '0',
}

export default ResetPasswordEmail
