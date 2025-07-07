-- Verificar detalhes dos 4 eventos existentes
SELECT 'DETALHES DOS EVENTOS EXISTENTES' as info;

SELECT 
    id,
    rental_id,
    event_type,
    event_date,
    event_time,
    status,
    notes,
    created_at
FROM rental_logistics_events 
ORDER BY created_at DESC;

-- Verificar eventos por status
SELECT 'EVENTOS POR STATUS' as info;
SELECT 
    status,
    COUNT(*) as quantidade
FROM rental_logistics_events 
GROUP BY status;

-- Verificar eventos por data
SELECT 'EVENTOS POR DATA' as info;
SELECT 
    event_date,
    COUNT(*) as quantidade
FROM rental_logistics_events 
GROUP BY event_date
ORDER BY event_date;

-- Testar a consulta exata do dashboard
SELECT 'CONSULTA EXATA DO DASHBOARD' as info;
SELECT 
    COUNT(*) as eventos_proximos_7_dias
FROM rental_logistics_events 
WHERE event_date >= CURRENT_DATE 
  AND event_date <= CURRENT_DATE + INTERVAL '7 days'
  AND status = 'Agendado';

-- Verificar se há eventos futuros (sem filtro de status)
SELECT 'EVENTOS FUTUROS (SEM FILTRO DE STATUS)' as info;
SELECT 
    COUNT(*) as eventos_futuros
FROM rental_logistics_events 
WHERE event_date >= CURRENT_DATE 
  AND event_date <= CURRENT_DATE + INTERVAL '7 days'; 