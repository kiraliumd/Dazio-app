-- PASSO 5: Verificar estrutura criada
-- Execute este comando após o passo 4 para confirmar que tudo foi criado corretamente

SELECT 'ESTRUTURA DA NOVA TABELA' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'rental_logistics_events' 
ORDER BY ordinal_position;

SELECT 'CONSTRAINTS CRIADAS' as info;
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'rental_logistics_events';

SELECT 'ÍNDICES CRIADOS' as info;
SELECT 
    indexname,
    tablename
FROM pg_indexes 
WHERE tablename = 'rental_logistics_events'; 