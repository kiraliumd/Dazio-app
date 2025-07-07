-- Script para verificar dados para relatórios

-- 1. Verificar locações concluídas
SELECT 'LOCAÇÕES CONCLUÍDAS' as info;
SELECT 
    COUNT(*) as total_rentals,
    COUNT(CASE WHEN status = 'Concluído' THEN 1 END) as completed_rentals,
    COUNT(CASE WHEN status = 'Ativo' THEN 1 END) as active_rentals,
    COUNT(CASE WHEN status = 'Instalação Pendente' THEN 1 END) as pending_rentals
FROM rentals;

-- 2. Verificar orçamentos aprovados
SELECT 'ORÇAMENTOS APROVADOS' as info;
SELECT 
    COUNT(*) as total_budgets,
    COUNT(CASE WHEN status = 'Aprovado' THEN 1 END) as approved_budgets,
    COUNT(CASE WHEN status = 'Pendente' THEN 1 END) as pending_budgets,
    COUNT(CASE WHEN status = 'Rejeitado' THEN 1 END) as rejected_budgets
FROM budgets;

-- 3. Verificar locações por período (últimos 30 dias)
SELECT 'LOCAÇÕES ÚLTIMOS 30 DIAS' as info;
SELECT 
    COUNT(*) as rentals_last_30_days,
    SUM(final_value) as total_revenue_last_30_days
FROM rentals 
WHERE created_at >= NOW() - INTERVAL '30 days'
AND status = 'Concluído';

-- 4. Verificar orçamentos por período (últimos 30 dias)
SELECT 'ORÇAMENTOS ÚLTIMOS 30 DIAS' as info;
SELECT 
    COUNT(*) as budgets_last_30_days,
    SUM(total_value) as total_value_last_30_days
FROM budgets 
WHERE created_at >= NOW() - INTERVAL '30 days'
AND status = 'Aprovado';

-- 5. Verificar estrutura da tabela rentals
SELECT 'ESTRUTURA TABELA RENTALS' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'rentals' 
ORDER BY ordinal_position;

-- 6. Verificar estrutura da tabela budgets
SELECT 'ESTRUTURA TABELA BUDGETS' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'budgets' 
ORDER BY ordinal_position;

-- 7. Verificar algumas locações de exemplo
SELECT 'EXEMPLOS DE LOCAÇÕES' as info;
SELECT 
    id,
    client_name,
    status,
    final_value,
    created_at,
    start_date,
    end_date
FROM rentals 
ORDER BY created_at DESC 
LIMIT 5;

-- 8. Verificar alguns orçamentos de exemplo
SELECT 'EXEMPLOS DE ORÇAMENTOS' as info;
SELECT 
    id,
    client_name,
    status,
    total_value,
    created_at
FROM budgets 
ORDER BY created_at DESC 
LIMIT 5; 