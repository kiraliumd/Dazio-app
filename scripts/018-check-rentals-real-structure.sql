-- Script para verificar a estrutura REAL da tabela rentals
-- Execute este script para ver TODAS as colunas

-- Verificar estrutura completa da tabela rentals
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'rentals' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar constraints da tabela
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'rentals'::regclass;

-- Verificar se há dados na tabela
SELECT COUNT(*) as total_rentals FROM rentals; 