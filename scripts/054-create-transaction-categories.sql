-- =====================================================
-- CRIAÇÃO DA TABELA DE CATEGORIAS DE TRANSAÇÕES
-- =====================================================

-- Criar tabela de categorias de transações
CREATE TABLE IF NOT EXISTS transaction_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('Receita', 'Despesa')),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_transaction_categories_name ON transaction_categories(name);
CREATE INDEX IF NOT EXISTS idx_transaction_categories_type ON transaction_categories(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transaction_categories_active ON transaction_categories(is_active);

-- Inserir categorias padrão do sistema
INSERT INTO transaction_categories (name, transaction_type, description) VALUES
-- Receitas
('Receita de Locação', 'Receita', 'Receitas provenientes de locações de equipamentos'),
('Receita de Serviços', 'Receita', 'Receitas provenientes de serviços prestados'),
('Receita de Vendas', 'Receita', 'Receitas provenientes de vendas de produtos'),
('Outras Receitas', 'Receita', 'Outras receitas não categorizadas'),

-- Despesas
('Aluguel', 'Despesa', 'Despesas com aluguel de imóveis'),
('Energia Elétrica', 'Despesa', 'Despesas com energia elétrica'),
('Água', 'Despesa', 'Despesas com água'),
('Internet/Telefone', 'Despesa', 'Despesas com internet e telefone'),
('Combustível', 'Despesa', 'Despesas com combustível'),
('Manutenção', 'Despesa', 'Despesas com manutenção de equipamentos'),
('Salários', 'Despesa', 'Despesas com salários e encargos'),
('Impostos', 'Despesa', 'Despesas com impostos e taxas'),
('Marketing', 'Despesa', 'Despesas com marketing e publicidade'),
('Outras Despesas', 'Despesa', 'Outras despesas não categorizadas')
ON CONFLICT (name, transaction_type) DO NOTHING;

-- =====================================================
-- ATUALIZAR TABELA DE TRANSAÇÕES PARA INCLUIR CATEGORIA
-- =====================================================

-- Adicionar coluna category_id na tabela financial_transactions
ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES transaction_categories(id);

-- Criar índice para a nova coluna
CREATE INDEX IF NOT EXISTS idx_financial_transactions_category ON financial_transactions(category_id);

-- Atualizar transações existentes para usar a categoria "Receita de Locação" (se for receita)
UPDATE financial_transactions 
SET category_id = (
    SELECT id FROM transaction_categories 
    WHERE name = 'Receita de Locação' AND transaction_type = 'Receita'
    LIMIT 1
)
WHERE transaction_type = 'Receita' AND category_id IS NULL;

-- Atualizar transações existentes para usar a categoria "Outras Despesas" (se for despesa)
UPDATE financial_transactions 
SET category_id = (
    SELECT id FROM transaction_categories 
    WHERE name = 'Outras Despesas' AND transaction_type = 'Despesa'
    LIMIT 1
)
WHERE transaction_type = 'Despesa' AND category_id IS NULL;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se a tabela foi criada corretamente
SELECT 
    'transaction_categories' as table_name,
    COUNT(*) as total_categories,
    COUNT(CASE WHEN transaction_type = 'Receita' THEN 1 END) as receitas,
    COUNT(CASE WHEN transaction_type = 'Despesa' THEN 1 END) as despesas
FROM transaction_categories;

-- Verificar transações com categorias
SELECT 
    'financial_transactions' as table_name,
    COUNT(*) as total_transactions,
    COUNT(category_id) as with_category,
    COUNT(*) - COUNT(category_id) as without_category
FROM financial_transactions; 