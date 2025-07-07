-- Script para adicionar colunas de horário à tabela rentals
-- Execute este script se quiser manter horários separados das datas

-- 1. Adicionar colunas de horário
ALTER TABLE rentals 
ADD COLUMN IF NOT EXISTS installation_time TIME,
ADD COLUMN IF NOT EXISTS removal_time TIME;

-- 2. Verificar estrutura atualizada
SELECT 'ESTRUTURA ATUALIZADA DA TABELA RENTALS' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'rentals' 
AND column_name IN ('installation_time', 'removal_date', 'removal_time', 'installation_date')
ORDER BY ordinal_position;

-- 3. Atualizar horários para registros existentes (opcional)
-- Extrair horário das datas de instalação e remoção existentes
UPDATE rentals 
SET 
    installation_time = installation_date::time,
    removal_time = removal_date::time
WHERE installation_date IS NOT NULL 
   OR removal_date IS NOT NULL;

-- 4. Verificar dados atualizados
SELECT 'DADOS ATUALIZADOS' as info;
SELECT 
    id,
    client_name,
    installation_date,
    installation_time,
    removal_date,
    removal_time,
    created_at
FROM rentals 
WHERE installation_time IS NOT NULL 
   OR removal_time IS NOT NULL
ORDER BY created_at DESC 
LIMIT 5; 