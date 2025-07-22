-- Script para corrigir o tipo recurrence_status
-- Execute este script para criar o tipo ENUM que está faltando

-- 1. Criar o tipo recurrence_status
DO $$ 
BEGIN
  -- Criar tipo recurrence_status se não existir
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recurrence_status') THEN
    CREATE TYPE recurrence_status AS ENUM ('active', 'paused', 'cancelled', 'completed');
    RAISE NOTICE 'Tipo recurrence_status criado com sucesso';
  ELSE
    RAISE NOTICE 'Tipo recurrence_status já existe';
  END IF;
END $$;

-- 2. Verificar se a coluna recurrence_status existe e tem o tipo correto
SELECT 
  column_name, 
  data_type, 
  udt_name,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'rentals' 
AND column_name = 'recurrence_status';

-- 3. Se a coluna não existir, criá-la
ALTER TABLE rentals 
ADD COLUMN IF NOT EXISTS recurrence_status recurrence_status DEFAULT 'active';

-- 4. Verificação final
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recurrence_status') 
    THEN '✅ Tipo recurrence_status criado com sucesso'
    ELSE '❌ Erro ao criar tipo recurrence_status'
  END as status_recurrence_status;

-- 5. Verificar se a coluna foi criada corretamente
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rentals' AND column_name = 'recurrence_status') 
    THEN '✅ Coluna recurrence_status existe na tabela rentals'
    ELSE '❌ Coluna recurrence_status não foi criada'
  END as status_recurrence_status_column; 