-- Migração para a tabela rentals (baseado na estrutura real)
-- Este script altera as colunas de data para timestamptz

-- Alterar colunas na tabela rentals
ALTER TABLE rentals 
ALTER COLUMN event_start_date TYPE TIMESTAMP WITH TIME ZONE USING event_start_date::TIMESTAMP WITH TIME ZONE,
ALTER COLUMN event_end_date TYPE TIMESTAMP WITH TIME ZONE USING event_end_date::TIMESTAMP WITH TIME ZONE,
ALTER COLUMN removal_date TYPE TIMESTAMP WITH TIME ZONE USING removal_date::TIMESTAMP WITH TIME ZONE;

-- Comentários explicativos
COMMENT ON COLUMN rentals.event_start_date IS 'Data e hora de início do evento (com timezone)';
COMMENT ON COLUMN rentals.event_end_date IS 'Data e hora de fim do evento (com timezone)';
COMMENT ON COLUMN rentals.removal_date IS 'Data e hora de remoção (com timezone)';

-- Verificar se a migração foi bem-sucedida
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'rentals' 
AND column_name IN ('event_start_date', 'event_end_date', 'removal_date')
ORDER BY column_name; 