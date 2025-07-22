-- Script para atualizar uma locação existente para ser recorrente (para teste)
-- Execute este script para testar a funcionalidade de recorrência

-- 1. Verificar locações existentes
SELECT 'LOCAÇÕES EXISTENTES:' as info;
SELECT 
    id,
    client_name,
    start_date,
    end_date,
    is_recurring,
    recurrence_type,
    recurrence_interval,
    recurrence_status,
    created_at
FROM rentals 
ORDER BY created_at DESC
LIMIT 5;

-- 2. Atualizar a locação mais recente para ser recorrente (descomente e ajuste o ID se necessário)
-- UPDATE rentals 
-- SET 
--     is_recurring = true,
--     recurrence_type = 'monthly',
--     recurrence_interval = 1,
--     recurrence_end_date = '2024-12-31',
--     recurrence_status = 'active',
--     next_occurrence_date = end_date + INTERVAL '1 month'
-- WHERE id = 'ID_DA_LOCACAO_AQUI';

-- 3. Verificar se a atualização funcionou
SELECT 'LOCAÇÕES APÓS ATUALIZAÇÃO:' as info;
SELECT 
    id,
    client_name,
    start_date,
    end_date,
    is_recurring,
    recurrence_type,
    recurrence_interval,
    recurrence_status,
    next_occurrence_date,
    created_at
FROM rentals 
WHERE is_recurring = true
ORDER BY created_at DESC; 