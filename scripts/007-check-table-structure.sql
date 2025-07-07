-- Script para verificar a estrutura real das tabelas
-- Execute este script primeiro para descobrir os nomes corretos das colunas

-- Verificar estrutura da tabela budgets
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'budgets' 
ORDER BY ordinal_position;

-- Verificar estrutura da tabela rentals
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'rentals' 
ORDER BY ordinal_position;

-- Verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('budgets', 'rentals'); 