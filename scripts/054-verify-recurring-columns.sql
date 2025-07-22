-- Script para verificar e corrigir colunas de recorrência
-- Execute este script para garantir que todas as colunas necessárias existem

-- 1. Verificar se as colunas existem
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'rentals' 
AND column_name IN ('is_recurring', 'recurrence_type', 'recurrence_interval', 'recurrence_end_date', 'recurrence_status', 'parent_rental_id', 'next_occurrence_date')
ORDER BY column_name;

-- 2. Criar tipos ENUM se não existirem
DO $$ 
BEGIN
  -- Criar tipo recurrence_type se não existir
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recurrence_type') THEN
    CREATE TYPE recurrence_type AS ENUM ('none', 'daily', 'weekly', 'monthly', 'yearly');
  END IF;
  
  -- Criar tipo recurrence_status se não existir
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recurrence_status') THEN
    CREATE TYPE recurrence_status AS ENUM ('active', 'paused', 'cancelled', 'completed');
  END IF;
END $$;

-- 3. Adicionar colunas se não existirem
ALTER TABLE rentals 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_type recurrence_type DEFAULT 'none',
ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS recurrence_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS recurrence_status recurrence_status DEFAULT 'active',
ADD COLUMN IF NOT EXISTS parent_rental_id UUID REFERENCES rentals(id),
ADD COLUMN IF NOT EXISTS next_occurrence_date TIMESTAMP WITH TIME ZONE;

-- 4. Verificar se a tabela de ocorrências existe
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'recurring_rental_occurrences'
ORDER BY ordinal_position;

-- 5. Criar tabela de ocorrências se não existir
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

-- 6. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_rentals_recurring ON rentals(is_recurring, recurrence_status);
CREATE INDEX IF NOT EXISTS idx_rentals_next_occurrence ON rentals(next_occurrence_date) WHERE is_recurring = TRUE;
CREATE INDEX IF NOT EXISTS idx_recurring_occurrences_parent ON recurring_rental_occurrences(parent_rental_id);
CREATE INDEX IF NOT EXISTS idx_recurring_occurrences_dates ON recurring_rental_occurrences(start_date, end_date);

-- 7. Verificação final
SELECT 'Verificação final das colunas de recorrência:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'rentals' 
AND column_name LIKE '%recurrence%'
ORDER BY ordinal_position;

SELECT 'Verificação da tabela de ocorrências:' as info;
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'recurring_rental_occurrences'
ORDER BY ordinal_position; 