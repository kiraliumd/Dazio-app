-- Verificar se a tabela budgets existe e sua estrutura
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'budgets';
 
-- Se existir, mostrar sua estrutura
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'budgets' 
ORDER BY ordinal_position; 