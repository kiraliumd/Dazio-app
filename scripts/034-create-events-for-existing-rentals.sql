-- Script para criar eventos de logística para locações existentes
-- Execute este script após recriar a tabela para popular eventos existentes

-- 1. Verificar locações sem eventos
SELECT 'LOCAÇÕES SEM EVENTOS DE LOGÍSTICA' as info;
SELECT 
    r.id,
    r.client_name,
    r.start_date,
    r.end_date,
    r.installation_time,
    r.removal_time,
    r.created_at
FROM rentals r
LEFT JOIN rental_logistics_events rle ON r.id = rle.rental_id
WHERE rle.id IS NULL
ORDER BY r.created_at DESC;

-- 2. Criar eventos para locações existentes
DO $$
DECLARE
    rental_record RECORD;
    installation_date DATE;
    removal_date DATE;
    installation_time TIME;
    removal_time TIME;
    events_created INTEGER := 0;
    total_rentals INTEGER := 0;
BEGIN
    -- Contar locações sem eventos
    SELECT COUNT(*) INTO total_rentals
    FROM rentals r
    LEFT JOIN rental_logistics_events rle ON r.id = rle.rental_id
    WHERE rle.id IS NULL;
    
    RAISE NOTICE 'Encontradas % locações sem eventos de logística', total_rentals;
    
    -- Processar cada locação sem eventos
    FOR rental_record IN 
        SELECT 
            r.id,
            r.client_name,
            r.start_date::date,
            r.end_date::date,
            r.installation_time,
            r.removal_time
        FROM rentals r
        LEFT JOIN rental_logistics_events rle ON r.id = rle.rental_id
        WHERE rle.id IS NULL
        ORDER BY r.created_at DESC
    LOOP
        -- Usar datas da locação
        installation_date := rental_record.start_date;
        removal_date := rental_record.end_date;
        
        -- Usar horários da locação se disponíveis, senão usar padrão
        installation_time := COALESCE(rental_record.installation_time, '09:00'::time);
        removal_time := COALESCE(rental_record.removal_time, '18:00'::time);
        
        RAISE NOTICE 'Criando eventos para locação: % (Cliente: %)', rental_record.id, rental_record.client_name;
        RAISE NOTICE '  Instalação: % às %', installation_date, installation_time;
        RAISE NOTICE '  Retirada: % às %', removal_date, removal_time;
        
        -- Inserir evento de instalação
        INSERT INTO rental_logistics_events (
            rental_id,
            event_type,
            event_date,
            event_time,
            status,
            notes
        ) VALUES (
            rental_record.id,
            'Instalação',
            installation_date,
            installation_time,
            'Agendado',
            'Evento de instalação criado automaticamente para locação existente'
        );
        
        -- Inserir evento de retirada
        INSERT INTO rental_logistics_events (
            rental_id,
            event_type,
            event_date,
            event_time,
            status,
            notes
        ) VALUES (
            rental_record.id,
            'Retirada',
            removal_date,
            removal_time,
            'Agendado',
            'Evento de retirada criado automaticamente para locação existente'
        );
        
        events_created := events_created + 2;
        RAISE NOTICE '✅ Eventos criados para locação %', rental_record.id;
    END LOOP;
    
    RAISE NOTICE '🎉 Processo concluído! % eventos criados para % locações', events_created, total_rentals;
END $$;

-- 3. Verificar eventos criados
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
WHERE rle.notes LIKE '%criado automaticamente para locação existente%'
ORDER BY rle.created_at DESC;

-- 4. Relatório final
SELECT 'RELATÓRIO FINAL' as info;
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
WHERE status = 'Agendado'

UNION ALL

SELECT 
    'Locações sem eventos restantes' as metric,
    (COUNT(*) - COUNT(DISTINCT rle.rental_id))::text as value
FROM rentals r
LEFT JOIN rental_logistics_events rle ON r.id = rle.rental_id; 