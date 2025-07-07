-- Criar eventos de teste para o dashboard
-- Primeiro, vamos pegar uma locação existente

DO $$
DECLARE
    test_rental_id UUID;
    today_date DATE := CURRENT_DATE;
BEGIN
    -- Pegar uma locação para teste
    SELECT id INTO test_rental_id 
    FROM rentals 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF test_rental_id IS NOT NULL THEN
        RAISE NOTICE 'Criando eventos de teste para locação: %', test_rental_id;
        
        -- Evento de hoje
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
        
        -- Evento de amanhã
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
            today_date + INTERVAL '1 day',
            '18:00'::time,
            'Agendado',
            'Evento de teste - amanhã'
        );
        
        -- Evento em 3 dias
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
            today_date + INTERVAL '3 days',
            '14:00'::time,
            'Agendado',
            'Evento de teste - 3 dias'
        );
        
        RAISE NOTICE '✅ 3 eventos de teste criados com sucesso!';
        
    ELSE
        RAISE NOTICE '❌ Nenhuma locação encontrada para criar eventos de teste!';
    END IF;
END $$;

-- Verificar os eventos criados
SELECT 'EVENTOS DE TESTE CRIADOS' as info;
SELECT 
    event_type,
    event_date,
    event_time,
    status,
    notes
FROM rental_logistics_events 
WHERE notes LIKE '%teste%'
ORDER BY event_date;

-- Testar a consulta do dashboard
SELECT 'CONSULTA DO DASHBOARD' as info;
SELECT COUNT(*) as eventos_proximos_7_dias
FROM rental_logistics_events 
WHERE event_date >= CURRENT_DATE 
  AND event_date <= CURRENT_DATE + INTERVAL '7 days'
  AND status = 'Agendado'; 