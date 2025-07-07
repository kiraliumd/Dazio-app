-- Script inteligente para corrigir horários de locações
-- Este script tenta extrair horários dos eventos de logística quando disponíveis

-- 1. Verificar locações sem horários
SELECT 'LOCAÇÕES SEM HORÁRIOS' as info;
SELECT 
    r.id,
    r.client_name,
    r.start_date,
    r.end_date,
    r.installation_time,
    r.removal_time,
    r.created_at
FROM rentals r
WHERE r.installation_time IS NULL OR r.removal_time IS NULL
ORDER BY r.created_at DESC;

-- 2. Verificar eventos de logística disponíveis
SELECT 'EVENTOS DE LOGÍSTICA POR LOCAÇÃO' as info;
SELECT 
    r.id as rental_id,
    r.client_name,
    rle.event_type,
    rle.scheduled_date,
    rle.scheduled_time,
    r.installation_time,
    r.removal_time
FROM rentals r
LEFT JOIN rental_logistics_events rle ON r.id = rle.rental_id
WHERE r.installation_time IS NULL OR r.removal_time IS NULL
ORDER BY r.id, rle.event_type;

-- 3. Atualizar locações usando horários dos eventos de logística
-- Para locações que têm eventos de logística
UPDATE rentals 
SET 
    installation_time = (
        SELECT rle.scheduled_time 
        FROM rental_logistics_events rle 
        WHERE rle.rental_id = rentals.id 
        AND rle.event_type = 'Instalação'
        LIMIT 1
    ),
    removal_time = (
        SELECT rle.scheduled_time 
        FROM rental_logistics_events rle 
        WHERE rle.rental_id = rentals.id 
        AND rle.event_type = 'Retirada'
        LIMIT 1
    )
WHERE (installation_time IS NULL OR removal_time IS NULL)
AND EXISTS (
    SELECT 1 
    FROM rental_logistics_events rle 
    WHERE rle.rental_id = rentals.id
);

-- 4. Para locações que ainda não têm horários, definir horários padrão
UPDATE rentals 
SET 
    installation_time = COALESCE(installation_time, '08:00'),
    removal_time = COALESCE(removal_time, '18:00')
WHERE installation_time IS NULL OR removal_time IS NULL;

-- 5. Verificar o resultado
SELECT 'LOCAÇÕES APÓS CORREÇÃO INTELIGENTE' as info;
SELECT 
    r.id,
    r.client_name,
    r.start_date,
    r.end_date,
    r.installation_time,
    r.removal_time,
    CASE 
        WHEN rle_inst.scheduled_time IS NOT NULL THEN 'Extraído de evento de logística'
        ELSE 'Horário padrão aplicado'
    END as source
FROM rentals r
LEFT JOIN rental_logistics_events rle_inst ON r.id = rle_inst.rental_id AND rle_inst.event_type = 'Instalação'
ORDER BY r.created_at DESC
LIMIT 10;

-- 6. Relatório final detalhado
SELECT 'RELATÓRIO FINAL DETALHADO' as info;
SELECT 
    'Total de locações' as metric,
    COUNT(*) as value
FROM rentals

UNION ALL

SELECT 
    'Com horário de instalação' as metric,
    COUNT(*) as value
FROM rentals
WHERE installation_time IS NOT NULL

UNION ALL

SELECT 
    'Com horário de retirada' as metric,
    COUNT(*) as value
FROM rentals
WHERE removal_time IS NOT NULL

UNION ALL

SELECT 
    'Com eventos de logística' as metric,
    COUNT(DISTINCT r.id) as value
FROM rentals r
INNER JOIN rental_logistics_events rle ON r.id = rle.rental_id;

-- 7. Verificar se ainda há problemas
SELECT 'VERIFICAÇÃO FINAL' as info;
SELECT 
    COUNT(*) as rentals_without_times
FROM rentals 
WHERE installation_time IS NULL OR removal_time IS NULL; 