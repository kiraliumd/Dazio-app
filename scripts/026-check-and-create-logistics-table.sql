-- Script para verificar e criar a tabela de eventos de logística
-- Execute este script para garantir que a tabela existe

-- 1. Verificar se a tabela existe
SELECT 'VERIFICANDO EXISTÊNCIA DA TABELA' as info;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'rental_logistics_events';

-- 2. Se a tabela não existir, criá-la
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_logistics_events' AND table_schema = 'public') THEN
        
        RAISE NOTICE 'Tabela rental_logistics_events não existe. Criando...';
        
        -- Criar a tabela de eventos de logística
        CREATE TABLE rental_logistics_events (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
            event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('Instalação', 'Retirada', 'Manutenção', 'Verificação')),
            scheduled_date DATE NOT NULL,
            scheduled_time TIME NOT NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'Agendado' CHECK (status IN ('Agendado', 'Em Andamento', 'Concluído', 'Cancelado')),
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Criar índices para melhor performance
        CREATE INDEX idx_rental_logistics_events_rental_id ON rental_logistics_events(rental_id);
        CREATE INDEX idx_rental_logistics_events_date ON rental_logistics_events(scheduled_date);
        CREATE INDEX idx_rental_logistics_events_status ON rental_logistics_events(status);
        CREATE INDEX idx_rental_logistics_events_type ON rental_logistics_events(event_type);

        -- Verificar se a função update_updated_at_column existe
        IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        END IF;

        -- Aplicar trigger para atualizar updated_at
        CREATE TRIGGER update_rental_logistics_events_updated_at 
        BEFORE UPDATE ON rental_logistics_events 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();

        RAISE NOTICE 'Tabela rental_logistics_events criada com sucesso!';
        
    ELSE
        RAISE NOTICE 'Tabela rental_logistics_events já existe!';
    END IF;
END $$;

-- 3. Verificar a estrutura da tabela
SELECT 'ESTRUTURA DA TABELA RENTAL_LOGISTICS_EVENTS' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'rental_logistics_events' 
ORDER BY ordinal_position;

-- 4. Verificar se há dados na tabela
SELECT 'DADOS NA TABELA RENTAL_LOGISTICS_EVENTS' as info;
SELECT 
    COUNT(*) as total_events,
    COUNT(DISTINCT rental_id) as unique_rentals
FROM rental_logistics_events;

-- 5. Verificar relacionamentos
SELECT 'RELACIONAMENTOS DA TABELA' as info;
SELECT 
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
AND tc.table_schema = 'public'
AND tc.table_name = 'rental_logistics_events';

-- 6. Verificar se há locações sem eventos de logística
SELECT 'LOCAÇÕES SEM EVENTOS DE LOGÍSTICA' as info;
SELECT 
    r.id,
    r.client_name,
    r.start_date,
    r.end_date,
    r.created_at
FROM rentals r
LEFT JOIN rental_logistics_events rle ON r.id = rle.rental_id
WHERE rle.id IS NULL
ORDER BY r.created_at DESC;

-- 7. Relatório final
SELECT 'RELATÓRIO FINAL' as info;
SELECT 
    'Tabela existe' as metric,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_logistics_events') 
        THEN 'SIM' 
        ELSE 'NÃO' 
    END as value

UNION ALL

SELECT 
    'Total de eventos' as metric,
    COUNT(*)::text as value
FROM rental_logistics_events

UNION ALL

SELECT 
    'Locações com eventos' as metric,
    COUNT(DISTINCT rental_id)::text as value
FROM rental_logistics_events

UNION ALL

SELECT 
    'Locações sem eventos' as metric,
    (SELECT COUNT(*) FROM rentals r
     LEFT JOIN rental_logistics_events rle ON r.id = rle.rental_id
     WHERE rle.id IS NULL)::text as value; 