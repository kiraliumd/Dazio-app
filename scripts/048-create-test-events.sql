-- Script para criar eventos de teste para datas próximas
-- Execute este script para criar eventos para testar a agenda

-- 1. Verificar eventos existentes
SELECT 'EVENTOS EXISTENTES' as info;
SELECT 
    rle.id,
    r.client_name,
    rle.event_type,
    rle.event_date,
    rle.event_time,
    rle.status
FROM rental_logistics_events rle
JOIN rentals r ON rle.rental_id = r.id
ORDER BY rle.event_date;

-- 2. Criar eventos para datas próximas
DO $$
DECLARE
    test_rental_id UUID;
    today_date DATE := CURRENT_DATE;
    tomorrow_date DATE := CURRENT_DATE + INTERVAL '1 day';
    next_week_date DATE := CURRENT_DATE + INTERVAL '7 days';
BEGIN
    -- Pegar uma locação para criar eventos de teste
    SELECT id INTO test_rental_id 
    FROM rentals 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF test_rental_id IS NOT NULL THEN
        RAISE NOTICE 'Criando eventos de teste para locação: %', test_rental_id;
        
        -- Criar evento para hoje
        IF NOT EXISTS (SELECT 1 FROM rental_logistics_events WHERE event_date = today_date AND rental_id = test_rental_id) THEN
            INSERT INTO rental_logistics_events (
                rental_id,
                event_type,
                event_date,
                event_time,
                status,
                notes
            ) VALUES (
                test_rental_id,
                'Instalação',
                today_date,
                '09:00'::time,
                'Agendado',
                'Evento de teste - hoje'
            );
            RAISE NOTICE '✅ Evento criado para hoje (%): Instalação às 09:00', today_date;
        END IF;
        
        -- Criar evento para amanhã
        IF NOT EXISTS (SELECT 1 FROM rental_logistics_events WHERE event_date = tomorrow_date AND rental_id = test_rental_id) THEN
            INSERT INTO rental_logistics_events (
                rental_id,
                event_type,
                event_date,
                event_time,
                status,
                notes
            ) VALUES (
                test_rental_id,
                'Retirada',
                tomorrow_date,
                '18:00'::time,
                'Agendado',
                'Evento de teste - amanhã'
            );
            RAISE NOTICE '✅ Evento criado para amanhã (%): Retirada às 18:00', tomorrow_date;
        END IF;
        
        -- Criar evento para próxima semana
        IF NOT EXISTS (SELECT 1 FROM rental_logistics_events WHERE event_date = next_week_date AND rental_id = test_rental_id) THEN
            INSERT INTO rental_logistics_events (
                rental_id,
                event_type,
                event_date,
                event_time,
                status,
                notes
            ) VALUES (
                test_rental_id,
                'Instalação',
                next_week_date,
                '14:00'::time,
                'Agendado',
                'Evento de teste - próxima semana'
            );
            RAISE NOTICE '✅ Evento criado para próxima semana (%): Instalação às 14:00', next_week_date;
        END IF;
        
    ELSE
        RAISE NOTICE 'Nenhuma locação encontrada para criar eventos de teste!';
    END IF;
END $$;

-- 3. Verificar eventos criados
SELECT 'EVENTOS APÓS CRIAÇÃO' as info;
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
WHERE rle.notes LIKE '%teste%'
ORDER BY rle.event_date;

-- 4. Verificar eventos para hoje
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

-- 5. Verificar eventos para amanhã
SELECT 'EVENTOS PARA AMANHÃ' as info;
SELECT 
    rle.id,
    r.client_name,
    rle.event_type,
    rle.event_date,
    rle.event_time,
    rle.status
FROM rental_logistics_events rle
JOIN rentals r ON rle.rental_id = r.id
WHERE rle.event_date = CURRENT_DATE + INTERVAL '1 day'
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
    'Eventos para amanhã' as metric,
    COUNT(*)::text as value
FROM rental_logistics_events
WHERE event_date = CURRENT_DATE + INTERVAL '1 day'

UNION ALL

SELECT 
    'Eventos para esta semana' as metric,
    COUNT(*)::text as value
FROM rental_logistics_events
WHERE event_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'; 