-- Adicionar coluna de quantidade à tabela equipments
ALTER TABLE equipments 
ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;

-- Adicionar coluna de quantidade alugada (para controle de disponibilidade)
ALTER TABLE equipments 
ADD COLUMN IF NOT EXISTS rented_quantity INTEGER NOT NULL DEFAULT 0;

-- Adicionar coluna de quantidade em manutenção
ALTER TABLE equipments 
ADD COLUMN IF NOT EXISTS maintenance_quantity INTEGER NOT NULL DEFAULT 0;

-- Criar índice para melhorar performance de consultas de disponibilidade
CREATE INDEX IF NOT EXISTS idx_equipments_availability 
ON equipments(name, quantity, rented_quantity, maintenance_quantity);

-- Atualizar equipamentos existentes para ter quantidade 1 se não tiver
UPDATE equipments 
SET quantity = 1, rented_quantity = 0, maintenance_quantity = 0 
WHERE quantity IS NULL OR rented_quantity IS NULL OR maintenance_quantity IS NULL;

-- Criar função para calcular quantidade disponível
CREATE OR REPLACE FUNCTION get_available_quantity(equipment_id UUID)
RETURNS INTEGER AS $$
DECLARE
    available_qty INTEGER;
BEGIN
    SELECT (quantity - rented_quantity - maintenance_quantity) 
    INTO available_qty
    FROM equipments 
    WHERE id = equipment_id;
    
    RETURN COALESCE(available_qty, 0);
END;
$$ LANGUAGE plpgsql;

-- Criar função para verificar se há quantidade suficiente
CREATE OR REPLACE FUNCTION check_equipment_availability(equipment_name TEXT, required_qty INTEGER, start_date DATE, end_date DATE)
RETURNS BOOLEAN AS $$
DECLARE
    total_available INTEGER;
    currently_rented INTEGER;
BEGIN
    -- Buscar quantidade total disponível do equipamento
    SELECT (quantity - rented_quantity - maintenance_quantity) 
    INTO total_available
    FROM equipments 
    WHERE name = equipment_name;
    
    -- Se não encontrou o equipamento, retorna false
    IF total_available IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Calcular quantidade já alugada no período
    SELECT COALESCE(SUM(ri.quantity), 0)
    INTO currently_rented
    FROM rental_items ri
    JOIN rentals r ON ri.rental_id = r.id
    WHERE ri.equipment_name = equipment_name
    AND r.status IN ('Instalação Pendente', 'Ativo')
    AND (
        (r.start_date <= end_date AND r.end_date >= start_date) OR
        (r.start_date >= start_date AND r.start_date <= end_date) OR
        (r.end_date >= start_date AND r.end_date <= end_date)
    );
    
    -- Verificar se há quantidade suficiente
    RETURN (total_available - currently_rented) >= required_qty;
END;
$$ LANGUAGE plpgsql; 