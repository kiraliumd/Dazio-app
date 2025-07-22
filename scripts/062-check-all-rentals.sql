-- Verificar todas as locações para identificar problemas

-- 1. Verificar todas as locações recentes
SELECT 'TODAS AS LOCAÇÕES RECENTES:' as info;
SELECT 
    id,
    client_name,
    start_date,
    end_date,
    is_recurring,
    recurrence_type,
    recurrence_interval,
    recurrence_status,
    recurrence_end_date,
    next_occurrence_date,
    created_at
FROM rentals 
ORDER BY created_at DESC
LIMIT 10;

-- 2. Verificar locações com dados de recorrência mas is_recurring = false
SELECT 'LOCAÇÕES COM DADOS DE RECORRÊNCIA MAS IS_RECURRING = FALSE:' as info;
SELECT 
    id,
    client_name,
    start_date,
    end_date,
    is_recurring,
    recurrence_type,
    recurrence_interval,
    recurrence_status,
    recurrence_end_date,
    created_at
FROM rentals 
WHERE (recurrence_type IS NOT NULL AND recurrence_type != 'none')
   OR recurrence_interval > 1
   OR recurrence_status IS NOT NULL
   OR recurrence_end_date IS NOT NULL
ORDER BY created_at DESC;

-- 3. Verificar locações com budget_id (orçamentos aprovados)
SELECT 'LOCAÇÕES COM BUDGET_ID (ORÇAMENTOS APROVADOS):' as info;
SELECT 
    id,
    client_name,
    start_date,
    end_date,
    budget_id,
    is_recurring,
    recurrence_type,
    recurrence_interval,
    recurrence_status,
    created_at
FROM rentals 
WHERE budget_id IS NOT NULL
ORDER BY created_at DESC;

-- 4. Contar estatísticas
SELECT 'ESTATÍSTICAS:' as info;
SELECT 
    COUNT(*) as total_rentals,
    COUNT(CASE WHEN is_recurring = true THEN 1 END) as recurring_rentals,
    COUNT(CASE WHEN is_recurring = false OR is_recurring IS NULL THEN 1 END) as non_recurring_rentals,
    COUNT(CASE WHEN budget_id IS NOT NULL THEN 1 END) as rentals_from_budgets,
    COUNT(CASE WHEN recurrence_type IS NOT NULL AND recurrence_type != 'none' THEN 1 END) as rentals_with_recurrence_type
FROM rentals; 