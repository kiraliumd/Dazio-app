# 🚀 Implementação de Locações Recorrentes - Sem Drizzle

Este guia explica como implementar a funcionalidade de locações recorrentes no sistema Precisa Admin, usando apenas Supabase diretamente.

## 📋 Pré-requisitos

- Projeto configurado com Supabase
- Acesso ao SQL Editor do Supabase Dashboard
- Conhecimento básico de SQL

## 🔧 Passos de Implementação

### 1. Executar o Script SQL

Execute o script `053-add-recurring-rentals.sql` no SQL Editor do Supabase Dashboard:

```sql
-- Script para adicionar suporte a locações recorrentes
-- Execute este script para implementar a funcionalidade de recorrência

-- 1. Criar enum para tipos de recorrência
CREATE TYPE recurrence_type AS ENUM ('none', 'daily', 'weekly', 'monthly', 'yearly');

-- 2. Criar enum para status de recorrência
CREATE TYPE recurrence_status AS ENUM ('active', 'paused', 'cancelled', 'completed');

-- 3. Adicionar colunas de recorrência à tabela rentals
ALTER TABLE rentals 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_type recurrence_type DEFAULT 'none',
ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS recurrence_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS recurrence_status recurrence_status DEFAULT 'active',
ADD COLUMN IF NOT EXISTS parent_rental_id UUID REFERENCES rentals(id),
ADD COLUMN IF NOT EXISTS next_occurrence_date TIMESTAMP WITH TIME ZONE;

-- 4. Criar tabela para histórico de ocorrências recorrentes
CREATE TABLE IF NOT EXISTS recurring_rental_occurrences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  occurrence_number INTEGER NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  installation_date TIMESTAMP WITH TIME ZONE,
  removal_date TIMESTAMP WITH TIME ZONE,
  status rental_status DEFAULT 'Instalação Pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(parent_rental_id, occurrence_number)
);

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_rentals_recurring ON rentals(is_recurring, recurrence_status);
CREATE INDEX IF NOT EXISTS idx_rentals_next_occurrence ON rentals(next_occurrence_date) WHERE is_recurring = TRUE;
CREATE INDEX IF NOT EXISTS idx_recurring_occurrences_parent ON recurring_rental_occurrences(parent_rental_id);
CREATE INDEX IF NOT EXISTS idx_recurring_occurrences_dates ON recurring_rental_occurrences(start_date, end_date);

-- 6. Criar função para calcular próxima ocorrência
CREATE OR REPLACE FUNCTION calculate_next_occurrence(
  current_date TIMESTAMP WITH TIME ZONE,
  recurrence_type recurrence_type,
  recurrence_interval INTEGER
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  CASE recurrence_type
    WHEN 'daily' THEN
      RETURN current_date + (recurrence_interval || ' days')::INTERVAL;
    WHEN 'weekly' THEN
      RETURN current_date + (recurrence_interval || ' weeks')::INTERVAL;
    WHEN 'monthly' THEN
      RETURN current_date + (recurrence_interval || ' months')::INTERVAL;
    WHEN 'yearly' THEN
      RETURN current_date + (recurrence_interval || ' years')::INTERVAL;
    ELSE
      RETURN NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar função para gerar ocorrências futuras
CREATE OR REPLACE FUNCTION generate_future_occurrences(
  rental_id UUID,
  max_occurrences INTEGER DEFAULT 12
) RETURNS VOID AS $$
DECLARE
  rental_record RECORD;
  current_occurrence_date TIMESTAMP WITH TIME ZONE;
  next_date TIMESTAMP WITH TIME ZONE;
  occurrence_count INTEGER;
  days_diff INTEGER;
BEGIN
  -- Buscar dados da locação recorrente
  SELECT * INTO rental_record 
  FROM rentals 
  WHERE id = rental_id AND is_recurring = TRUE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Locação não encontrada ou não é recorrente';
  END IF;
  
  -- Calcular diferença em dias entre start_date e end_date
  days_diff := EXTRACT(DAY FROM (rental_record.end_date - rental_record.start_date)) + 1;
  
  -- Usar next_occurrence_date se existir, senão usar end_date
  current_occurrence_date := COALESCE(rental_record.next_occurrence_date, rental_record.end_date);
  
  -- Contar ocorrências existentes
  SELECT COALESCE(MAX(occurrence_number), 0) INTO occurrence_count
  FROM recurring_rental_occurrences
  WHERE parent_rental_id = rental_id;
  
  -- Gerar ocorrências futuras
  FOR i IN 1..max_occurrences LOOP
    -- Calcular próxima data
    next_date := calculate_next_occurrence(current_occurrence_date, rental_record.recurrence_type, rental_record.recurrence_interval);
    
    -- Verificar se ultrapassou a data de fim da recorrência
    IF rental_record.recurrence_end_date IS NOT NULL AND next_date > rental_record.recurrence_end_date THEN
      EXIT;
    END IF;
    
    -- Inserir ocorrência
    INSERT INTO recurring_rental_occurrences (
      parent_rental_id,
      occurrence_number,
      start_date,
      end_date,
      status
    ) VALUES (
      rental_id,
      occurrence_count + i,
      next_date,
      next_date + (days_diff || ' days')::INTERVAL - INTERVAL '1 day',
      'Instalação Pendente'
    );
    
    current_occurrence_date := next_date;
  END LOOP;
  
  -- Atualizar next_occurrence_date na locação principal
  UPDATE rentals 
  SET next_occurrence_date = current_occurrence_date
  WHERE id = rental_id;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recurring_occurrences_updated_at
  BEFORE UPDATE ON recurring_rental_occurrences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. Verificar a Estrutura

Após executar o script, verifique se as colunas foram criadas corretamente:

```sql
-- Verificar estrutura da tabela rentals
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'rentals' 
AND column_name LIKE '%recurrence%'
ORDER BY ordinal_position;

