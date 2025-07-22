-- Script para debugar o problema da próxima ocorrência
-- Verificar locações recorrentes existentes

SELECT 
  id,
  client_name,
  start_date,
  end_date,
  is_recurring,
  recurrence_type,
  recurrence_interval,
  recurrence_end_date,
  next_occurrence_date,
  recurrence_status,
  created_at
FROM rentals 
WHERE is_recurring = true
ORDER BY created_at DESC
LIMIT 10;

-- Verificar se as colunas de recorrência existem
SELECT 
  column_name,
  data_type,
  is_nullable
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

-- Testar inserção de uma locação recorrente com next_occurrence_date calculado
-- Primeiro, vamos ver uma locação existente para usar como base
SELECT 
  id,
  client_name,
  start_date,
  end_date,
  is_recurring,
  recurrence_type,
  recurrence_interval
FROM rentals 
WHERE is_recurring = true 
LIMIT 1; 