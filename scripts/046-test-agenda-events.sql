-- Script para testar se os eventos estão sendo criados corretamente para a agenda
-- Execute este script para verificar se os eventos aparecem na agenda

-- 1. Verificar eventos existentes
SELECT 'EVENTOS EXISTENTES' as info;
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
ORDER BY rle.event_date, rle.event_time;

-- 2. Verificar eventos para hoje
SELECT 'EVENTOS PARA HOJE' as info;
SELECT 
    rle.id,
    r.client_name,
    rle.event_type,
    rle.event_date,
    rle.event_time,
    rle.status
FROM rental_logistics_events rle
JOIN rentals r ON rle.rental_id = r.id
WHERE rle.event_date = CURRENT_DATE
ORDER BY rle.event_time;

-- 3. Verificar eventos para os próximos 7 dias
SELECT 'EVENTOS PRÓXIMOS 7 DIAS' as info;
SELECT 
    rle.id,
    r.client_name,
    rle.event_type,
    rle.event_date,
    rle.event_time,
    rle.status
FROM rental_logistics_events rle
JOIN rentals r ON rle.rental_id = r.id
WHERE rle.event_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
ORDER BY rle.event_date, rle.event_time;

-- 4. Criar eventos de teste para hoje se não houver nenhum
DO $$
DECLARE
    test_rental_id UUID;
    today_date DATE := CURRENT_DATE;
BEGIN
    -- Verificar se há eventos para hoje
    IF NOT EXISTS (SELECT 1 FROM rental_logistics_events WHERE event_date = today_date) THEN
        RAISE NOTICE 'Nenhum evento para hoje encontrado. Criando eventos de teste...';
        
        -- Pegar uma locação para criar eventos de teste
        SELECT id INTO test_rental_id 
        FROM rentals 
        ORDER BY created_at DESC 
        LIMIT 1;
        
        IF test_rental_id IS NOT NULL THEN
            -- Criar eventos de teste para hoje
            INSERT INTO rental_logistics_events (
                rental_id,
                event_type,
                event_date,
                event_time,
                status,
                notes
            ) VALUES 
            (
                test_rental_id,
                'Instalação',
                today_date,
                '09:00'::time,
                'Agendado',
                'Evento de teste para agenda'
            ),
            (
                test_rental_id,
                'Retirada',
                today_date,
                '18:00'::time,
                'Agendado',
                'Evento de teste para agenda'
            );
            
            RAISE NOTICE '✅ Eventos de teste criados para hoje!';
        ELSE
            RAISE NOTICE 'Nenhuma locação encontrada para criar eventos de teste!';
        END IF;
    ELSE
        RAISE NOTICE 'Já existem eventos para hoje!';
    END IF;
END $$;

-- 5. Verificar eventos após teste
SELECT 'EVENTOS APÓS TESTE' as info;
SELECT 
    rle.id,
    r.client_name,
    rle.event_type,
    rle.event_date,
    rle.event_time,
    rle.status,
    rle.notes
FROM rental_logistics_events rle
JOIN rentals r ON rle.rental_id = r.id
WHERE rle.event_date = CURRENT_DATE
ORDER BY rle.event_time;

-- 6. Relatório final
SELECT 'RELATÓRIO FINAL' as info;
SELECT 
    'Total de eventos' as metric,
    COUNT(*)::text as value
FROM rental_logistics_events

UNION ALL

SELECT 
    'Eventos para hoje' as metric,
    COUNT(*)::text as value
FROM rental_logistics_events
WHERE event_date = CURRENT_DATE

UNION ALL

SELECT 
    'Eventos para esta semana' as metric,
    COUNT(*)::text as value
FROM rental_logistics_events
WHERE event_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'

UNION ALL

SELECT 
    'Locações com eventos' as metric,
    COUNT(DISTINCT rental_id)::text as value
FROM rental_logistics_events; 