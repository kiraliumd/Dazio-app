-- Criar tabela de categorias de equipamentos
CREATE TABLE IF NOT EXISTS equipment_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Cor padrão azul
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca por nome
CREATE INDEX IF NOT EXISTS idx_equipment_categories_name ON equipment_categories(name);

-- Inserir algumas categorias padrão
INSERT INTO equipment_categories (name, description) VALUES
    ('Som e Áudio', 'Equipamentos de som, caixas, microfones, etc.'),
    ('Iluminação', 'Refletores, spots, luzes de palco, etc.'),
    ('Estrutura', 'Palcos, estruturas metálicas, etc.'),
    ('Multimídia', 'Projetores, telas, TVs, etc.'),
    ('Mobiliário', 'Cadeiras, mesas, estantes, etc.'),
    ('Decoração', 'Banners, faixas, decorações, etc.')
ON CONFLICT (name) DO NOTHING;

-- Adicionar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_equipment_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_equipment_categories_updated_at
    BEFORE UPDATE ON equipment_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_equipment_categories_updated_at(); 