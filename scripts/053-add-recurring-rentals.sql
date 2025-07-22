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
  status TEXT DEFAULT 'Instalação Pendente',
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
  input_date TIMESTAMP WITH TIME ZONE,
  recurrence_type recurrence_type,
  recurrence_interval INTEGER
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  CASE recurrence_type
    WHEN 'daily' THEN
      RETURN input_date + (recurrence_interval || ' days')::INTERVAL;
    WHEN 'weekly' THEN
      RETURN input_date + (recurrence_interval || ' weeks')::INTERVAL;
    WHEN 'monthly' THEN
      RETURN input_date + (recurrence_interval || ' months')::INTERVAL;
    WHEN 'yearly' THEN
      RETURN input_date + (recurrence_interval || ' years')::INTERVAL;
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

-- 9. Comentários explicativos
COMMENT ON TABLE recurring_rental_occurrences IS 'Histórico de ocorrências de locações recorrentes';
COMMENT ON COLUMN rentals.is_recurring IS 'Indica se a locação é recorrente';
COMMENT ON COLUMN rentals.recurrence_type IS 'Tipo de recorrência: daily, weekly, monthly, yearly';
COMMENT ON COLUMN rentals.recurrence_interval IS 'Intervalo da recorrência (ex: 1 = mensal, 2 = bimestral)';
COMMENT ON COLUMN rentals.recurrence_end_date IS 'Data de fim da recorrência (NULL = indefinida)';
COMMENT ON COLUMN rentals.recurrence_status IS 'Status da recorrência: active, paused, cancelled, completed';
COMMENT ON COLUMN rentals.parent_rental_id IS 'ID da locação pai (para ocorrências geradas)';
COMMENT ON COLUMN rentals.next_occurrence_date IS 'Próxima data de ocorrência';

-- 10. Verificar estrutura criada
SELECT 'ESTRUTURA DE RECORRÊNCIA CRIADA' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'rentals' 
AND column_name LIKE '%recurrence%'
ORDER BY ordinal_position;

SELECT 'TABELA DE OCORRÊNCIAS CRIADA' as info;
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'recurring_rental_occurrences'
ORDER BY ordinal_position; 

## Script 1: Verificar todas as locações
```sql
-- Verificar todas as locações para identificar problemas

-- 1. Verificar todas as locações recentes
SELECT 'TODAS AS LOCAÇÕES RECENTES:' as info;
SELECT 
    id,
    client_name,
    start_date,
    end_date,
    is_recurring,
    recurrence_type,
    recurrence_interval,
    recurrence_status,
    recurrence_end_date,
    next_occurrence_date,
    created_at
FROM rentals 
ORDER BY created_at DESC
LIMIT 10;

-- 2. Verificar locações com dados de recorrência mas is_recurring = false
SELECT 'LOCAÇÕES COM DADOS DE RECORRÊNCIA MAS IS_RECURRING = FALSE:' as info;
SELECT 
    id,
    client_name,
    start_date,
    end_date,
    is_recurring,
    recurrence_type,
    recurrence_interval,
    recurrence_status,
    recurrence_end_date,
    created_at
FROM rentals 
WHERE (recurrence_type IS NOT NULL AND recurrence_type != 'none')
   OR recurrence_interval > 1
   OR recurrence_status IS NOT NULL
   OR recurrence_end_date IS NOT NULL
ORDER BY created_at DESC;

-- 3. Verificar locações com budget_id (orçamentos aprovados)
SELECT 'LOCAÇÕES COM BUDGET_ID (ORÇAMENTOS APROVADOS):' as info;
SELECT 
    id,
    client_name,
    start_date,
    end_date,
    budget_id,
    is_recurring,
    recurrence_type,
    recurrence_interval,
    recurrence_status,
    created_at
FROM rentals 
WHERE budget_id IS NOT NULL
ORDER BY created_at DESC;

-- 4. Contar estatísticas
SELECT 'ESTATÍSTICAS:' as info;
SELECT 
    COUNT(*) as total_rentals,
    COUNT(CASE WHEN is_recurring = true THEN 1 END) as recurring_rentals,
    COUNT(CASE WHEN is_recurring = false OR is_recurring IS NULL THEN 1 END) as non_recurring_rentals,
    COUNT(CASE WHEN budget_id IS NOT NULL THEN 1 END) as rentals_from_budgets,
    COUNT(CASE WHEN recurrence_type IS NOT NULL AND recurrence_type != 'none' THEN 1 END) as rentals_with_recurrence_type
FROM rentals; 