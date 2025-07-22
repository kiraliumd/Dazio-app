-- Script para testar as notificações de recorrência
-- Vamos criar uma locação recorrente que vence hoje para testar a notificação

-- 1. Verificar locações recorrentes existentes
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
ORDER BY next_occurrence_date;

-- 2. Criar locação recorrente para hoje (teste de notificação)
INSERT INTO rentals (
  client_id,
  client_name,
  start_date,
  end_date,
  installation_date,
  removal_date,
  installation_location,
  total_value,
  discount,
  final_value,
  status,
  is_recurring,
  recurrence_type,
  recurrence_interval,
  recurrence_status,
  next_occurrence_date
) VALUES (
  (SELECT id FROM clients LIMIT 1), -- Usar o primeiro cliente disponível
  'Cliente Teste - Hoje',
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE - INTERVAL '1 day',
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE - INTERVAL '1 day',
  'Local de Teste - Hoje',
  1500.00,
  0.00,
  1500.00,
  'Ativo',
  true,
  'monthly',
  1,
  'active',
  CURRENT_DATE -- Vence hoje
);

-- 5. Verificar todas as locações recorrentes após a inserção
SELECT 
  id,
  client_name,
  start_date,
  end_date,
  is_recurring,
  recurrence_type,
  recurrence_interval,
  next_occurrence_date,
  recurrence_status,
  -- Calcular dias até o vencimento
  CASE 
    WHEN next_occurrence_date IS NOT NULL THEN
      EXTRACT(DAY FROM (next_occurrence_date::date - CURRENT_DATE))
    ELSE NULL
  END as dias_ate_vencimento
FROM rentals 
WHERE is_recurring = true 
ORDER BY next_occurrence_date;

-- 6. Limpar dados de teste (execute apenas se quiser remover os dados de teste)
-- DELETE FROM rentals WHERE client_name LIKE 'Cliente Teste%'; 