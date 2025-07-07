-- PASSO 6: Testar inserção
-- Execute este comando após o passo 5 para testar se a inserção funciona

DO $$
DECLARE
    test_rental_id UUID;
BEGIN
    -- Pegar uma locação para teste
    SELECT id INTO test_rental_id 
    FROM rentals 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF test_rental_id IS NOT NULL THEN
        -- Testar inserção de eventos
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
            CURRENT_DATE,
            '09:00'::time,
            'Agendado',
            'Evento de teste - instalação'
        ),
        (
            test_rental_id,
            'Retirada',
            CURRENT_DATE + INTERVAL '1 day',
            '18:00'::time,
            'Agendado',
            'Evento de teste - retirada'
        );
        
        RAISE NOTICE '✅ Teste de inserção bem-sucedido para locação: %', test_rental_id;
        
        -- Verificar eventos criados
        RAISE NOTICE 'Eventos criados:';
        FOR rental_record IN 
            SELECT 
                event_type,
                event_date,
                event_time,
                status
            FROM rental_logistics_events 
            WHERE rental_id = test_rental_id
            ORDER BY event_type
        LOOP
            RAISE NOTICE '  - %: % às % (status: %)', 
                rental_record.event_type, 
                rental_record.event_date, 
                rental_record.event_time, 
                rental_record.status;
        END LOOP;
        
        -- Limpar teste
        DELETE FROM rental_logistics_events WHERE notes LIKE '%teste%';
        RAISE NOTICE 'Teste limpo com sucesso!';
        
    ELSE
        RAISE NOTICE 'Nenhuma locação encontrada para teste!';
    END IF;
END $$; 