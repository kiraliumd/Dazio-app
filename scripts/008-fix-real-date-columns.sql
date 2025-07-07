-- Migração para corrigir colunas de data para timestamptz
-- Baseado na estrutura real do banco de dados

-- Alterar colunas na tabela rentals (que é a que aparece no resultado)
ALTER TABLE rentals 
ALTER COLUMN event_start_date TYPE TIMESTAMP WITH TIME ZONE USING event_start_date::TIMESTAMP WITH TIME ZONE,
ALTER COLUMN event_end_date TYPE TIMESTAMP WITH TIME ZONE USING event_end_date::TIMESTAMP WITH TIME ZONE,
ALTER COLUMN removal_date TYPE TIMESTAMP WITH TIME ZONE USING removal_date::TIMESTAMP WITH TIME ZONE;

-- Comentários explicativos
COMMENT ON COLUMN rentals.event_start_date IS 'Data e hora de início do evento (com timezone)';
COMMENT ON COLUMN rentals.event_end_date IS 'Data e hora de fim do evento (com timezone)';
COMMENT ON COLUMN rentals.removal_date IS 'Data e hora de remoção (com timezone)';

-- Verificar se existe a tabela budgets e suas colunas
-- (Execute este comando para verificar se a tabela budgets existe)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'budgets'; 