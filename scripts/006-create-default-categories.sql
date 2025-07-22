-- Script para criar categorias padrão financeiras
-- Categorias de Receita
INSERT INTO financial_categories (name, type, active) VALUES
('Vendas de Produtos', 'receita', true),
('Prestação de Serviços', 'receita', true),
('Aluguel de Equipamentos', 'receita', true),
('Comissões', 'receita', true),
('Juros e Rendimentos', 'receita', true),
('Outras Receitas', 'receita', true)
ON CONFLICT (name, type) DO NOTHING;

-- Categorias de Despesa
INSERT INTO financial_categories (name, type, active) VALUES
('Aluguel', 'despesa', true),
('Contas de Luz', 'despesa', true),
('Contas de Água', 'despesa', true),
('Internet e Telefone', 'despesa', true),
('Combustível', 'despesa', true),
('Manutenção de Equipamentos', 'despesa', true),
('Material de Escritório', 'despesa', true),
('Salários', 'despesa', true),
('Impostos', 'despesa', true),
('Seguros', 'despesa', true),
('Marketing e Publicidade', 'despesa', true),
('Transporte', 'despesa', true),
('Alimentação', 'despesa', true),
('Outras Despesas', 'despesa', true)
ON CONFLICT (name, type) DO NOTHING;

-- Categoria de Transferência
INSERT INTO financial_categories (name, type, active) VALUES
('Transferência entre Contas', 'transferencia', true)
ON CONFLICT (name, type) DO NOTHING; 