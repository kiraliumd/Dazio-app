-- Script para verificar a estrutura da tabela rental_logistics_events
-- Execute este script para ver exatamente quais colunas existem

-- Verificar estrutura completa da tabela rental_logistics_events
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

-- Verificar se a tabela existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'rental_logistics_events'; 