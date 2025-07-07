-- Debug da consulta de eventos do dashboard
-- Verificar se há eventos na tabela

SELECT 'TOTAL DE EVENTOS NA TABELA' as info;
SELECT COUNT(*) as total_events FROM rental_logistics_events;

-- Verificar eventos com detalhes
SELECT 'EVENTOS EXISTENTES' as info;
SELECT 
    id,
    rental_id,
    event_type,
    event_date,
    event_time,
    status,
    created_at
FROM rental_logistics_events 
ORDER BY created_at DESC 
LIMIT 10;

-- Testar a consulta do dashboard (próximos 7 dias)
SELECT 'EVENTOS DOS PRÓXIMOS 7 DIAS' as info;
SELECT 
    COUNT(*) as eventos_proximos_7_dias
FROM rental_logistics_events 
WHERE event_date >= CURRENT_DATE 
  AND event_date <= CURRENT_DATE + INTERVAL '7 days'
  AND status = 'Agendado';

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
WHERE event_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY event_date
ORDER BY event_date;

-- Testar a consulta exata do dashboard
SELECT 'CONSULTA EXATA DO DASHBOARD' as info;
SELECT 
    COUNT(*) as scheduled_events
FROM rental_logistics_events 
WHERE event_date >= CURRENT_DATE 
  AND event_date <= CURRENT_DATE + INTERVAL '7 days'
  AND status = 'Agendado'; 