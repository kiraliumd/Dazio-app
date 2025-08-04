-- Script para corrigir políticas RLS (Row Level Security)
-- Execute este script no SQL Editor do Supabase

-- 1. Habilitar RLS nas tabelas
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 2. Política para company_profiles - Permitir inserção durante cadastro
DROP POLICY IF EXISTS "Users can insert their own company profile" ON company_profiles;
CREATE POLICY "Users can insert their own company profile" ON company_profiles
    FOR INSERT 
    WITH CHECK (true); -- Permitir inserção para todos durante cadastro

-- 3. Política para company_profiles - Permitir leitura do próprio perfil
DROP POLICY IF EXISTS "Users can view their own company profile" ON company_profiles;
CREATE POLICY "Users can view their own company profile" ON company_profiles
    FOR SELECT 
    USING (auth.uid() = user_id);

-- 4. Política para company_profiles - Permitir atualização do próprio perfil
DROP POLICY IF EXISTS "Users can update their own company profile" ON company_profiles;
CREATE POLICY "Users can update their own company profile" ON company_profiles
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5. Política para company_settings - Permitir inserção durante cadastro
DROP POLICY IF EXISTS "Users can insert company settings" ON company_settings;
CREATE POLICY "Users can insert company settings" ON company_settings
    FOR INSERT 
    WITH CHECK (true); -- Permitir inserção para todos durante cadastro

-- 6. Política para company_settings - Permitir leitura
DROP POLICY IF EXISTS "Users can view company settings" ON company_settings;
CREATE POLICY "Users can view company settings" ON company_settings
    FOR SELECT 
    USING (true); -- Permitir leitura para todos

-- 7. Política para company_settings - Permitir atualização
DROP POLICY IF EXISTS "Users can update company settings" ON company_settings;
CREATE POLICY "Users can update company settings" ON company_settings
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);

-- 8. Política para subscriptions - Permitir inserção
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON subscriptions;
CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- 9. Política para subscriptions - Permitir leitura
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
    FOR SELECT 
    USING (auth.uid() = user_id);

-- 10. Política para subscriptions - Permitir atualização
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON subscriptions;
CREATE POLICY "Users can update their own subscriptions" ON subscriptions
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 11. Verificar se as políticas foram criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('company_profiles', 'company_settings', 'subscriptions')
ORDER BY tablename, policyname; 