-- Script para testar a inserção de eventos de logística
-- Execute este script para verificar se há problemas na criação de eventos

-- 1. Verificar a estrutura da tabela
SELECT 'ESTRUTURA DA TABELA RENTAL_LOGISTICS_EVENTS' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'rental_logistics_events' 
ORDER BY ordinal_position;

-- 2. Verificar se há locações disponíveis para teste
SELECT 'LOCAÇÕES DISPONÍVEIS PARA TESTE' as info;
SELECT 
    id,
    client_name,
    start_date,
    end_date,
    installation_time,
    removal_time,
    created_at
FROM rentals 
ORDER BY created_at DESC
LIMIT 5;

-- 3. Verificar se há eventos existentes
SELECT 'EVENTOS EXISTENTES' as info;
SELECT 
    id,
    rental_id,
    event_type,
    scheduled_date,
    scheduled_time,
    status,
    created_at
FROM rental_logistics_events 
ORDER BY created_at DESC;

-- 4. Testar inserção de eventos (usando a primeira locação disponível)
DO $$
DECLARE
    test_rental_id UUID;
    test_date DATE := CURRENT_DATE;
    test_time TIME := '09:00';
BEGIN
    -- Pegar o ID da primeira locação
    SELECT id INTO test_rental_id 
    FROM rentals 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF test_rental_id IS NOT NULL THEN
        RAISE NOTICE 'Testando inserção para locação: %', test_rental_id;
        
        -- Tentar inserir um evento de teste
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
            'Agendado',
            'Evento de teste criado pelo script'
        );
        
        RAISE NOTICE 'Evento de teste inserido com sucesso!';
        
        -- Verificar se foi inserido
        IF EXISTS (
            SELECT 1 FROM rental_logistics_events 
            WHERE rental_id = test_rental_id 
            AND event_type = 'Instalação'
            AND notes = 'Evento de teste criado pelo script'
        ) THEN
            RAISE NOTICE 'Evento confirmado no banco!';
        ELSE
            RAISE NOTICE 'ERRO: Evento não foi encontrado após inserção!';
        END IF;
        
    ELSE
        RAISE NOTICE 'Nenhuma locação encontrada para teste!';
    END IF;
END $$;

-- 5. Verificar se o evento de teste foi criado
SELECT 'EVENTO DE TESTE CRIADO' as info;
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
WHERE notes = 'Evento de teste criado pelo script'
ORDER BY created_at DESC;

-- 6. Testar inserção com dados reais (simulando o que o código faz)
DO $$
DECLARE
    test_rental_id UUID;
    installation_date DATE;
    removal_date DATE;
    installation_time TIME;
    removal_time TIME;
BEGIN
    -- Pegar dados de uma locação real
    SELECT 
        id,
        start_date::date,
        end_date::date,
        installation_time,
        removal_time
    INTO 
        test_rental_id,
        installation_date,
        removal_date,
        installation_time,
        removal_time
    FROM rentals 
    WHERE installation_time IS NOT NULL 
    AND removal_time IS NOT NULL
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF test_rental_id IS NOT NULL THEN
        RAISE NOTICE 'Testando inserção com dados reais para locação: %', test_rental_id;
        RAISE NOTICE 'Data instalação: %, Hora: %', installation_date, installation_time;
        RAISE NOTICE 'Data retirada: %, Hora: %', removal_date, removal_time;
        
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
            test_rental_id,
            'Instalação',
            installation_date,
            installation_time,
            'Agendado',
            'Evento de instalação criado automaticamente'
        ),
        (
            test_rental_id,
            'Retirada',
            removal_date,
            removal_time,
            'Agendado',
            'Evento de retirada criado automaticamente'
        );
        
        RAISE NOTICE 'Eventos reais inseridos com sucesso!';
        
    ELSE
        RAISE NOTICE 'Nenhuma locação com horários encontrada para teste!';
    END IF;
END $$;

-- 7. Verificar eventos criados
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

-- 8. Limpar eventos de teste
DELETE FROM rental_logistics_events 
WHERE notes = 'Evento de teste criado pelo script';

-- 9. Relatório final
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
WHERE event_type = 'Retirada'; 