-- Script para verificar a estrutura real da tabela rental_logistics_events
-- Execute este script para ver exatamente quais colunas existem

-- 1. Verificar estrutura completa da tabela
SELECT 'ESTRUTURA REAL DA TABELA RENTAL_LOGISTICS_EVENTS' as info;
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

-- 2. Verificar se há dados na tabela
SELECT 'DADOS EXISTENTES' as info;
SELECT 
    COUNT(*) as total_events,
    COUNT(DISTINCT rental_id) as unique_rentals
FROM rental_logistics_events;

-- 3. Verificar alguns registros de exemplo (se houver)
SELECT 'EXEMPLO DE REGISTROS' as info;
SELECT 
    id,
    rental_id,
    event_type,
    scheduled_date,
    scheduled_time,
    status,
    notes,
    created_at
FROM rental_logistics_events 
ORDER BY created_at DESC
LIMIT 5;

-- 4. Verificar constraints da tabela
SELECT 'CONSTRAINTS DA TABELA' as info;
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'rental_logistics_events'::regclass;

-- 5. Verificar foreign keys
SELECT 'FOREIGN KEYS' as info;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'rental_logistics_events';

-- 6. Verificar se há locações que deveriam ter eventos
SELECT 'LOCAÇÕES SEM EVENTOS DE LOGÍSTICA' as info;
SELECT 
    r.id,
    r.client_name,
    r.start_date,
    r.end_date,
    r.installation_time,
    r.removal_time,
    r.created_at,
    CASE 
        WHEN rle.id IS NULL THEN 'SEM EVENTOS'
        ELSE 'COM EVENTOS'
    END as status
FROM rentals r
LEFT JOIN rental_logistics_events rle ON r.id = rle.rental_id
ORDER BY r.created_at DESC
LIMIT 10;

-- 7. Relatório final
SELECT 'RELATÓRIO FINAL' as info;
SELECT 
    'Total de eventos' as metric,
    COUNT(*)::text as value
FROM rental_logistics_events

UNION ALL

SELECT 
    'Locações com eventos' as metric,
    COUNT(DISTINCT rental_id)::text as value
FROM rental_logistics_events

UNION ALL

SELECT 
    'Locações sem eventos' as metric,
    (SELECT COUNT(*) FROM rentals r
     LEFT JOIN rental_logistics_events rle ON r.id = rle.rental_id
     WHERE rle.id IS NULL)::text as value; 