-- Script para recriar a tabela de eventos de logística com estrutura simplificada
-- Execute este script para reformular a tabela

-- 1. Fazer backup dos dados existentes (se houver)
CREATE TABLE IF NOT EXISTS rental_logistics_events_backup AS 
SELECT * FROM rental_logistics_events;

-- 2. Dropar a tabela atual
DROP TABLE IF EXISTS rental_logistics_events;

-- 3. Criar nova tabela com estrutura simplificada
CREATE TABLE rental_logistics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('Instalação', 'Retirada')),
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'Agendado' CHECK (status IN ('Agendado', 'Em andamento', 'Concluído', 'Cancelado')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Criar índices para performance
CREATE INDEX idx_rental_logistics_events_rental_id ON rental_logistics_events(rental_id);
CREATE INDEX idx_rental_logistics_events_event_date ON rental_logistics_events(event_date);
CREATE INDEX idx_rental_logistics_events_status ON rental_logistics_events(status);

-- 5. Criar trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rental_logistics_events_updated_at 
    BEFORE UPDATE ON rental_logistics_events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Verificar estrutura criada
SELECT 'NOVA ESTRUTURA DA TABELA' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'rental_logistics_events' 
ORDER BY ordinal_position;

-- 7. Testar inserção
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
        -- Testar inserção de eventos
        INSERT INTO rental_logistics_events (
            rental_id,
            event_type,
            event_date,
            event_time,
            status,
            notes
        ) VALUES 
        (
            test_rental_id,
            'Instalação',
            CURRENT_DATE,
            '09:00'::time,
            'Agendado',
            'Evento de teste - instalação'
        ),
        (
            test_rental_id,
            'Retirada',
            CURRENT_DATE + INTERVAL '1 day',
            '18:00'::time,
            'Agendado',
            'Evento de teste - retirada'
        );
        
        RAISE NOTICE '✅ Teste de inserção bem-sucedido para locação: %', test_rental_id;
        
        -- Verificar eventos criados
        RAISE NOTICE 'Eventos criados:';
        FOR rental_record IN 
            SELECT 
                event_type,
                event_date,
                event_time,
                status
            FROM rental_logistics_events 
            WHERE rental_id = test_rental_id
            ORDER BY event_type
        LOOP
            RAISE NOTICE '  - %: % às % (status: %)', 
                rental_record.event_type, 
                rental_record.event_date, 
                rental_record.event_time, 
                rental_record.status;
        END LOOP;
        
        -- Limpar teste
        DELETE FROM rental_logistics_events WHERE notes LIKE '%teste%';
        RAISE NOTICE 'Teste limpo com sucesso!';
        
    ELSE
        RAISE NOTICE 'Nenhuma locação encontrada para teste!';
    END IF;
END $$;

-- 8. Relatório final
SELECT 'RELATÓRIO FINAL' as info;
SELECT 
    'Tabela recriada com sucesso' as status,
    'Estrutura simplificada: event_date (DATE) + event_time (TIME)' as details;

-- 9. Mostrar constraints criadas
SELECT 'CONSTRAINTS CRIADAS' as info;
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'rental_logistics_events'; 