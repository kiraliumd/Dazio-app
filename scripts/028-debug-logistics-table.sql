-- Script para debugar problemas na tabela rental_logistics_events
-- Execute este script para identificar possíveis problemas

-- 1. Verificar se a tabela existe e suas permissões
SELECT 'VERIFICAÇÃO DA TABELA' as info;
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename = 'rental_logistics_events';

-- 2. Verificar constraints da tabela
SELECT 'CONSTRAINTS DA TABELA' as info;
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'rental_logistics_events'::regclass;

-- 3. Verificar foreign keys
SELECT 'FOREIGN KEYS' as info;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'rental_logistics_events';

-- 4. Verificar triggers
SELECT 'TRIGGERS' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'rental_logistics_events';

-- 5. Verificar índices
SELECT 'ÍNDICES' as info;
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'rental_logistics_events';

-- 6. Verificar se há dados na tabela
SELECT 'DADOS NA TABELA' as info;
SELECT 
    COUNT(*) as total_rows,
    COUNT(DISTINCT rental_id) as unique_rentals,
    COUNT(CASE WHEN event_type = 'Instalação' THEN 1 END) as installation_events,
    COUNT(CASE WHEN event_type = 'Retirada' THEN 1 END) as removal_events
FROM rental_logistics_events;

-- 7. Verificar se há locações que deveriam ter eventos
SELECT 'LOCAÇÕES SEM EVENTOS' as info;
SELECT 
    r.id,
    r.client_name,
    r.start_date,
    r.end_date,
    r.installation_time,
    r.removal_time,
    r.created_at,
    CASE 
        WHEN rle.id IS NULL THEN 'SEM EVENTOS'
        ELSE 'COM EVENTOS'
    END as status
FROM rentals r
LEFT JOIN rental_logistics_events rle ON r.id = rle.rental_id
ORDER BY r.created_at DESC
LIMIT 10;

-- 8. Testar inserção manual simples
DO $$
DECLARE
    test_rental_id UUID;
    test_result BOOLEAN;
BEGIN
    -- Pegar uma locação para teste
    SELECT id INTO test_rental_id 
    FROM rentals 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF test_rental_id IS NOT NULL THEN
        RAISE NOTICE 'Testando inserção manual para locação: %', test_rental_id;
        
        -- Tentar inserção simples
        BEGIN
            INSERT INTO rental_logistics_events (
                rental_id,
                event_type,
                scheduled_date,
                scheduled_time,
                status,
                notes
            ) VALUES (
                test_rental_id,
                'Instalação',
                CURRENT_DATE,
                '09:00',
                'Agendado',
                'Teste manual'
            );
            
            test_result := TRUE;
            RAISE NOTICE '✅ Inserção manual bem-sucedida!';
            
        EXCEPTION WHEN OTHERS THEN
            test_result := FALSE;
            RAISE NOTICE '❌ Erro na inserção manual: %', SQLERRM;
        END;
        
        -- Limpar teste se foi bem-sucedido
        IF test_result THEN
            DELETE FROM rental_logistics_events 
            WHERE notes = 'Teste manual';
            RAISE NOTICE 'Teste limpo com sucesso!';
        END IF;
        
    ELSE
        RAISE NOTICE 'Nenhuma locação encontrada para teste!';
    END IF;
END $$;

-- 9. Verificar se há problemas de tipo de dados
SELECT 'VERIFICAÇÃO DE TIPOS DE DADOS' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN data_type = 'uuid' THEN 'UUID válido'
        WHEN data_type = 'date' THEN 'Data válida'
        WHEN data_type = 'time' THEN 'Hora válida'
        WHEN data_type = 'varchar' THEN 'Texto válido'
        ELSE 'Outro tipo'
    END as validation_note
FROM information_schema.columns 
WHERE table_name = 'rental_logistics_events' 
ORDER BY ordinal_position;

-- 10. Verificar permissões do usuário atual
SELECT 'PERMISSÕES DO USUÁRIO' as info;
SELECT 
    schemaname,
    tablename,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'rental_logistics_events'
AND grantee = current_user;

-- 11. Relatório final de diagnóstico
SELECT 'DIAGNÓSTICO FINAL' as info;
SELECT 
    'Tabela existe' as check_item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_logistics_events') 
        THEN '✅ SIM' 
        ELSE '❌ NÃO' 
    END as result

UNION ALL

SELECT 
    'Tem foreign key' as check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'rental_logistics_events' 
            AND constraint_type = 'FOREIGN KEY'
        ) 
        THEN '✅ SIM' 
        ELSE '❌ NÃO' 
    END as result

UNION ALL

SELECT 
    'Tem triggers' as check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE event_object_table = 'rental_logistics_events'
        ) 
        THEN '✅ SIM' 
        ELSE '❌ NÃO' 
    END as result

UNION ALL

SELECT 
    'Tem dados' as check_item,
    CASE 
        WHEN (SELECT COUNT(*) FROM rental_logistics_events) > 0 
        THEN '✅ SIM' 
        ELSE '❌ NÃO' 
    END as result

UNION ALL

SELECT 
    'Permissão INSERT' as check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_privileges 
            WHERE table_name = 'rental_logistics_events'
            AND privilege_type = 'INSERT'
            AND grantee = current_user
        ) 
        THEN '✅ SIM' 
        ELSE '❌ NÃO' 
    END as result; 