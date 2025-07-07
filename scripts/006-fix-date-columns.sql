-- Migração para corrigir colunas de data para timestamptz
-- Este script resolve o problema de timezone nas datas

-- Alterar colunas na tabela budgets
ALTER TABLE budgets 
ALTER COLUMN start_date TYPE TIMESTAMP WITH TIME ZONE USING start_date::TIMESTAMP WITH TIME ZONE,
ALTER COLUMN end_date TYPE TIMESTAMP WITH TIME ZONE USING end_date::TIMESTAMP WITH TIME ZONE;

-- Alterar colunas na tabela rentals
ALTER TABLE rentals 
ALTER COLUMN start_date TYPE TIMESTAMP WITH TIME ZONE USING start_date::TIMESTAMP WITH TIME ZONE,
ALTER COLUMN end_date TYPE TIMESTAMP WITH TIME ZONE USING end_date::TIMESTAMP WITH TIME ZONE;

-- Comentários explicativos
COMMENT ON COLUMN budgets.start_date IS 'Data e hora de início do período (com timezone)';
COMMENT ON COLUMN budgets.end_date IS 'Data e hora de fim do período (com timezone)';
COMMENT ON COLUMN rentals.start_date IS 'Data e hora de início da locação (com timezone)';
COMMENT ON COLUMN rentals.end_date IS 'Data e hora de fim da locação (com timezone)'; 