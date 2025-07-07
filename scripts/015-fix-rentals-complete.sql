-- Script completo para corrigir a estrutura da tabela rentals
-- Este script garante que todas as colunas necessárias existam

-- 1. Verificar se a tabela existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rentals' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Tabela rentals não existe!';
    END IF;
END $$;

-- 2. Adicionar colunas de data se não existirem
DO $$ 
BEGIN
    -- start_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rentals' AND column_name = 'start_date') THEN
        ALTER TABLE rentals ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Coluna start_date adicionada';
    END IF;
    
    -- end_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rentals' AND column_name = 'end_date') THEN
        ALTER TABLE rentals ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Coluna end_date adicionada';
    END IF;
END $$;

-- 3. Adicionar colunas de tempo se não existirem
DO $$ 
BEGIN
    -- installation_time
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rentals' AND column_name = 'installation_time') THEN
        ALTER TABLE rentals ADD COLUMN installation_time TIME;
        RAISE NOTICE 'Coluna installation_time adicionada';
    END IF;
    
    -- removal_time
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rentals' AND column_name = 'removal_time') THEN
        ALTER TABLE rentals ADD COLUMN removal_time TIME;
        RAISE NOTICE 'Coluna removal_time adicionada';
    END IF;
END $$;

-- 4. Adicionar outras colunas se não existirem
DO $$ 
BEGIN
    -- installation_location
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rentals' AND column_name = 'installation_location') THEN
        ALTER TABLE rentals ADD COLUMN installation_location TEXT;
        RAISE NOTICE 'Coluna installation_location adicionada';
    END IF;
    
    -- budget_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rentals' AND column_name = 'budget_id') THEN
        ALTER TABLE rentals ADD COLUMN budget_id UUID REFERENCES budgets(id);
        RAISE NOTICE 'Coluna budget_id adicionada';
    END IF;
END $$;

-- 5. Copiar dados das colunas antigas para as novas (se existirem)
UPDATE rentals 
SET 
    start_date = event_start_date,
    end_date = event_end_date
WHERE event_start_date IS NOT NULL AND event_end_date IS NOT NULL 
AND start_date IS NULL AND end_date IS NULL;

-- 6. Verificar a estrutura final
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'rentals' 
ORDER BY ordinal_position;

-- 7. Mostrar estatísticas
SELECT 
    COUNT(*) as total_rentals,
    COUNT(start_date) as with_start_date,
    COUNT(end_date) as with_end_date,
    COUNT(installation_time) as with_installation_time,
    COUNT(removal_time) as with_removal_time
FROM rentals; 