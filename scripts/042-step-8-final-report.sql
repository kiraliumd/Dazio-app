-- PASSO 8: Relatório final
-- Execute este comando após o passo 7 para verificar o resultado final

SELECT 'RELATÓRIO FINAL - EVENTOS DE LOGÍSTICA' as info;
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
    'Eventos de instalação' as metric,
    COUNT(*)::text as value
FROM rental_logistics_events
WHERE event_type = 'Instalação'

UNION ALL

SELECT 
    'Eventos de retirada' as metric,
    COUNT(*)::text as value
FROM rental_logistics_events
WHERE event_type = 'Retirada'

UNION ALL

SELECT 
    'Eventos com status Agendado' as metric,
    COUNT(*)::text as value
FROM rental_logistics_events
WHERE status = 'Agendado';

-- Verificar eventos criados
SELECT 'EVENTOS CRIADOS' as info;
SELECT 
    rle.id,
    r.client_name,
    rle.event_type,
    rle.event_date,
    rle.event_time,
    rle.status,
    rle.notes,
    rle.created_at
FROM rental_logistics_events rle
JOIN rentals r ON rle.rental_id = r.id
ORDER BY rle.created_at DESC
LIMIT 10; 