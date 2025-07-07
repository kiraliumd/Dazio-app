-- Script para debugar o problema de datas na agenda
-- Execute este script para verificar se as datas estão corretas

-- 1. Verificar eventos com suas datas
SELECT 'EVENTOS E SUAS DATAS' as info;
SELECT 
    rle.id,
    r.client_name,
    rle.event_type,
    rle.event_date,
    rle.event_time,
    rle.status,
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

-- 4. Verificar se há eventos com datas incorretas
SELECT 'EVENTOS COM DATAS INCORRETAS' as info;
SELECT 
    rle.id,
    r.client_name,
    rle.event_type,
    rle.event_date,
    rle.event_time,
    rle.status,
    CASE 
        WHEN rle.event_date < CURRENT_DATE THEN 'Data passada'
        WHEN rle.event_date > CURRENT_DATE + INTERVAL '30 days' THEN 'Data muito futura'
        ELSE 'Data OK'
    END as status_data
FROM rental_logistics_events rle
JOIN rentals r ON rle.rental_id = r.id
WHERE rle.event_date < CURRENT_DATE OR rle.event_date > CURRENT_DATE + INTERVAL '30 days'
ORDER BY rle.event_date;

-- 5. Criar evento de teste para hoje se não houver
DO $$
DECLARE
    test_rental_id UUID;
    today_date DATE := CURRENT_DATE;
BEGIN
    -- Verificar se há eventos para hoje
    IF NOT EXISTS (SELECT 1 FROM rental_logistics_events WHERE event_date = today_date) THEN
        RAISE NOTICE 'Nenhum evento para hoje encontrado. Criando evento de teste...';
        
        -- Pegar uma locação para criar evento de teste
        SELECT id INTO test_rental_id 
        FROM rentals 
        ORDER BY created_at DESC 
        LIMIT 1;
        
        IF test_rental_id IS NOT NULL THEN
            -- Criar evento de teste para hoje
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
                '14:00'::time,
                'Agendado',
                'Evento de teste para debug de datas'
            );
            
            RAISE NOTICE '✅ Evento de teste criado para hoje (%): %', today_date, test_rental_id;
        ELSE
            RAISE NOTICE 'Nenhuma locação encontrada para criar evento de teste!';
        END IF;
    ELSE
        RAISE NOTICE 'Já existem eventos para hoje (%):', today_date;
        FOR rental_record IN 
            SELECT 
                id,
                event_type,
                event_date,
                event_time
            FROM rental_logistics_events 
            WHERE event_date = today_date
        LOOP
            RAISE NOTICE '  - %: % às %', rental_record.event_type, rental_record.event_date, rental_record.event_time;
        END LOOP;
    END IF;
END $$;

-- 6. Verificar evento de teste criado
SELECT 'EVENTO DE TESTE CRIADO' as info;
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
WHERE rle.notes LIKE '%teste para debug%'
ORDER BY rle.created_at DESC; 