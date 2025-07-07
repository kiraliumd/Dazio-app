-- PASSO 3: Criar índices para performance
-- Execute este comando após o passo 2

CREATE INDEX idx_rental_logistics_events_rental_id ON rental_logistics_events(rental_id);
CREATE INDEX idx_rental_logistics_events_event_date ON rental_logistics_events(event_date);
CREATE INDEX idx_rental_logistics_events_status ON rental_logistics_events(status); 