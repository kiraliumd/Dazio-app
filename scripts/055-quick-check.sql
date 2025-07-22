-- Verificação rápida das colunas de recorrência
-- Execute este script para verificar se tudo está configurado corretamente

-- Verificar colunas na tabela rentals
SELECT 
  CASE 
    WHEN COUNT(*) = 7 THEN '✅ Todas as colunas de recorrência existem'
    ELSE '❌ Faltam colunas de recorrência: ' || COUNT(*) || '/7 encontradas'
  END as status_rentals
FROM information_schema.columns 
WHERE table_name = 'rentals' 
AND column_name IN ('is_recurring', 'recurrence_type', 'recurrence_interval', 'recurrence_end_date', 'recurrence_status', 'parent_rental_id', 'next_occurrence_date');

-- Listar colunas encontradas
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'rentals' 
AND column_name LIKE '%recurrence%'
ORDER BY ordinal_position;

-- Verificar se a tabela de ocorrências existe
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recurring_rental_occurrences') 
    THEN '✅ Tabela recurring_rental_occurrences existe'
    ELSE '❌ Tabela recurring_rental_occurrences não existe'
  END as status_occurrences_table;

-- Verificar tipos ENUM
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recurrence_type') 
    THEN '✅ Tipo recurrence_type existe'
    ELSE '❌ Tipo recurrence_type não existe'
  END as status_recurrence_type;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recurrence_status') 
    THEN '✅ Tipo recurrence_status existe'
    ELSE '❌ Tipo recurrence_status não existe'
  END as status_recurrence_status; 