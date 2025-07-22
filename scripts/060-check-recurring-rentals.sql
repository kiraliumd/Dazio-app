-- Verificar locações recorrentes no banco de dados

-- 1. Verificar se há locações com is_recurring = true
SELECT 'LOCAÇÕES RECORRENTES:' as info;
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
WHERE is_recurring = true
ORDER BY created_at DESC;

-- 2. Verificar todas as colunas de recorrência
SELECT 'TODAS AS COLUNAS DE RECORRÊNCIA:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'rentals' 
AND column_name LIKE '%recurrence%'
ORDER BY ordinal_position;

-- 3. Verificar se há locações com dados de recorrência mas is_recurring = false
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
    created_at
FROM rentals 
WHERE (recurrence_type IS NOT NULL AND recurrence_type != 'none')
   OR recurrence_interval > 1
   OR recurrence_status IS NOT NULL
ORDER BY created_at DESC;

-- 4. Contar total de locações
SELECT 'TOTAL DE LOCAÇÕES:' as info;
SELECT 
    COUNT(*) as total_rentals,
    COUNT(CASE WHEN is_recurring = true THEN 1 END) as recurring_rentals,
    COUNT(CASE WHEN is_recurring = false OR is_recurring IS NULL THEN 1 END) as non_recurring_rentals
FROM rentals; 