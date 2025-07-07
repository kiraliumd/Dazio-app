-- Script para criar eventos de logística para locações existentes
-- Execute este script para criar eventos para locações que não têm eventos de logística

-- 1. Verificar locações sem eventos de logística
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

-- 2. Contar quantas locações precisam de eventos
SELECT 'CONTAGEM DE LOCAÇÕES A PROCESSAR' as info;
SELECT 
    COUNT(*) as total_rentals,
    COUNT(CASE WHEN rle.id IS NULL THEN 1 END) as without_logistics_events,
    COUNT(CASE WHEN rle.id IS NOT NULL THEN 1 END) as with_logistics_events
FROM rentals r
LEFT JOIN rental_logistics_events rle ON r.id = rle.rental_id;

-- 3. Criar eventos de logística para locações que não têm
DO $$
DECLARE
    rental_record RECORD;
    installation_date DATE;
    removal_date DATE;
    installation_time TIME;
    removal_time TIME;
    events_created INTEGER := 0;
BEGIN
    -- Loop através de todas as locações sem eventos de logística
    FOR rental_record IN 
        SELECT 
            r.id,
            r.client_name,
            r.start_date,
            r.end_date,
            r.installation_time,
            r.removal_time
        FROM rentals r
        LEFT JOIN rental_logistics_events rle ON r.id = rle.rental_id
        WHERE rle.id IS NULL
    LOOP
        -- Extrair datas e horários
        installation_date := rental_record.start_date::date;
        removal_date := rental_record.end_date::date;
        
        -- Usar horários da locação se disponíveis, senão usar padrão
        -- scheduled_time é do tipo text, então formatar como string
        installation_time := COALESCE(rental_record.installation_time::text, '09:00');
        removal_time := COALESCE(rental_record.removal_time::text, '18:00');
        
        RAISE NOTICE 'Criando eventos para locação: % (Cliente: %)', rental_record.id, rental_record.client_name;
        RAISE NOTICE '  Instalação: % às %', installation_date, installation_time;
        RAISE NOTICE '  Retirada: % às %', removal_date, removal_time;
        
        -- Inserir evento de instalação
        INSERT INTO rental_logistics_events (
            rental_id,
            event_type,
            scheduled_date,
            scheduled_time,
            status,
            notes
        ) VALUES (
            rental_record.id,
            'Instalação',
            installation_date,
            installation_time,
            'pending',
            'Evento de instalação criado automaticamente para locação existente'
        );
        
        -- Inserir evento de retirada
        INSERT INTO rental_logistics_events (
            rental_id,
            event_type,
            scheduled_date,
            scheduled_time,
            status,
            notes
        ) VALUES (
            rental_record.id,
            'Retirada',
            removal_date,
            removal_time,
            'pending',
            'Evento de retirada criado automaticamente para locação existente'
        );
        
        events_created := events_created + 2;
    END LOOP;
    
    RAISE NOTICE '✅ Processo concluído! % eventos criados para % locações', events_created, events_created / 2;
END $$;

-- 4. Verificar eventos criados
SELECT 'EVENTOS CRIADOS' as info;
SELECT 
    rle.id,
    rle.rental_id,
    r.client_name,
    rle.event_type,
    rle.scheduled_date,
    rle.scheduled_time,
    rle.status,
    rle.notes,
    rle.created_at
FROM rental_logistics_events rle
JOIN rentals r ON rle.rental_id = r.id
WHERE rle.notes LIKE '%locação existente%'
ORDER BY rle.created_at DESC;

-- 5. Verificar se ainda há locações sem eventos
SELECT 'VERIFICAÇÃO FINAL' as info;
SELECT 
    COUNT(*) as total_rentals,
    COUNT(CASE WHEN rle.id IS NULL THEN 1 END) as without_logistics_events,
    COUNT(CASE WHEN rle.id IS NOT NULL THEN 1 END) as with_logistics_events
FROM rentals r
LEFT JOIN rental_logistics_events rle ON r.id = rle.rental_id;

-- 6. Relatório final
SELECT 'RELATÓRIO FINAL' as info;
SELECT 
    'Total de locações' as metric,
    COUNT(*)::text as value
FROM rentals

UNION ALL

SELECT 
    'Locações com eventos' as metric,
    COUNT(DISTINCT r.id)::text as value
FROM rentals r
INNER JOIN rental_logistics_events rle ON r.id = rle.rental_id

UNION ALL

SELECT 
    'Locações sem eventos' as metric,
    (SELECT COUNT(*) FROM rentals r
     LEFT JOIN rental_logistics_events rle ON r.id = rle.rental_id
     WHERE rle.id IS NULL)::text as value

UNION ALL

SELECT 
    'Total de eventos' as metric,
    COUNT(*)::text as value
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