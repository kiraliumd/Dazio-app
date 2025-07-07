-- Script de teste para verificar inserção de eventos com a estrutura correta
-- Execute este script para testar se a inserção funciona

-- 1. Verificar estrutura atual
SELECT 'ESTRUTURA ATUAL DA TABELA' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'rental_logistics_events' 
ORDER BY ordinal_position;

-- 2. Pegar uma locação para teste
SELECT 'LOCAÇÃO PARA TESTE' as info;
SELECT 
    id,
    client_name,
    start_date,
    end_date,
    installation_time,
    removal_time
FROM rentals 
ORDER BY created_at DESC 
LIMIT 1;

-- 3. Testar inserção com a estrutura correta
DO $$
DECLARE
    test_rental_id UUID;
    test_date DATE := CURRENT_DATE;
    test_time TEXT := '09:00';
BEGIN
    -- Pegar o ID da primeira locação
    SELECT id INTO test_rental_id 
    FROM rentals 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF test_rental_id IS NOT NULL THEN
        RAISE NOTICE 'Testando inserção para locação: %', test_rental_id;
        RAISE NOTICE 'Data: %, Hora: % (tipo: %)', test_date, test_time, pg_typeof(test_time);
        
        -- Tentar inserir um evento de teste com a estrutura correta
        INSERT INTO rental_logistics_events (
            rental_id,
            event_type,
            scheduled_date,
            scheduled_time,
            status,
            notes
        ) VALUES (
            test_rental_id,
            'Instalação',
            test_date,
            test_time,
            'pending',
            'Teste com estrutura correta'
        );
        
        RAISE NOTICE '✅ Inserção bem-sucedida!';
        
        -- Verificar se foi inserido
        IF EXISTS (
            SELECT 1 FROM rental_logistics_events 
            WHERE rental_id = test_rental_id 
            AND event_type = 'Instalação'
            AND notes = 'Teste com estrutura correta'
        ) THEN
            RAISE NOTICE '✅ Evento confirmado no banco!';
        ELSE
            RAISE NOTICE '❌ Evento não foi encontrado após inserção!';
        END IF;
        
        -- Limpar teste
        DELETE FROM rental_logistics_events 
        WHERE notes = 'Teste com estrutura correta';
        RAISE NOTICE 'Teste limpo com sucesso!';
        
    ELSE
        RAISE NOTICE 'Nenhuma locação encontrada para teste!';
    END IF;
END $$;

-- 4. Testar inserção com dados reais de uma locação
DO $$
DECLARE
    rental_record RECORD;
    installation_date DATE;
    removal_date DATE;
    installation_time TEXT;
    removal_time TEXT;
BEGIN
    -- Pegar dados de uma locação real
    SELECT 
        id,
        start_date::date,
        end_date::date,
        installation_time::text,
        removal_time::text
    INTO rental_record
    FROM rentals 
    WHERE installation_time IS NOT NULL 
    AND removal_time IS NOT NULL
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF rental_record.id IS NOT NULL THEN
        RAISE NOTICE 'Testando inserção com dados reais para locação: %', rental_record.id;
        RAISE NOTICE 'Data instalação: %, Hora: %', rental_record.start_date, rental_record.installation_time;
        RAISE NOTICE 'Data retirada: %, Hora: %', rental_record.end_date, rental_record.removal_time;
        
        -- Tentar inserir eventos como o código faz
        INSERT INTO rental_logistics_events (
            rental_id,
            event_type,
            scheduled_date,
            scheduled_time,
            status,
            notes
        ) VALUES 
        (
            rental_record.id,
            'Instalação',
            rental_record.start_date,
            rental_record.installation_time,
            'pending',
            'Evento de instalação criado automaticamente'
        ),
        (
            rental_record.id,
            'Retirada',
            rental_record.end_date,
            rental_record.removal_time,
            'pending',
            'Evento de retirada criado automaticamente'
        );
        
        RAISE NOTICE '✅ Eventos reais inseridos com sucesso!';
        
        -- Verificar eventos criados
        RAISE NOTICE 'Eventos criados:';
        FOR rental_record IN 
            SELECT 
                id,
                event_type,
                scheduled_date,
                scheduled_time,
                status,
                notes
            FROM rental_logistics_events 
            WHERE rental_id = rental_record.id
            AND notes LIKE '%criado automaticamente%'
            ORDER BY event_type
        LOOP
            RAISE NOTICE '  - %: % às % (status: %)', 
                rental_record.event_type, 
                rental_record.scheduled_date, 
                rental_record.scheduled_time, 
                rental_record.status;
        END LOOP;
        
    ELSE
        RAISE NOTICE 'Nenhuma locação com horários encontrada para teste!';
    END IF;
END $$;

-- 5. Verificar eventos criados pelo teste
SELECT 'EVENTOS CRIADOS PELO TESTE' as info;
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
WHERE notes LIKE '%criado automaticamente%'
ORDER BY created_at DESC;

-- 6. Relatório final
SELECT 'RELATÓRIO FINAL DO TESTE' as info;
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
    'Eventos com status pending' as metric,
    COUNT(*)::text as value
FROM rental_logistics_events
WHERE status = 'pending'; 