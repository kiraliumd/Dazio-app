-- Script para limpar eventos de teste e preparar o ambiente
-- Execute este script antes de testar a aplicação

-- 1. Limpar eventos de teste
DELETE FROM rental_logistics_events 
WHERE notes LIKE '%Teste%' 
   OR notes LIKE '%criado automaticamente%';

-- 2. Verificar limpeza
SELECT 'EVENTOS APÓS LIMPEZA' as info;
SELECT 
    COUNT(*) as total_events,
    COUNT(DISTINCT rental_id) as rentals_with_events
FROM rental_logistics_events;

-- 3. Verificar locações sem eventos
SELECT 'LOCAÇÕES SEM EVENTOS DE LOGÍSTICA' as info;
SELECT 
    r.id,
    r.client_name,
    r.start_date,
    r.end_date,
    r.installation_time,
    r.removal_time,
    r.created_at
FROM rentals r
LEFT JOIN rental_logistics_events rle ON r.id = rle.rental_id
WHERE rle.id IS NULL
ORDER BY r.created_at DESC;

-- 4. Contagem de locações por status
SELECT 'RESUMO DE LOCAÇÕES' as info;
SELECT 
    'Total de locações' as metric,
    COUNT(*)::text as value
FROM rentals

UNION ALL

SELECT 
    'Locações com eventos' as metric,
    COUNT(DISTINCT rle.rental_id)::text as value
FROM rental_logistics_events rle

UNION ALL

SELECT 
    'Locações sem eventos' as metric,
    (COUNT(*) - COUNT(DISTINCT rle.rental_id))::text as value
FROM rentals r
LEFT JOIN rental_logistics_events rle ON r.id = rle.rental_id;

-- 5. Verificar estrutura final
SELECT 'ESTRUTURA FINAL DA TABELA' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'rental_logistics_events' 
ORDER BY ordinal_position; 