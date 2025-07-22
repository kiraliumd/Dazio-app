-- Script para atualizar locações recorrentes existentes
-- que não têm next_occurrence_date calculado

-- Primeiro, vamos ver quais locações recorrentes não têm next_occurrence_date
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
WHERE is_recurring = true 
  AND (next_occurrence_date IS NULL OR next_occurrence_date = '')
ORDER BY created_at DESC;

-- Atualizar locações recorrentes mensais
UPDATE rentals 
SET next_occurrence_date = (
  CASE 
    WHEN recurrence_type = 'monthly' THEN 
      (end_date::date + (recurrence_interval || ' months')::interval)::date::text
    WHEN recurrence_type = 'weekly' THEN 
      (end_date::date + (recurrence_interval * 7 || ' days')::interval)::date::text
    WHEN recurrence_type = 'yearly' THEN 
      (end_date::date + (recurrence_interval || ' years')::interval)::date::text
    ELSE NULL
  END
)
WHERE is_recurring = true 
  AND recurrence_type IS NOT NULL
  AND recurrence_type != ''
  AND (next_occurrence_date IS NULL OR next_occurrence_date = '');

-- Verificar se a atualização funcionou
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
WHERE is_recurring = true 
ORDER BY created_at DESC
LIMIT 10; 