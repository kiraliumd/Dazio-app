-- Índices para melhorar performance das consultas

-- Índices para clientes
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients USING gin(to_tsvector('portuguese', name));
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_document ON clients(document_number);
CREATE INDEX IF NOT EXISTS idx_clients_document_type ON clients(document_type);

-- Índices para equipamentos
CREATE INDEX IF NOT EXISTS idx_equipments_name ON equipments USING gin(to_tsvector('portuguese', name));
CREATE INDEX IF NOT EXISTS idx_equipments_category ON equipments(category);
CREATE INDEX IF NOT EXISTS idx_equipments_status ON equipments(status);

-- Índices para orçamentos
CREATE INDEX IF NOT EXISTS idx_budgets_client_id ON budgets(client_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);
CREATE INDEX IF NOT EXISTS idx_budgets_dates ON budgets(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_budgets_created_at ON budgets(created_at);

-- Índices para locações
CREATE INDEX IF NOT EXISTS idx_rentals_client_id ON rentals(client_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
CREATE INDEX IF NOT EXISTS idx_rentals_dates ON rentals(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_rentals_budget_id ON rentals(budget_id);

-- Índices para itens
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_rental_items_rental_id ON rental_items(rental_id);
