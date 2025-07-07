-- Migração completa para corrigir colunas de data para timestamptz
-- Este script altera as colunas de data em ambas as tabelas: budgets e rentals

-- 1. Migrar tabela budgets
ALTER TABLE budgets 
ALTER COLUMN start_date TYPE TIMESTAMP WITH TIME ZONE USING start_date::TIMESTAMP WITH TIME ZONE,
ALTER COLUMN end_date TYPE TIMESTAMP WITH TIME ZONE USING end_date::TIMESTAMP WITH TIME ZONE;

-- 2. Migrar tabela rentals
ALTER TABLE rentals 
ALTER COLUMN event_start_date TYPE TIMESTAMP WITH TIME ZONE USING event_start_date::TIMESTAMP WITH TIME ZONE,
ALTER COLUMN event_end_date TYPE TIMESTAMP WITH TIME ZONE USING event_end_date::TIMESTAMP WITH TIME ZONE,
ALTER COLUMN removal_date TYPE TIMESTAMP WITH TIME ZONE USING removal_date::TIMESTAMP WITH TIME ZONE;

-- Comentários explicativos para budgets
COMMENT ON COLUMN budgets.start_date IS 'Data e hora de início do período (com timezone)';
COMMENT ON COLUMN budgets.end_date IS 'Data e hora de fim do período (com timezone)';

-- Comentários explicativos para rentals
COMMENT ON COLUMN rentals.event_start_date IS 'Data e hora de início do evento (com timezone)';
COMMENT ON COLUMN rentals.event_end_date IS 'Data e hora de fim do evento (com timezone)';
COMMENT ON COLUMN rentals.removal_date IS 'Data e hora de remoção (com timezone)';

-- Verificar se a migração foi bem-sucedida
SELECT 'budgets' as table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'budgets' 
AND column_name IN ('start_date', 'end_date')
ORDER BY column_name

UNION ALL

SELECT 'rentals' as table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'rentals' 
AND column_name IN ('event_start_date', 'event_end_date', 'removal_date')
ORDER BY column_name; 