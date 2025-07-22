-- Script para testar a criação de uma locação recorrente
-- Primeiro, vamos verificar se há dados de teste para usar

-- Verificar se há clientes disponíveis
SELECT id, name FROM clients LIMIT 5;

-- Verificar se há equipamentos disponíveis
SELECT id, name, daily_rate FROM equipments LIMIT 5;

-- Verificar se há orçamentos disponíveis
SELECT id, number, client_name, start_date, end_date FROM budgets LIMIT 5;

-- Testar inserção manual de uma locação recorrente
-- Substitua os IDs pelos valores reais do seu banco

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
  budget_id,
  is_recurring,
  recurrence_type,
  recurrence_interval,
  recurrence_status,
  next_occurrence_date
) VALUES (
  'ID_DO_CLIENTE_AQUI', -- Substitua pelo ID real
  'Cliente Teste Recorrência',
  '2024-01-15',
  '2024-01-20',
  '2024-01-15',
  '2024-01-20',
  'Local de Teste',
  1000.00,
  0.00,
  1000.00,
  'Ativo',
  'ID_DO_ORCAMENTO_AQUI', -- Substitua pelo ID real
  true,
  'monthly',
  1,
  'active',
  '2024-02-20' -- Esta data deve ser calculada automaticamente
);

-- Verificar se a inserção funcionou
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
WHERE client_name = 'Cliente Teste Recorrência'
ORDER BY created_at DESC
LIMIT 1; 