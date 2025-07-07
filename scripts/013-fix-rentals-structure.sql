-- Migração para corrigir a estrutura da tabela rentals
-- Este script renomeia as colunas para corresponder ao código

-- 1. Adicionar as colunas corretas se não existirem
DO $$ 
BEGIN
    -- Verificar se start_date existe, se não, criar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rentals' AND column_name = 'start_date') THEN
        ALTER TABLE rentals ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Verificar se end_date existe, se não, criar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rentals' AND column_name = 'end_date') THEN
        ALTER TABLE rentals ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. Copiar dados das colunas antigas para as novas (se existirem)
UPDATE rentals 
SET 
    start_date = event_start_date,
    end_date = event_end_date
WHERE event_start_date IS NOT NULL AND event_end_date IS NOT NULL;

-- 3. Tornar as colunas NOT NULL após copiar os dados
ALTER TABLE rentals 
ALTER COLUMN start_date SET NOT NULL,
ALTER COLUMN end_date SET NOT NULL;

-- 4. Remover as colunas antigas (opcional - comentado por segurança)
-- ALTER TABLE rentals DROP COLUMN IF EXISTS event_start_date;
-- ALTER TABLE rentals DROP COLUMN IF EXISTS event_end_date;
-- ALTER TABLE rentals DROP COLUMN IF EXISTS removal_date;

-- 5. Verificar a estrutura final
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'rentals' 
AND column_name IN ('start_date', 'end_date', 'installation_time', 'removal_time')
ORDER BY column_name; 