-- PASSO 2: Criar nova tabela com estrutura simplificada
-- Execute este comando após o passo 1

CREATE TABLE rental_logistics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('Instalação', 'Retirada')),
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'Agendado' CHECK (status IN ('Agendado', 'Em andamento', 'Concluído', 'Cancelado')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
); 