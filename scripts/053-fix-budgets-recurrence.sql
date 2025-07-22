-- Script para corrigir dados de recorrência dos orçamentos
-- Data: $(date)
-- Descrição: Corrige orçamentos que foram marcados incorretamente como recorrentes

-- 1. Verificar o estado atual dos orçamentos
SELECT 
  id,
  number,
  client_name,
  is_recurring,
  recurrence_type,
  recurrence_interval,
  recurrence_end_date,
  status
FROM budgets 
ORDER BY created_at DESC;

-- 2. Corrigir orçamentos que não deveriam ser recorrentes
-- Se is_recurring é false mas tem recurrence_type, limpar os campos
UPDATE budgets 
SET 
  recurrence_type = NULL,
  recurrence_interval = 1,
  recurrence_end_date = NULL
WHERE is_recurring = false 
  AND (recurrence_type IS NOT NULL OR recurrence_end_date IS NOT NULL);

-- 3. Corrigir orçamentos que têm is_recurring = true mas não têm recurrence_type válido
UPDATE budgets 
SET 
  is_recurring = false,
  recurrence_type = NULL,
  recurrence_interval = 1,
  recurrence_end_date = NULL
WHERE is_recurring = true 
  AND (recurrence_type IS NULL OR recurrence_type NOT IN ('weekly', 'monthly', 'yearly'));

-- 4. Verificar o resultado após as correções
SELECT 
  id,
  number,
  client_name,
  is_recurring,
  recurrence_type,
  recurrence_interval,
  recurrence_end_date,
  status
FROM budgets 
ORDER BY created_at DESC;

-- 5. Contar quantos orçamentos são realmente recorrentes
SELECT 
  COUNT(*) as total_budgets,
  COUNT(CASE WHEN is_recurring = true THEN 1 END) as recurring_budgets,
  COUNT(CASE WHEN is_recurring = false THEN 1 END) as non_recurring_budgets
FROM budgets; 