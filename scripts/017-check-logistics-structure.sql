-- Script para verificar a estrutura da tabela rental_logistics_events
-- Execute este script para ver todas as colunas

-- Verificar estrutura da tabela rental_logistics_events
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'rental_logistics_events' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se há dados na tabela
SELECT COUNT(*) as total_events FROM rental_logistics_events;

-- Verificar estrutura da tabela rental_items
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'rental_items' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se há dados na tabela rental_items
SELECT COUNT(*) as total_items FROM rental_items; 