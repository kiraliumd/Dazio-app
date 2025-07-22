-- Script 058: Adicionar campos de recorrência à tabela budgets
-- Data: 2024-12-19

-- Verificar se as colunas já existem
DO $$
BEGIN
    -- Adicionar coluna is_recurring se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'budgets' AND column_name = 'is_recurring') THEN
        ALTER TABLE budgets ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Coluna is_recurring adicionada à tabela budgets';
    ELSE
        RAISE NOTICE 'Coluna is_recurring já existe na tabela budgets';
    END IF;

    -- Adicionar coluna recurrence_type se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'budgets' AND column_name = 'recurrence_type') THEN
        ALTER TABLE budgets ADD COLUMN recurrence_type TEXT DEFAULT 'none';
        RAISE NOTICE 'Coluna recurrence_type adicionada à tabela budgets';
    ELSE
        RAISE NOTICE 'Coluna recurrence_type já existe na tabela budgets';
    END IF;

    -- Adicionar coluna recurrence_interval se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'budgets' AND column_name = 'recurrence_interval') THEN
        ALTER TABLE budgets ADD COLUMN recurrence_interval INTEGER DEFAULT 1;
        RAISE NOTICE 'Coluna recurrence_interval adicionada à tabela budgets';
    ELSE
        RAISE NOTICE 'Coluna recurrence_interval já existe na tabela budgets';
    END IF;

    -- Adicionar coluna recurrence_end_date se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'budgets' AND column_name = 'recurrence_end_date') THEN
        ALTER TABLE budgets ADD COLUMN recurrence_end_date DATE;
        RAISE NOTICE 'Coluna recurrence_end_date adicionada à tabela budgets';
    ELSE
        RAISE NOTICE 'Coluna recurrence_end_date já existe na tabela budgets';
    END IF;

END $$;

-- Verificar a estrutura final da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'budgets' 
ORDER BY ordinal_position;

-- Mostrar estatísticas dos dados
SELECT 
    'Total de orçamentos' as metric,
    COUNT(*) as value
FROM budgets
UNION ALL
SELECT 
    'Orçamentos recorrentes' as metric,
    COUNT(*) as value
FROM budgets 
WHERE is_recurring = true
UNION ALL
SELECT 
    'Tipos de recorrência' as metric,
    COUNT(DISTINCT recurrence_type) as value
FROM budgets 
WHERE recurrence_type != 'none';

-- Mostrar distribuição dos tipos de recorrência
SELECT 
    recurrence_type,
    COUNT(*) as count
FROM budgets 
WHERE is_recurring = true
GROUP BY recurrence_type
ORDER BY count DESC; 