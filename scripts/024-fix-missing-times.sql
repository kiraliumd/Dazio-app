-- Script para corrigir locações que não têm horários salvos
-- Este script verifica e corrige locações que foram criadas sem os horários

-- 1. Verificar locações sem horários
SELECT 'LOCAÇÕES SEM HORÁRIOS' as info;
SELECT 
    id,
    client_name,
    start_date,
    end_date,
    installation_time,
    removal_time,
    created_at
FROM rentals 
WHERE installation_time IS NULL OR removal_time IS NULL
ORDER BY created_at DESC;

-- 2. Verificar se há eventos de logística que podem fornecer os horários
SELECT 'EVENTOS DE LOGÍSTICA DISPONÍVEIS' as info;
SELECT 
    rental_id,
    event_type,
    scheduled_date,
    scheduled_time,
    status
FROM rental_logistics_events 
ORDER BY rental_id, event_type;

-- 3. Atualizar locações com horários padrão (se não houver eventos de logística)
-- Primeiro, vamos verificar quantas locações precisam ser corrigidas
SELECT 'CONTAGEM DE LOCAÇÕES A CORRIGIR' as info;
SELECT 
    COUNT(*) as total_rentals,
    COUNT(CASE WHEN installation_time IS NULL THEN 1 END) as without_installation_time,
    COUNT(CASE WHEN removal_time IS NULL THEN 1 END) as without_removal_time
FROM rentals;

-- 4. Definir horários padrão para locações sem horários
-- (Você pode ajustar esses horários conforme necessário)
UPDATE rentals 
SET 
    installation_time = '08:00',
    removal_time = '18:00'
WHERE installation_time IS NULL OR removal_time IS NULL;

-- 5. Verificar o resultado
SELECT 'LOCAÇÕES APÓS CORREÇÃO' as info;
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
LIMIT 10;

-- 6. Relatório final
SELECT 'RELATÓRIO FINAL' as info;
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
WHERE removal_time IS NOT NULL; 