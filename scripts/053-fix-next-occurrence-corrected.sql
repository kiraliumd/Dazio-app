-- Script corrigido para atualizar next_occurrence_date
-- O problema era que a coluna é timestamp with time zone, não text

-- 1. Primeiro, vamos verificar se as colunas existem e seus tipos
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'rentals' 
  AND column_name IN (
    'is_recurring',
    'recurrence_type', 
    'recurrence_interval',
    'recurrence_end_date',
    'next_occurrence_date',
    'recurrence_status',
    'parent_rental_id'
  )
ORDER BY column_name;

-- 2. Vamos testar o cálculo manualmente para uma locação específica
SELECT 
  id,
  client_name,
  start_date,
  end_date,
  is_recurring,
  recurrence_type,
  recurrence_interval,
  next_occurrence_date,
  -- Teste de cálculo manual (convertendo para timestamp)
  CASE 
    WHEN recurrence_type = 'monthly' THEN 
      (end_date::date + (recurrence_interval || ' months')::interval)::timestamp with time zone
    WHEN recurrence_type = 'weekly' THEN 
      (end_date::date + (recurrence_interval * 7 || ' days')::interval)::timestamp with time zone
    WHEN recurrence_type = 'yearly' THEN 
      (end_date::date + (recurrence_interval || ' years')::interval)::timestamp with time zone
    ELSE NULL
  END as calculated_next_date
FROM rentals 
WHERE is_recurring = true 
ORDER BY created_at DESC;

-- 3. Vamos tentar uma atualização mais específica (convertendo para timestamp)
UPDATE rentals 
SET next_occurrence_date = 
  CASE 
    WHEN recurrence_type = 'monthly' THEN 
      (end_date::date + (recurrence_interval || ' months')::interval)::timestamp with time zone
    WHEN recurrence_type = 'weekly' THEN 
      (end_date::date + (recurrence_interval * 7 || ' days')::interval)::timestamp with time zone
    WHEN recurrence_type = 'yearly' THEN 
      (end_date::date + (recurrence_interval || ' years')::interval)::timestamp with time zone
    ELSE NULL
  END
WHERE id IN (
  'ff49ebb7-f07a-467e-a971-53b685fcbf34',
  '2c00dd81-619b-4365-9fbf-9a620096ce87'
);

-- 4. Verificar se a atualização funcionou
SELECT 
  id,
  client_name,
  start_date,
  end_date,
  is_recurring,
  recurrence_type,
  recurrence_interval,
  next_occurrence_date,
  recurrence_status
FROM rentals 
WHERE id IN (
  'ff49ebb7-f07a-467e-a971-53b685fcbf34',
  '2c00dd81-619b-4365-9fbf-9a620096ce87'
); 