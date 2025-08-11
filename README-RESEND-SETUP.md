# Configuração do Resend para Autenticação

Este documento explica como configurar o Resend para substituir o sistema de email padrão do Supabase.

## 1. Configuração do Resend

### 1.1 Integração Automática (Recomendado)
✅ **JÁ CONFIGURADO** - A integração automática do Resend com Vercel e Supabase foi configurada diretamente no painel do Resend.

**O que foi configurado automaticamente:**
- API Key do Resend
- Variáveis de ambiente no Vercel
- Domínio verificado
- Webhooks para monitoramento

### 1.2 Verificar Configuração
Para verificar se tudo está funcionando:

1. **No Vercel Dashboard:**
   - Vá para seu projeto
   - Settings → Environment Variables
   - Confirme que `RESEND_API_KEY` está configurada

2. **No Resend Dashboard:**
   - Verifique se o domínio está verificado
   - Confirme que a integração com Vercel está ativa

3. **Testar integração:**
   ```bash
   # Execute o script de teste (substitua o email)
   node scripts/test-resend-integration.js
   ```

### 1.3 Configuração Manual (se necessário)
Se precisar configurar manualmente, adicione ao seu arquivo `.env.local`:

```env
# Resend Configuration
RESEND_API_KEY=re_your_api_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 2. Estrutura Implementada

### 2.1 Arquivos criados/modificados:

- `lib/resend.ts` - Configuração e funções do Resend
- `app/api/auth/signup/route.ts` - API para cadastro com Resend
- `app/api/auth/confirm-email-resend/route.ts` - API para confirmação de email
- `app/cadastro/page.tsx` - Página de cadastro atualizada
- `app/cadastro/confirmacao/page.tsx` - Página de confirmação atualizada
- `app/auth/confirm/page.tsx` - Nova página de confirmação
- `scripts/061-create-email-confirmation-tokens.sql` - Migração da tabela de tokens

### 2.2 Tabela de tokens criada:
```sql
email_confirmation_tokens (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    email TEXT,
    token TEXT UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
```

## 3. Fluxo de Autenticação

### 3.1 Cadastro:
1. Usuário preenche formulário de cadastro
2. Sistema cria usuário no Supabase Auth
3. Sistema gera token único e salva na tabela `email_confirmation_tokens`
4. Sistema envia email via Resend com link de confirmação
5. Usuário é redirecionado para página de confirmação

### 3.2 Confirmação:
1. Usuário clica no link do email
2. Sistema valida o token na tabela
3. Sistema confirma o email do usuário no Supabase
4. Sistema marca o token como usado
5. Usuário é redirecionado para criar perfil

### 3.3 Reenvio:
1. Usuário solicita reenvio de email
2. Sistema gera novo token
3. Sistema envia novo email via Resend

## 4. Templates de Email

Os templates de email estão configurados em `lib/resend.ts` e incluem:

- **Email de confirmação**: Template HTML responsivo com logo da Dazio
- **Email de redefinição de senha**: Template para reset de senha (implementação futura)

## 5. Configuração de Domínio

### 5.1 Para produção:
1. Configure seu domínio no Resend
2. Atualize a variável `NEXT_PUBLIC_APP_URL` para sua URL de produção
3. Atualize o campo `from` nos emails para usar seu domínio

### 5.2 Para desenvolvimento:
- Use o domínio de teste do Resend: `transacional@dazio.com.br`
- Configure `NEXT_PUBLIC_APP_URL=http://localhost:3000`

## 6. Monitoramento

### 6.1 Logs:
- Todos os envios de email são logados no console
- Erros são capturados e exibidos para o usuário

### 6.2 Dashboard do Resend:
- Acesse o dashboard do Resend para ver estatísticas de envio
- Monitore taxas de entrega e aberturas

## 7. Limpeza Automática

A tabela `email_confirmation_tokens` inclui:
- Tokens expiram em 24 horas
- Função `cleanup_expired_tokens()` para limpeza automática
- Trigger para atualizar `updated_at`

## 8. Segurança

- Tokens são únicos e criptograficamente seguros
- Tokens expiram automaticamente
- Tokens são marcados como usados após confirmação
- RLS (Row Level Security) configurado na tabela

## 9. Próximos Passos

Para completar a implementação:

1. **Configurar domínio no Resend** para produção
2. **Implementar redefinição de senha** usando Resend
3. **Adicionar notificações** para outros eventos
4. **Configurar webhooks** do Resend para monitoramento
5. **Implementar rate limiting** para evitar spam

## 10. Troubleshooting

### Problemas comuns:

1. **Email não enviado**: Verifique a API key do Resend
2. **Token inválido**: Verifique se o token não expirou
3. **Erro de domínio**: Configure corretamente o domínio no Resend
4. **Rate limiting**: Resend tem limites de envio (100 emails/dia no plano gratuito)

### Logs úteis:
- Console do navegador para erros de frontend
- Logs do servidor para erros de API
- Dashboard do Resend para status de envio 