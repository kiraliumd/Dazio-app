# Implementação de Locações Recorrentes

## Resumo da Implementação

Esta implementação adiciona suporte completo a locações recorrentes no sistema de gestão de equipamentos, permitindo que orçamentos sejam configurados como recorrentes e automaticamente gerem locações futuras.

## Funcionalidades Implementadas

### 1. Banco de Dados
- **Tabela `rentals`**: Adicionados campos de recorrência
  - `is_recurring`: Boolean indicando se é recorrente
  - `recurrence_type`: Tipo de recorrência (daily, weekly, monthly, yearly)
  - `recurrence_interval`: Intervalo entre ocorrências
  - `recurrence_end_date`: Data de término (opcional)
  - `recurrence_status`: Status da recorrência (active, paused, cancelled, completed)
  - `parent_rental_id`: ID da locação pai (para ocorrências)
  - `next_occurrence_date`: Próxima data de ocorrência

- **Tabela `recurring_rental_occurrences`**: Nova tabela para gerenciar ocorrências
  - `parent_rental_id`: Referência à locação pai
  - `occurrence_number`: Número sequencial da ocorrência
  - `start_date` e `end_date`: Período da ocorrência
  - `installation_date` e `removal_date`: Datas de instalação/retirada
  - `status`: Status da ocorrência

- **Tabela `budgets`**: Adicionados campos de recorrência
  - `is_recurring`: Boolean indicando se é recorrente
  - `recurrence_type`: Tipo de recorrência
  - `recurrence_interval`: Intervalo entre ocorrências
  - `recurrence_end_date`: Data de término

### 2. Frontend - Formulário de Orçamento
- **Novo step "Recorrência"** no formulário de orçamento
- **Checkbox** para ativar recorrência
- **Seleção de tipo**: Diário, Semanal, Mensal, Anual
- **Configuração de intervalo**: Número de dias/semanas/meses/anos
- **Data de término opcional** para recorrências anuais
- **Resumo visual** no step de finalização

### 3. Frontend - Página de Orçamentos
- **Nova coluna "Recorrência"** na tabela
- **Ícone visual** para orçamentos recorrentes
- **Redirecionamento inteligente**: Orçamentos recorrentes aprovados vão para página de recorrências

### 4. Frontend - Página de Locações Recorrentes
- **Página dedicada** `/locacoes/recorrentes`
- **Listagem de locações recorrentes** com status
- **Gestão de ocorrências** individuais
- **Controles de pausar/retomar/cancelar** recorrência

### 5. Backend - Funções de Banco
- **`createRecurringRental`**: Criar locação recorrente
- **`getRecurringRentals`**: Buscar locações recorrentes
- **`updateRecurrenceStatus`**: Atualizar status da recorrência
- **`generateOccurrences`**: Gerar ocorrências automaticamente
- **`getOccurrences`**: Buscar ocorrências de uma locação

### 6. Navegação
- **Submenu "Recorrências"** no sidebar
- **Link direto** para página de recorrências
- **Redirecionamento automático** baseado no tipo de orçamento

## Fluxo de Uso

### 1. Criação de Orçamento Recorrente
1. Usuário cria novo orçamento
2. No step 3, marca checkbox "Orçamento recorrente"
3. Seleciona tipo e intervalo de recorrência
4. Finaliza orçamento

### 2. Aprovação de Orçamento Recorrente
1. Usuário aprova orçamento recorrente
2. Sistema cria locação recorrente
3. Sistema gera ocorrências futuras automaticamente
4. Usuário é redirecionado para página de recorrências

### 3. Gestão de Recorrências
1. Usuário visualiza locações recorrentes
2. Pode pausar, retomar ou cancelar recorrências
3. Pode gerenciar ocorrências individuais
4. Sistema atualiza automaticamente próximas ocorrências

## Scripts SQL Criados

1. **053-add-recurrence-to-rentals.sql**: Adiciona campos de recorrência à tabela rentals
2. **054-create-occurrences-table.sql**: Cria tabela de ocorrências
3. **055-create-occurrences-indexes.sql**: Cria índices para performance
4. **056-create-occurrences-trigger.sql**: Cria trigger para atualização automática
5. **057-create-occurrences-for-existing.sql**: Cria ocorrências para locações existentes
6. **058-add-recurrence-to-budgets.sql**: Adiciona campos de recorrência à tabela budgets

## Tipos TypeScript

- **`RecurrenceType`**: "none" | "daily" | "weekly" | "monthly" | "yearly"
- **`RecurrenceStatus`**: "active" | "paused" | "cancelled" | "completed"
- **`RecurringRentalOccurrence`**: Interface para ocorrências
- **Campos de recorrência** adicionados às interfaces `Budget` e `Rental`

## Componentes React

- **`RecurrenceConfig`**: Componente para configuração de recorrência
- **Atualização do `BudgetFormV2`**: Inclui step de recorrência
- **Página de recorrências**: Gestão completa de locações recorrentes

## Benefícios

1. **Automatização**: Geração automática de locações futuras
2. **Flexibilidade**: Múltiplos tipos de recorrência
3. **Controle**: Gestão completa de status e ocorrências
4. **Integração**: Fluxo natural do orçamento para locação
5. **Performance**: Índices otimizados e queries eficientes

## Próximos Passos

1. **Testes**: Validar funcionamento em diferentes cenários
2. **Notificações**: Alertas para próximas ocorrências
3. **Relatórios**: Relatórios específicos para recorrências
4. **API**: Endpoints para integração externa
5. **Dashboard**: Métricas de recorrências no dashboard principal 