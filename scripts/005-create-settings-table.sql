-- 005-create-settings-table.sql

-- Tabela para armazenar as configurações da empresa (garantida como linha única)
CREATE TABLE company_settings (
  id INT PRIMARY KEY DEFAULT 1,
  company_name VARCHAR(255),
  cnpj VARCHAR(20),
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row_check CHECK (id = 1)
);

-- Aplicar o trigger existente para atualizar o campo updated_at
CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON company_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Inserir a linha de configuração inicial com valores padrão
-- ON CONFLICT (id) DO NOTHING garante que isso não causará erro se a linha já existir.
INSERT INTO company_settings (id, company_name, cnpj, address, phone, email, website)
VALUES (1, 'Nome da Sua Empresa', '00.000.000/0001-00', 'Seu Endereço Completo', '(00) 00000-0000', 'contato@suaempresa.com', 'www.suaempresa.com')
ON CONFLICT (id) DO NOTHING;
