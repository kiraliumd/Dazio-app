-- Script simples para adicionar colunas de recorrência à tabela rentals
-- Execute este script para implementar a funcionalidade de recorrência

-- 1. Criar enum para tipos de recorrência (se não existir)
DO $$ BEGIN
    CREATE TYPE recurrence_type AS ENUM ('none', 'daily', 'weekly', 'monthly', 'yearly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Criar enum para status de recorrência (se não existir)
DO $$ BEGIN
    CREATE TYPE recurrence_status AS ENUM ('active', 'paused', 'cancelled', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Adicionar colunas de recorrência à tabela rentals
ALTER TABLE rentals 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_type recurrence_type DEFAULT 'none',
ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS recurrence_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS recurrence_status recurrence_status DEFAULT 'active',
ADD COLUMN IF NOT EXISTS parent_rental_id UUID REFERENCES rentals(id),
ADD COLUMN IF NOT EXISTS next_occurrence_date TIMESTAMP WITH TIME ZONE;

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_rentals_recurring ON rentals(is_recurring, recurrence_status);
CREATE INDEX IF NOT EXISTS idx_rentals_next_occurrence ON rentals(next_occurrence_date) WHERE is_recurring = TRUE;

-- 5. Verificar estrutura criada
SELECT 'COLUNAS DE RECORRÊNCIA ADICIONADAS' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'rentals' 
AND column_name LIKE '%recurrence%'
ORDER BY ordinal_position; 