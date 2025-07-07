-- Script para verificar se os eventos de logística estão sendo criados
-- Execute este script para verificar o status dos eventos

-- 1. Verificar se há eventos na tabela
SELECT 'EVENTOS DE LOGÍSTICA EXISTENTES' as info;
SELECT 
    COUNT(*) as total_events,
    COUNT(DISTINCT rental_id) as rentals_with_events,
    COUNT(CASE WHEN event_type = 'Instalação' THEN 1 END) as installation_events,
    COUNT(CASE WHEN event_type = 'Retirada' THEN 1 END) as removal_events
FROM rental_logistics_events;

-- 2. Verificar eventos detalhados
SELECT 'DETALHES DOS EVENTOS' as info;
SELECT 
    rle.id,
    r.client_name,
    rle.event_type,
    rle.event_date,
    rle.event_time,
    rle.status,
    rle.notes,
    rle.created_at
FROM rental_logistics_events rle
JOIN rentals r ON rle.rental_id = r.id
ORDER BY rle.created_at DESC;

-- 3. Verificar locações sem eventos
SELECT 'LOCAÇÕES SEM EVENTOS DE LOGÍSTICA' as info;
SELECT 
    r.id,
    r.client_name,
    r.start_date,
    r.end_date,
    r.installation_date,
    r.removal_date,
    r.installation_time,
    r.removal_time,
    r.created_at
FROM rentals r
LEFT JOIN rental_logistics_events rle ON r.id = rle.rental_id
WHERE rle.id IS NULL
ORDER BY r.created_at DESC;

-- 4. Verificar estrutura da tabela de eventos
SELECT 'ESTRUTURA DA TABELA DE EVENTOS' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'rental_logistics_events' 
ORDER BY ordinal_position;

-- 5. Testar inserção manual de um evento
DO $$
DECLARE
    test_rental_id UUID;
BEGIN
    -- Pegar uma locação para teste
    SELECT id INTO test_rental_id 
    FROM rentals 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF test_rental_id IS NOT NULL THEN
        RAISE NOTICE 'Testando inserção manual para locação: %', test_rental_id;
        
        -- Tentar inserir um evento de teste
        INSERT INTO rental_logistics_events (
            rental_id,
            event_type,
            event_date,
            event_time,
            status,
            notes
        ) VALUES (
            test_rental_id,
            'Instalação',
            CURRENT_DATE,
            '09:00'::time,
            'Agendado',
            'Teste manual de inserção'
        );
        
        RAISE NOTICE '✅ Inserção manual bem-sucedida!';
        
        -- Limpar teste
        DELETE FROM rental_logistics_events WHERE notes = 'Teste manual de inserção';
        RAISE NOTICE 'Teste limpo com sucesso!';
        
    ELSE
        RAISE NOTICE 'Nenhuma locação encontrada para teste!';
    END IF;
END $$; 