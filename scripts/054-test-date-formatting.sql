-- Script para testar se as datas estão sendo calculadas corretamente
-- Vamos verificar as datas atuais e testar o cálculo manual

SELECT 
  id,
  client_name,
  start_date,
  end_date,
  is_recurring,
  recurrence_type,
  recurrence_interval,
  next_occurrence_date,
  -- Teste de cálculo manual para comparar
  CASE 
    WHEN recurrence_type = 'monthly' THEN 
      (end_date::date + (recurrence_interval || ' months')::interval)::date
    WHEN recurrence_type = 'weekly' THEN 
      (end_date::date + (recurrence_interval * 7 || ' days')::interval)::date
    WHEN recurrence_type = 'yearly' THEN 
      (end_date::date + (recurrence_interval || ' years')::interval)::date
    ELSE NULL
  END as calculated_date_only,
  -- Teste de cálculo com timestamp
  CASE 
    WHEN recurrence_type = 'monthly' THEN 
      (end_date::date + (recurrence_interval || ' months')::interval)::timestamp with time zone
    WHEN recurrence_type = 'weekly' THEN 
      (end_date::date + (recurrence_interval * 7 || ' days')::interval)::timestamp with time zone
    WHEN recurrence_type = 'yearly' THEN 
      (end_date::date + (recurrence_interval || ' years')::interval)::timestamp with time zone
    ELSE NULL
  END as calculated_timestamp
FROM rentals 
WHERE is_recurring = true 
ORDER BY created_at DESC; 