-- =====================================================
-- MÓDULO FINANCEIRO - DAZIO
-- Script de criação das tabelas e estruturas financeiras
-- =====================================================

-- 1. Criar tipos enum para o sistema financeiro
CREATE TYPE payment_method AS ENUM ('PIX', 'Boleto', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Transferência Bancária', 'Cheque');
CREATE TYPE receivable_status AS ENUM ('Pendente', 'Aprovado', 'Pago', 'Cancelado', 'Vencido');
CREATE TYPE transaction_type AS ENUM ('Receita', 'Despesa');
CREATE TYPE account_type AS ENUM ('Conta Corrente', 'Conta Poupança', 'Caixa', 'Cartão de Crédito', 'Investimento');

-- 2. Atualizar a tabela accounts existente para o padrão do sistema
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS account_type account_type DEFAULT 'Conta Corrente',
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS agency VARCHAR(20),
ADD COLUMN IF NOT EXISTS account_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Renomear colunas para padrão em inglês
ALTER TABLE accounts RENAME COLUMN nome TO name;
ALTER TABLE accounts RENAME COLUMN tipo TO type;
ALTER TABLE accounts RENAME COLUMN saldo_atual TO current_balance;
ALTER TABLE accounts RENAME COLUMN ativo TO is_active;

-- 3. Criar tabela de recebíveis
CREATE TABLE receivables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    status receivable_status DEFAULT 'Pendente',
    payment_method payment_method,
    destination_account_id UUID REFERENCES accounts(id),
    payment_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar tabela de transações financeiras
CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receivable_id UUID REFERENCES receivables(id) ON DELETE SET NULL,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    transaction_type transaction_type NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    payment_method payment_method,
    transaction_date DATE NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Criar índices para performance
CREATE INDEX idx_receivables_rental_id ON receivables(rental_id);
CREATE INDEX idx_receivables_client_id ON receivables(client_id);
CREATE INDEX idx_receivables_status ON receivables(status);
CREATE INDEX idx_receivables_due_date ON receivables(due_date);
CREATE INDEX idx_receivables_payment_date ON receivables(payment_date);

CREATE INDEX idx_financial_transactions_account_id ON financial_transactions(account_id);
CREATE INDEX idx_financial_transactions_receivable_id ON financial_transactions(receivable_id);
CREATE INDEX idx_financial_transactions_type ON financial_transactions(transaction_type);
CREATE INDEX idx_financial_transactions_date ON financial_transactions(transaction_date);

CREATE INDEX idx_accounts_type ON accounts(account_type);
CREATE INDEX idx_accounts_active ON accounts(is_active);

-- 6. Criar triggers para atualização automática de timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_receivables_updated_at BEFORE UPDATE ON receivables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON financial_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Criar trigger para gerar recebível automaticamente quando uma locação é fechada
CREATE OR REPLACE FUNCTION generate_receivable_on_rental_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Gerar recebível quando a locação é marcada como "Concluído"
    IF NEW.status = 'Concluído' AND OLD.status != 'Concluído' THEN
        INSERT INTO receivables (
            rental_id,
            client_id,
            client_name,
            description,
            amount,
            due_date,
            status,
            notes
        ) VALUES (
            NEW.id,
            NEW.client_id,
            NEW.client_name,
            'Recebível da locação #' || NEW.id::text,
            NEW.final_value,
            CURRENT_DATE + INTERVAL '30 days', -- Vencimento em 30 dias
            'Pendente',
            'Gerado automaticamente ao concluir locação'
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_generate_receivable 
    AFTER UPDATE ON rentals 
    FOR EACH ROW 
    EXECUTE FUNCTION generate_receivable_on_rental_completion();

-- 8. Criar trigger para atualizar saldo da conta quando uma transação é criada
CREATE OR REPLACE FUNCTION update_account_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar saldo da conta baseado no tipo de transação
    IF NEW.transaction_type = 'Receita' THEN
        UPDATE accounts 
        SET current_balance = current_balance + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.account_id;
    ELSE
        UPDATE accounts 
        SET current_balance = current_balance - NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.account_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_account_balance 
    AFTER INSERT ON financial_transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_account_balance_on_transaction();

-- 9. Inserir dados iniciais de contas (se não existirem)
INSERT INTO accounts (name, type, account_type, current_balance, is_active, bank_name, description)
VALUES 
    ('Caixa Principal', 'Caixa', 'Caixa', 0, true, NULL, 'Caixa principal da empresa'),
    ('Conta Corrente Principal', 'Banco', 'Conta Corrente', 0, true, 'Banco Principal', 'Conta corrente principal'),
    ('Cartão de Crédito', 'Cartão', 'Cartão de Crédito', 0, true, NULL, 'Cartão de crédito empresarial')
ON CONFLICT DO NOTHING;

-- 10. Criar view para relatórios financeiros
CREATE VIEW financial_summary AS
SELECT 
    DATE_TRUNC('month', transaction_date) as month,
    transaction_type,
    SUM(amount) as total_amount,
    COUNT(*) as transaction_count
FROM financial_transactions
GROUP BY DATE_TRUNC('month', transaction_date), transaction_type
ORDER BY month DESC, transaction_type;

-- 11. Criar view para recebíveis vencidos
CREATE VIEW overdue_receivables AS
SELECT 
    r.*,
    c.name as client_name,
    c.phone as client_phone,
    c.email as client_email,
    CURRENT_DATE - r.due_date as days_overdue
FROM receivables r
JOIN clients c ON r.client_id = c.id
WHERE r.status = 'Pendente' 
AND r.due_date < CURRENT_DATE
ORDER BY r.due_date ASC;

-- 12. Comentários nas tabelas
COMMENT ON TABLE receivables IS 'Tabela de recebíveis gerados a partir das locações';
COMMENT ON TABLE financial_transactions IS 'Tabela de transações financeiras (receitas e despesas)';
COMMENT ON TABLE accounts IS 'Tabela de contas bancárias e caixas da empresa';

COMMENT ON COLUMN receivables.rental_id IS 'Referência à locação que gerou o recebível';
COMMENT ON COLUMN receivables.amount IS 'Valor do recebível';
COMMENT ON COLUMN receivables.due_date IS 'Data de vencimento do recebível';
COMMENT ON COLUMN receivables.payment_date IS 'Data efetiva do pagamento';
COMMENT ON COLUMN receivables.destination_account_id IS 'Conta onde o pagamento foi recebido';

COMMENT ON COLUMN financial_transactions.receivable_id IS 'Referência ao recebível relacionado (se aplicável)';
COMMENT ON COLUMN financial_transactions.amount IS 'Valor da transação';
COMMENT ON COLUMN financial_transactions.transaction_date IS 'Data da transação';

-- =====================================================
-- FIM DO SCRIPT
-- ===================================================== 