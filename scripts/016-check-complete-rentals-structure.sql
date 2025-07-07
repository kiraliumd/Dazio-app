-- Script para verificar a estrutura completa da tabela rentals
-- Execute este script para ver todas as colunas

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

-- Verificar se há dados na tabela
SELECT COUNT(*) as total_rentals FROM rentals;

-- Verificar se há outras tabelas relacionadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%rental%'
ORDER BY table_name; 