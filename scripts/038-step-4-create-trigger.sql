-- PASSO 4: Criar trigger para updated_at
-- Execute este comando após o passo 3

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rental_logistics_events_updated_at 
    BEFORE UPDATE ON rental_logistics_events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 