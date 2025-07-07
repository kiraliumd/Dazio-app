-- Migração baseada na estrutura real do banco
-- Este script altera as colunas de data para timestamptz

-- Primeiro, vamos verificar todas as tabelas que existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verificar estrutura da tabela rentals (que sabemos que existe)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'rentals' 
ORDER BY ordinal_position;

-- Verificar se existe tabela budgets
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'budgets' 
ORDER BY ordinal_position; 