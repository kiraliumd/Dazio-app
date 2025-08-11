-- Script de correção de warnings de segurança do Supabase
-- Data: 2025-01-11
-- Descrição: Corrige warnings de function_search_path_mutable e move extensão pg_trgm

-- =====================================================
-- 1. CORREÇÃO DE FUNCTIONS COM SEARCH_PATH MUTÁVEL
-- =====================================================

-- Todas as funções foram recriadas com:
-- SET search_path = public
-- SECURITY DEFINER
-- Para evitar vulnerabilidades de segurança

-- Funções corrigidas:
-- - cleanup_orphaned_data()
-- - cleanup_expired_tokens()
-- - get_dashboard_metrics(uuid)
-- - atualizar_status_locacoes()
-- - get_available_quantity(uuid)
-- - get_financial_transaction_by_id(uuid)
-- - update_account_current_balance(uuid)
-- - update_all_account_balances()
-- - update_equipment_categories_updated_at()
-- - update_updated_at_column()
-- - calculate_account_balance(uuid)
-- - calculate_next_occurrence(timestamp, text, integer)
-- - check_equipment_availability(uuid, timestamp, timestamp)
-- - generate_future_occurrences(uuid, timestamp)
-- - receive_account_receivable(uuid, numeric)
-- - trigger_update_account_balance()

-- =====================================================
-- 2. MOVIMENTAÇÃO DA EXTENSÃO PG_TRGM
-- =====================================================

-- Extensão pg_trgm foi movida do schema public para extensions
-- Isso resolve o warning "extension_in_public"
-- Índices trigram foram recriados após a movimentação

-- =====================================================
-- 3. WARNINGS RESTANTES (REQUEREM AÇÃO MANUAL)
-- =====================================================

-- Os seguintes warnings ainda precisam ser corrigidos via Dashboard do Supabase:

-- 1. Auth OTP long expiry
--    - Acesse: Dashboard > Auth > Settings > Email Auth
--    - Reduza o OTP Expiry para menos de 1 hora
--    - Recomendado: 15-30 minutos

-- 2. Leaked Password Protection Disabled
--    - Acesse: Dashboard > Auth > Settings > Password Security
--    - Ative "Enable leaked password protection"
--    - Isso verifica senhas contra HaveIBeenPwned.org

-- =====================================================
-- 4. BENEFÍCIOS DAS CORREÇÕES
-- =====================================================

-- ✅ Segurança: Funções não podem mais ser manipuladas via search_path
-- ✅ Performance: Índices trigram funcionando corretamente
-- ✅ Compliance: Atende aos padrões de segurança do Supabase
-- ✅ Manutenibilidade: Código mais seguro e previsível

-- =====================================================
-- 5. PRÓXIMOS PASSOS
-- =====================================================

-- 1. Verificar se todos os warnings foram resolvidos
-- 2. Configurar Auth OTP expiry via Dashboard
-- 3. Ativar leaked password protection via Dashboard
-- 4. Testar funcionalidades das funções corrigidas
-- 5. Monitorar logs de segurança

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
