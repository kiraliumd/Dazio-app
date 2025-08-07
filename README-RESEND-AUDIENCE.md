# 📧 Integração com Audiência do Resend

Este documento explica como configurar e usar a integração automática com a audiência do Resend para gerenciar contatos de usuários.

## 🎯 Funcionalidades Implementadas

### ✅ **Cadastro Automático**
- Todo novo usuário é automaticamente adicionado à audiência do Resend
- Dados incluídos: email, nome da empresa (se disponível)
- Status: inscrito por padrão

### ✅ **Atualização Automática**
- Quando o perfil da empresa é atualizado, os dados na audiência são sincronizados
- Mantém informações sempre atualizadas

### ✅ **Desinscrição**
- Link de desinscrição em todos os emails
- Página dedicada para gerenciar inscrição
- Possibilidade de re-inscrição

### ✅ **Verificação de Status**
- API para verificar se um email está na audiência
- Controle de status de inscrição

## 🔧 Configuração

### 1. **Criar Audiência no Resend**

1. Acesse o [painel do Resend](https://resend.com/audiences)
2. Clique em "Create Audience"
3. Dê um nome (ex: "Dazio Users")
4. Copie o **Audience ID** gerado

### 2. **Configurar Variável de Ambiente**

Adicione a variável de ambiente no Vercel:

```bash
RESEND_AUDIENCE_ID=f07a036f-bccf-4959-a940-a025ab7fdce5
```

**Onde encontrar o Audience ID:**
- Painel do Resend → Audiences → [Sua Audiência] → Settings
- Ou na URL: `https://resend.com/audiences/[AUDIENCE_ID]`

### 3. **Verificar Configuração**

Teste se a configuração está funcionando:

```bash
curl -X POST https://app.dazio.com.br/api/check-audience \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@exemplo.com"}'
```

## 📋 APIs Disponíveis

### **Adicionar Contato**
```typescript
POST /api/auth/signup
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

### **Verificar Contato**
```typescript
POST /api/check-audience
{
  "email": "usuario@exemplo.com"
}
```

### **Desinscrever**
```typescript
POST /api/unsubscribe
{
  "email": "usuario@exemplo.com"
}
```

### **Re-inscrever**
```typescript
POST /api/resubscribe
{
  "email": "usuario@exemplo.com"
}
```

### **Atualizar Perfil (inclui audiência)**
```typescript
PUT /api/company/profile
{
  "company_name": "Empresa Atualizada",
  "phone": "11999999999"
}
```

## 🎨 Páginas Disponíveis

### **Página de Desinscrição**
- **URL**: `/unsubscribe?email=usuario@exemplo.com`
- **Funcionalidades**:
  - Desinscrever automaticamente
  - Re-inscrever se necessário
  - Interface amigável

## 📊 Monitoramento

### **Logs Importantes**
- `🔍 Resend Contacts: Adicionando contato à audiência`
- `✅ Resend Contacts: Contato adicionado com sucesso`
- `⚠️ RESEND_AUDIENCE_ID não configurado`

### **Verificar no Resend**
1. Acesse [resend.com/audiences](https://resend.com/audiences)
2. Selecione sua audiência
3. Veja a lista de contatos
4. Verifique status de inscrição

## 🔒 Segurança

### **Proteções Implementadas**
- ✅ Verificação de variáveis de ambiente
- ✅ Tratamento de erros sem quebrar o fluxo principal
- ✅ Logs detalhados para debugging
- ✅ Validação de dados de entrada

### **Boas Práticas**
- A falha na audiência não impede o cadastro do usuário
- Logs detalhados para monitoramento
- Interface de usuário para gerenciar inscrição

## 🚀 Próximos Passos

### **Melhorias Sugeridas**
1. **Segmentação**: Criar audiências por tipo de usuário
2. **Automação**: Enviar emails de boas-vindas automáticos
3. **Analytics**: Rastrear engajamento dos emails
4. **Personalização**: Incluir mais dados do perfil na audiência

### **Configurações Avançadas**
1. **Webhooks**: Receber notificações de eventos
2. **Tags**: Marcar contatos com tags específicas
3. **Campanhas**: Criar campanhas de email direcionadas

## 📞 Suporte

Se encontrar problemas:

1. **Verificar logs** no Vercel
2. **Confirmar Audience ID** no painel do Resend
3. **Testar APIs** individualmente
4. **Verificar variáveis de ambiente**

---

**Status**: ✅ Implementado e Funcionando
**Última atualização**: Dezembro 2024 