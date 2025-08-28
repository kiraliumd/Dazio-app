# 🚀 Dazio - Sistema de Gestão de Locações

## 🆕 Últimas Atualizações

### Console Logs Limpos (v1.0.1)
- ✅ **Logs de debug removidos** para produção
- ✅ **Sistema de logging configurável** implementado
- ✅ **Console limpo** com apenas logs essenciais
- ✅ **Performance melhorada** sem logs desnecessários

### Sistema de Logging Configurável
- 🔍 **Debug**: Apenas em desenvolvimento
- ℹ️ **Info**: Sempre visível
- ✅ **Success**: Sempre visível  
- ⚠️ **Warning**: Sempre visível
- ❌ **Error**: Sempre visível
- 🗄️ **Cache**: Apenas em desenvolvimento
- 🗑️ **Cleanup**: Apenas em desenvolvimento
- 📊 **Dashboard**: Apenas em desenvolvimento
- 📦 **Data**: Apenas em desenvolvimento
- 🔄 **Refresh**: Apenas em desenvolvimento

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Funcionalidades Principais](#funcionalidades-principais)
3. [Stack Tecnológica](#stack-tecnológica)
4. [Arquitetura do Projeto](#arquitetura-do-projeto)
5. [Fluxo Principal do Sistema](#fluxo-principal-do-sistema)
6. [Sistema de Recorrência](#sistema-de-recorrência)
7. [Sistema de Assinaturas](#sistema-de-assinaturas)
8. [Integração com Resend](#integração-com-resend)
9. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
10. [Configuração e Instalação](#configuração-e-instalação)
11. [Otimizações de Performance](#otimizações-de-performance)
12. [Melhorias de UX](#melhorias-de-ux)
13. [Changelog](#changelog)
14. [Próximas Funcionalidades](#próximas-funcionalidades)

---

## 🎯 Visão Geral

Sistema completo de gestão de locações de equipamentos, desenvolvido com Next.js, Supabase e TypeScript. Permite gerenciar orçamentos, locações, clientes, equipamentos, agenda de eventos de logística, locações recorrentes e sistema de assinaturas.

### ✨ Principais Funcionalidades

- **Dashboard Inteligente**: Métricas em tempo real com cache otimizado
- **Gestão de Orçamentos**: Formulário avançado com preview em tempo real e suporte a recorrência
- **Controle de Locações**: Acompanhamento completo do ciclo de vida
- **Locações Recorrentes**: Sistema completo de recorrência (semanal, mensal, anual)
- **Agenda de Eventos**: Visualização de instalações e retiradas
- **Relatórios Dinâmicos**: Análises e métricas de negócio
- **Gestão de Clientes**: Base de dados completa de clientes
- **Gestão de Equipamentos**: Catálogo com categorias e controle de estoque
- **Sistema de Assinaturas**: Integração completa com Stripe
- **Geração de Contratos**: PDF automático com dados da empresa
- **Sistema de Notificações**: Alertas para recorrências no dia
- **Configurações**: Personalização do sistema e dados da empresa

---

## 🛠️ Stack Tecnológica

### Frontend

- **Next.js 15** com App Router
- **TypeScript** para tipagem estática
- **Tailwind CSS** para estilização
- **shadcn/ui** para componentes de interface
- **date-fns** para manipulação de datas
- **@react-pdf/renderer** para geração de PDFs

### Backend & Banco de Dados

- **Supabase** como Backend-as-a-Service
- **PostgreSQL** para armazenamento
- **Server Actions** para lógica de negócio no backend

### Integrações

- **Stripe** para sistema de assinaturas
- **Resend** para envio de emails transacionais
- **Vercel** para deploy e hosting

### Ferramentas

- **pnpm** como gerenciador de pacotes
- **ESLint** para qualidade de código
- **TypeScript** para verificação de tipos

---

## 📁 Arquitetura do Projeto

```
dazio-admim-1.0-main/
├── app/                    # Páginas e rotas (App Router)
│   ├── dashboard.tsx      # Dashboard principal
│   ├── orcamentos/        # Gestão de orçamentos
│   ├── locacoes/          # Controle de locações
│   ├── locacoes-recorrentes/ # Gestão de locações recorrentes
│   ├── clientes/          # Gestão de clientes
│   ├── equipamentos/      # Catálogo de equipamentos
│   ├── agenda/            # Agenda de eventos
│   ├── relatorios/        # Relatórios e análises
│   ├── configuracoes/     # Configurações do sistema
│   └── assinatura-gestao/ # Gestão de assinaturas
├── components/            # Componentes React reutilizáveis
│   ├── ui/               # Componentes base (shadcn/ui)
│   ├── budget-form-v2.tsx # Formulário avançado de orçamentos
│   ├── client-form.tsx    # Formulário de clientes
│   ├── rental-form.tsx    # Formulário de locações
│   ├── contract-pdf.tsx   # Componente para geração de PDF
│   ├── notification-bell.tsx # Sistema de notificações
│   ├── recurrence-config.tsx # Configuração de recorrência
│   └── app-sidebar.tsx    # Sidebar principal
├── lib/                   # Utilitários e configurações
│   ├── database/          # Camada de acesso aos dados
│   ├── utils/             # Funções utilitárias
│   ├── supabase.ts        # Configuração do Supabase
│   ├── stripe.ts          # Configuração do Stripe
│   ├── resend.ts          # Configuração do Resend
│   ├── subscription/      # Lógica de assinaturas
│   └── validation.ts      # Schemas de validação com Zod
├── hooks/                 # Custom hooks
│   └── useCompanyName.ts  # Hook para nome da empresa
├── scripts/               # Scripts SQL para migrações
└── public/                # Arquivos públicos (favicon, logos)
```

---

## 🔄 Fluxo Principal do Sistema

### 1. Criação de Orçamento

- Cliente selecionado da base de dados
- Equipamentos adicionados com quantidades e taxas
- Período de locação definido
- **Configuração de recorrência** (opcional)
- Cálculo automático de valores
- Status inicial: "Pendente"

### 2. Aprovação e Conversão

- Orçamento aprovado → Status "Aprovado"
- Criação automática de locação
- **Se recorrente**: Criação de locação recorrente
- Eventos de logística gerados na agenda
- Instalação e retirada agendadas

### 3. Gestão de Locações

- Acompanhamento de status: Instalação Pendente → Ativo → Concluído
- Controle de datas físicas de instalação/retirada
- Gestão de equipamentos alugados
- **Geração de contratos em PDF**

### 4. Locações Recorrentes

- **Sistema de recorrência**: Semanal, mensal, anual
- **Cálculo automático** de próximas ocorrências
- **Notificações** no dia da recorrência
- **Controle de status**: Ativo, pausado, cancelado, concluído

### 5. Agenda e Logística

- Visualização de eventos por data
- Instalações e retiradas organizadas
- Controle de status dos eventos

### 6. Gestão Financeira

- **Recebíveis**: Controle de valores a receber com status e vencimentos
- **Transações**: Registro de receitas e despesas por conta
- **Contas**: Gestão de contas bancárias e caixa
- **Aprovação**: Workflow de aprovação de recebíveis
- **Relatórios**: Análises financeiras e métricas de performance

---

## 🔁 Sistema de Recorrência

### Funcionalidades Implementadas

#### **Tipos de Recorrência**

- **Diária**: A cada X dias
- **Semanal**: A cada X semanas
- **Mensal**: A cada X meses
- **Anual**: A cada X anos

#### **Configuração Avançada**

- **Intervalo personalizável**: 1, 2, 3... períodos
- **Data de término opcional**: Controle de quando parar
- **Cálculo automático**: Próximas ocorrências calculadas automaticamente
- **Status de recorrência**: Ativo, pausado, cancelado, concluído

#### **Gestão Automática**

- **Geração automática** de ocorrências futuras
- **Controle de status** (ativa, pausada, cancelada)
- **Próxima ocorrência** sempre visível
- **Histórico completo** de ocorrências

### Implementação Técnica

#### **Banco de Dados**

```sql
-- Tabela rentals (atualizada)
ALTER TABLE rentals
ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN recurrence_type recurrence_type DEFAULT 'none',
ADD COLUMN recurrence_interval INTEGER DEFAULT 1,
ADD COLUMN recurrence_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN recurrence_status recurrence_status DEFAULT 'active',
ADD COLUMN parent_rental_id UUID REFERENCES rentals(id),
ADD COLUMN next_occurrence_date TIMESTAMP WITH TIME ZONE;

-- Nova tabela recurring_rental_occurrences
CREATE TABLE recurring_rental_occurrences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_rental_id UUID NOT NULL REFERENCES rentals(id),
  occurrence_number INTEGER NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  installation_date TIMESTAMP WITH TIME ZONE,
  removal_date TIMESTAMP WITH TIME ZONE,
  status rental_status DEFAULT 'Instalação Pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Funções SQL**

- **`calculate_next_occurrence`**: Calcula próxima data baseada no tipo
- **`generate_future_occurrences`**: Gera ocorrências futuras automaticamente
- **Triggers**: Atualização automática de timestamps

#### **Frontend**

- **Componente `RecurrenceConfig`**: Interface para configuração
- **Step dedicado** no formulário de orçamento
- **Página de gestão** para locações recorrentes
- **Preview visual** das próximas ocorrências

---

## 💳 Sistema de Assinaturas

### Integração com Stripe

#### **Funcionalidades**

- **Planos mensais e anuais** com preços fixos
- **Checkout integrado** do Stripe
- **Webhooks** para sincronização automática
- **Portal do cliente** para gestão
- **Status automático** (trial → active)

#### **Configuração**

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_1RsR6sKDs9V3MH8vtyRCyQmy
STRIPE_ANNUAL_PRICE_ID=price_1RsR6sKDs9V3MH8v8HfmE83N
```

#### **Fluxo de Assinatura**

1. **Usuário seleciona plano** (mensal/anual)
2. **Sistema cria customer** no Stripe
3. **Checkout session** é gerada
4. **Usuário completa pagamento** no Stripe
5. **Webhook processa** evento de sucesso
6. **Assinatura criada** no banco local
7. **Status da empresa** atualizado para "active"

#### **Webhooks Implementados**

- **`checkout.session.completed`**: Processa checkout bem-sucedido
- **`customer.subscription.created`**: Cria nova assinatura
- **`customer.subscription.updated`**: Atualiza assinatura existente
- **`customer.subscription.deleted`**: Cancela assinatura
- **`invoice.payment_succeeded`**: Confirma pagamento

#### **Estrutura do Banco**

```sql
-- Tabela subscriptions
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  company_id UUID NOT NULL REFERENCES company_profiles(id),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 📧 Integração com Resend

### Funcionalidades Implementadas

#### **Cadastro Automático**

- Todo novo usuário é automaticamente adicionado à audiência do Resend
- Dados incluídos: email, nome da empresa (se disponível)
- Status: inscrito por padrão

#### **Atualização Automática**

- Quando o perfil da empresa é atualizado, os dados na audiência são sincronizados
- Mantém informações sempre atualizadas

#### **Desinscrição**

- Link de desinscrição em todos os emails
- Página dedicada para gerenciar inscrição
- Possibilidade de re-inscrição

#### **Verificação de Status**

- API para verificar se um email está na audiência
- Controle de status de inscrição

### Configuração

#### **1. Criar Audiência no Resend**

1. Acesse o [painel do Resend](https://resend.com/audiences)
2. Clique em "Create Audience"
3. Dê um nome (ex: "Dazio Users")
4. Copie o **Audience ID** gerado

#### **2. Configurar Variável de Ambiente**

```env
RESEND_AUDIENCE_ID=f07a036f-bccf-4959-a940-a025ab7fdce5
```

#### **3. Verificar Configuração**

```bash
curl -X POST https://app.dazio.com.br/api/check-audience \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@exemplo.com"}'
```

### APIs Disponíveis

#### **Adicionar Contato**

```typescript
POST /api/auth/signup
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

#### **Verificar Contato**

```typescript
POST /api/check-audience
{
  "email": "usuario@exemplo.com"
}
```

#### **Desinscrever**

```typescript
POST /api/unsubscribe
{
  "email": "usuario@exemplo.com"
}
```

#### **Re-inscrever**

```typescript
POST /api/resubscribe
{
  "email": "usuario@exemplo.com"
}
```

### Estrutura de Tokens

```sql
-- Tabela email_confirmation_tokens
CREATE TABLE email_confirmation_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  token TEXT UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

#### **Gestão de Negócio**

- **`clients`**: Dados dos clientes
- **`equipments`**: Catálogo de equipamentos
- **`equipment_categories`**: Categorias de equipamentos
- **`budgets`**: Orçamentos gerados
- **`budget_items`**: Itens dos orçamentos
- **`rentals`**: Locações/contratos
- **`rental_items`**: Itens das locações
- **`rental_logistics_events`**: Eventos de logística

#### **Configuração e Assinaturas**

- **`company_profiles`**: Perfil da empresa
- **`company_settings`**: Configurações do sistema
- **`subscriptions`**: Assinaturas Stripe
- **`email_confirmation_tokens`**: Tokens de confirmação

#### **Campos de Recorrência**

- **`is_recurring`**: Boolean - Se é recorrente
- **`recurrence_type`**: weekly/monthly/yearly - Tipo de recorrência
- **`recurrence_interval`**: Integer - Intervalo da recorrência
- **`recurrence_end_date`**: Date - Data de término
- **`recurrence_status`**: active/paused/cancelled/completed - Status
- **`parent_rental_id`**: UUID - ID da locação pai (para ocorrências)
- **`next_occurrence_date`**: Date - Próxima ocorrência

#### **Relacionamentos**

- Cliente → Orçamentos → Locações
- Orçamentos → Itens de Orçamento
- Locações → Itens de Locação
- Locações → Eventos de Logística
- Locações → Locações Recorrentes (self-referencing)
- Usuário → Assinatura → Empresa

---

## ⚙️ Configuração e Instalação

### Pré-requisitos

- Node.js 18+
- pnpm instalado
- Conta no Supabase
- Conta no Stripe
- Conta no Resend
- Conta no Vercel

### Instalação

#### **1. Clonar o Repositório**

```bash
git clone [url-do-repositorio]
cd dazio-admim-1.0-main
```

#### **2. Instalar Dependências**

```bash
pnpm install
```

#### **5. Iniciar Desenvolvimento**

```bash
pnpm dev
```

### Scripts Disponíveis

```bash
pnpm dev          # Servidor de desenvolvimento
pnpm build        # Build de produção
pnpm start        # Servidor de produção
pnpm lint         # Verificação de código
```

---

## ⚡ Otimizações de Performance Implementadas

### Dashboard Otimizado

- **Consultas em Paralelo**: Todas as métricas carregadas simultaneamente
- **Sistema de Cache**: Cache de 5 minutos para métricas
- **Loading Progressivo**: Animações suaves e feedback visual
- **Delay Mínimo**: 300ms para evitar flash de loading

### Sistema de Cache Inteligente

- **TTL Configurável**: 5-10 minutos para diferentes tipos de dados
- **Cache por Página**: Cada página mantém seus dados em cache
- **Refresh Inteligente**: Só atualiza quando necessário
- **Prevenção de Refetches**: Evita chamadas desnecessárias à API

### Limitação de Dados

- **Carregamento Inteligente**: Máximo 50 registros por página inicial
- **Paginação Otimizada**: Navegação eficiente entre páginas
- **Filtros Rápidos**: Busca e filtros com debounce

### Configurações Avançadas

- **Supabase Otimizado**: Configuração para performance máxima
- **Componentes de Loading**: Spinners e skeletons reutilizáveis
- **Sistema de Retry**: Preparado para melhorar confiabilidade

---

## 🎨 Melhorias de UX Implementadas

### Formulário de Orçamentos (v2)

- **Layout em Colunas**: Informações organizadas lado a lado
- **Preview em Tempo Real**: Visualização instantânea do orçamento
- **Navegação por Abas**: Interface mais intuitiva
- **Validações Proativas**: Alertas para conflitos e indisponibilidades
- **Busca Simples**: Encontre equipamentos rapidamente
- **Configuração de Recorrência**: Integrada no primeiro passo

### Dashboard Aprimorado

- **Cards de Métricas**: Visualização clara dos KPIs
- **Ações Rápidas**: Acesso direto às principais funcionalidades
- **Loading Elegante**: Skeletons animados durante carregamento
- **Responsividade**: Interface adaptável a diferentes telas

### Páginas de Listagem

- **Paginação em Português**: Interface localizada
- **Ícones Representativos**: Identificação visual rápida
- **Filtros Avançados**: Busca por múltiplos critérios
- **Loading States**: Feedback visual durante operações
- **Toasts Elegantes**: Notificações não intrusivas

### Relatórios Funcionais

- **Dados Reais**: Conexão direta com o banco de dados
- **Filtros por Período**: Análises temporais
- **Métricas Calculadas**: Receita, ticket médio, top clientes
- **Visualização Clara**: Cards informativos organizados

### Configurações Melhoradas

- **Feedback Visual**: Confirmação de salvamento
- **Botão Inteligente**: Ativo apenas quando há mudanças
- **Limpeza Automática**: Feedback desaparece após 3 segundos
- **Validação em Tempo Real**: Verificação de dados
- **Template de Contrato**: Personalização do PDF

---

## 📝 Changelog

### Versão Atual (v1.0)

#### **✅ Sistema de Recorrência**

- Tipos de recorrência: Semanal, mensal, anual
- Intervalo configurável: 1, 2, 3... períodos
- Data de término: Controle de quando parar
- Cálculo automático: Próximas ocorrências calculadas automaticamente
- Status de recorrência: Ativo, pausado, cancelado, concluído

#### **✅ Sistema de Assinaturas**

- Integração completa com Stripe
- Planos mensais e anuais
- Webhooks para sincronização automática
- Portal do cliente para gestão
- Status automático (trial → active)

#### **✅ Integração com Resend**

- Cadastro automático na audiência
- Emails transacionais
- Sistema de confirmação de email
- Gestão de inscrições

#### **✅ Geração de Contratos**

- PDF automático com dados da empresa
- Template personalizável nas configurações
- Dados completos: Cliente, empresa, equipamentos, valores
- Download automático com nome personalizado

#### **✅ Sistema de Notificações**

- Notificações em tempo real para recorrências
- Badge de contagem no header
- Popover com lista de notificações
- Marcação como lida

#### **✅ Interface Aprimorada**

- Logo da empresa no sidebar
- Favicon personalizado
- Toasts elegantes em vez de alerts
- Feedback visual melhorado

#### **✅ Performance e Cache**

- Sistema de cache inteligente com TTL
- Prevenção de recarregamentos desnecessários
- Otimização de useEffect e dependências
- Cache por página para melhor experiência

### Funcionalidades Principais

- ✅ Dashboard com métricas em tempo real
- ✅ Gestão completa de orçamentos
- ✅ Controle de locações com recorrência
- ✅ Agenda de eventos de logística
- ✅ Relatórios dinâmicos
- ✅ Gestão de clientes e equipamentos
- ✅ Configurações da empresa
- ✅ Geração automática de contratos
- ✅ Sistema de assinaturas completo
- ✅ Integração com email transacional

---

## 🎯 Próximas Funcionalidades

### **Em Desenvolvimento**

- [ ] Sistema de autenticação avançado
- [ ] Múltiplos usuários e permissões
- [ ] Backup automático do banco
- [ ] Logs de auditoria completos

### **Planejadas**

- [ ] Integração com gateways de pagamento brasileiros
- [ ] App mobile nativo
- [ ] Fluxo de caixa projetado
- [ ] Conciliação bancária automática
- [ ] Sistema de relatórios avançados
- [ ] API REST para integrações externas
- [ ] Sistema de backup em nuvem
- [ ] Monitoramento de performance em tempo real

### **Melhorias de UX**

- [ ] Modo escuro/claro
- [ ] Personalização de temas
- [ ] Atalhos de teclado
- [ ] Tour interativo para novos usuários
- [ ] Sistema de ajuda contextual

---

## 📞 Suporte

### **Documentação Técnica**

- Este README contém todas as informações necessárias
- Scripts SQL estão organizados por funcionalidade
- Componentes React seguem padrões estabelecidos

### **Para Desenvolvedores**

- Código comentado e organizado
- Tipos TypeScript bem definidos
- Padrões de nomenclatura consistentes
- Estrutura de pastas lógica

### **Para Usuários**

- Interface intuitiva e responsiva
- Feedback visual claro para todas as ações
- Sistema de ajuda integrado
- Suporte técnico disponível

---

**Dazio - Sistema de Gestão de Locações**  
_Versão 1.0 - 2024_

**Status**: ✅ Implementado e Funcionando  
**Última atualização**: Dezembro 2024
