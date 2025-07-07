-- Script para verificar a estrutura atual da tabela rentals
-- Execute este script para ver se há algum problema com as colunas

SELECT 'ESTRUTURA ATUAL DA TABELA RENTALS' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'rentals' 
ORDER BY ordinal_position;

-- Verificar constraints da tabela
SELECT 'CONSTRAINTS DA TABELA RENTALS' as info;
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'rentals';

-- Verificar se há dados na tabela
SELECT 'DADOS NA TABELA RENTALS' as info;
SELECT 
    COUNT(*) as total_rentals,
    COUNT(CASE WHEN client_id IS NOT NULL THEN 1 END) as with_client_id,
    COUNT(CASE WHEN client_name IS NOT NULL THEN 1 END) as with_client_name,
    COUNT(CASE WHEN start_date IS NOT NULL THEN 1 END) as with_start_date,
    COUNT(CASE WHEN end_date IS NOT NULL THEN 1 END) as with_end_date,
    COUNT(CASE WHEN installation_time IS NOT NULL THEN 1 END) as with_installation_time,
    COUNT(CASE WHEN removal_time IS NOT NULL THEN 1 END) as with_removal_time
FROM rentals;

-- Verificar últimos registros
SELECT 'ÚLTIMOS REGISTROS' as info;
SELECT 
    id,
    client_id,
    client_name,
    start_date,
    end_date,
    installation_time,
    removal_time,
    status,
    created_at
FROM rentals 
ORDER BY created_at DESC 
LIMIT 5; 