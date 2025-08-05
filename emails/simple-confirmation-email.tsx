import * as React from 'react';
import { Html, Head, Body, Text, Button, Container } from '@react-email/components';

interface SimpleConfirmationEmailProps {
  userEmail: string;
  confirmationUrl: string;
}

export const SimpleConfirmationEmail: React.FC<SimpleConfirmationEmailProps> = ({
  userEmail,
  confirmationUrl,
}) => {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', margin: 0, padding: 20 }}>
        <Container>
          <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '20px' }}>
            Bem-vindo ao Dazio!
          </Text>
          
          <Text style={{ fontSize: '16px', color: '#666', marginBottom: '20px' }}>
            Obrigado por se cadastrar. Para começar a usar sua conta, confirme seu endereço de email clicando no botão abaixo:
          </Text>

          <Button 
            href={confirmationUrl}
            style={{
              backgroundColor: '#007bff',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              display: 'inline-block',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            Confirmar Email
          </Button>

          <Text style={{ fontSize: '14px', color: '#999', marginTop: '20px' }}>
            Se o botão não funcionar, copie e cole este link no seu navegador: {confirmationUrl}
          </Text>

          <Text style={{ fontSize: '14px', color: '#999', marginTop: '20px' }}>
            Este link expira em 24 horas.
          </Text>

          <Text style={{ fontSize: '12px', color: '#ccc', marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            &copy; 2025 Dazio. Todos os direitos reservados.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default SimpleConfirmationEmail; 