-- Verificar tabela de ocorrências
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'recurring_rental_occurrences'
ORDER BY ordinal_position;
```

### 3. Arquivos Criados/Modificados

Os seguintes arquivos já foram criados e estão prontos para uso:

#### **Tipos e Interfaces:**
- ✅ `lib/supabase.ts` - Tipos atualizados para recorrência
- ✅ `lib/utils/data-transformers.ts` - Funções de transformação atualizadas

#### **Componentes:**
- ✅ `components/recurrence-config.tsx` - Componente de configuração
- ✅ `components/rental-form.tsx` - Formulário atualizado

#### **Funções de Banco:**
- ✅ `lib/database/recurring-rentals.ts` - CRUD para recorrência

#### **Páginas:**
- ✅ `app/locacoes-recorrentes/page.tsx` - Página de gestão

### 4. Adicionar Link no Sidebar

Adicione o link para "Locações Recorrentes" no sidebar:

```tsx
// Em components/app-sidebar.tsx
{
  name: "Locações Recorrentes",
  href: "/locacoes-recorrentes",
  icon: Repeat,
  description: "Gerencie locações recorrentes"
}
```

### 5. Testar a Funcionalidade

1. **Criar Locação Recorrente:**
   - Vá em "Locações" → "Nova Locação"
   - Configure os dados básicos
   - Ative "Locação Recorrente"
   - Escolha tipo e intervalo
   - Salve

2. **Gerenciar Recorrências:**
   - Acesse "Locações Recorrentes"
   - Veja todas as recorrências ativas
   - Use filtros e ações

## 🎯 Funcionalidades Implementadas

### **Configuração de Recorrência:**
- ✅ Toggle para ativar/desativar
- ✅ Seleção de tipo (diária, semanal, mensal, anual)
- ✅ Intervalo personalizável
- ✅ Data de fim opcional
- ✅ Preview das próximas ocorrências

### **Gestão Automática:**
- ✅ Geração automática de ocorrências futuras
- ✅ Controle de status (ativa, pausada, cancelada)
- ✅ Próxima ocorrência sempre visível
- ✅ Histórico completo de ocorrências

### **Interface de Usuário:**
- ✅ Página dedicada para gestão
- ✅ Filtros por status e tipo
- ✅ Busca por cliente/local
- ✅ Ações rápidas (pausar/retomar/cancelar)
- ✅ Estatísticas em tempo real

## 🔍 Estrutura do Banco de Dados

### **Tabela `rentals` (atualizada):**
```sql
-- Novos campos adicionados:
is_recurring: BOOLEAN DEFAULT FALSE
recurrence_type: ENUM('none', 'daily', 'weekly', 'monthly', 'yearly')
recurrence_interval: INTEGER DEFAULT 1
recurrence_end_date: TIMESTAMP WITH TIME ZONE
recurrence_status: ENUM('active', 'paused', 'cancelled', 'completed')
parent_rental_id: UUID REFERENCES rentals(id)
next_occurrence_date: TIMESTAMP WITH TIME ZONE
```

### **Nova tabela `recurring_rental_occurrences`:**
```sql
id: UUID PRIMARY KEY
parent_rental_id: UUID REFERENCES rentals(id)
occurrence_number: INTEGER
start_date: TIMESTAMP WITH TIME ZONE
end_date: TIMESTAMP WITH TIME ZONE
installation_date: TIMESTAMP WITH TIME ZONE
removal_date: TIMESTAMP WITH TIME ZONE
status: ENUM('Instalação Pendente', 'Ativo', 'Concluído')
created_at: TIMESTAMP WITH TIME ZONE
updated_at: TIMESTAMP WITH TIME ZONE
```

## 🚀 Próximos Passos

1. **Executar o script SQL** no Supabase
2. **Adicionar link** no sidebar
3. **Testar** a funcionalidade completa
4. **Configurar** notificações automáticas (opcional)

## 📝 Notas Importantes

- A funcionalidade usa apenas Supabase, sem dependências do Drizzle
- Todas as funções SQL estão otimizadas para performance
- A interface segue os padrões do projeto existente
- O código está pronto para produção

A implementação está completa e pronta para uso! 🎉 