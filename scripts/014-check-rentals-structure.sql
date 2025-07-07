-- Script para verificar a estrutura real da tabela rentals
-- Execute este script para descobrir os nomes corretos das colunas

-- Verificar se a tabela rentals existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'rentals';

-- Verificar estrutura completa da tabela rentals
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'rentals' 
ORDER BY ordinal_position;

-- Verificar se há colunas relacionadas a tempo/instalação
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'rentals' 
AND (column_name LIKE '%time%' OR column_name LIKE '%install%' OR column_name LIKE '%removal%')
ORDER BY column_name; 