-- Inserir dados iniciais para demonstração

-- Inserir clientes
INSERT INTO clients (id, name, phone, email, document_type, document_number, observations) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Maria Silva Santos', '(11) 99999-1234', 'maria.silva@email.com', 'CPF', '123.456.789-01', 'Cliente VIP - Organiza eventos corporativos'),
('550e8400-e29b-41d4-a716-446655440002', 'João Pedro Oliveira', '(11) 98888-5678', 'joao.pedro@email.com', 'CPF', '987.654.321-09', 'Prefere equipamentos de áudio premium'),
('550e8400-e29b-41d4-a716-446655440003', 'Eventos & Cia Ltda', '(11) 3333-4444', 'contato@eventosecia.com.br', 'CNPJ', '12.345.678/0001-90', 'Empresa parceira - Desconto de 10%'),
('550e8400-e29b-41d4-a716-446655440004', 'Ana Costa Ferreira', '(11) 97777-9999', 'ana.costa@email.com', 'CPF', '456.789.123-45', 'Especializada em casamentos'),
('550e8400-e29b-41d4-a716-446655440005', 'Tech Solutions Corp', '(11) 2222-3333', 'eventos@techsolutions.com', 'CNPJ', '98.765.432/0001-10', 'Eventos corporativos mensais'),
('550e8400-e29b-41d4-a716-446655440006', 'Carlos Eduardo Lima', '(11) 96666-7777', 'carlos.lima@email.com', 'CPF', '789.123.456-78', 'Cliente desde 2020');

-- Inserir equipamentos
INSERT INTO equipments (id, name, category, description, daily_rate, status) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Mesa de Som Yamaha MG16XU', 'Áudio', 'Mesa de som analógica 16 canais com efeitos digitais', 150.00, 'Disponível'),
('660e8400-e29b-41d4-a716-446655440002', 'Projetor Epson 5000 Lumens', 'Vídeo', 'Projetor Full HD para eventos corporativos', 200.00, 'Alugado'),
('660e8400-e29b-41d4-a716-446655440003', 'Kit Iluminação LED RGB', 'Iluminação', 'Kit com 8 refletores LED RGB com controle DMX', 300.00, 'Disponível'),
('660e8400-e29b-41d4-a716-446655440004', 'Tenda 10x10m', 'Estrutura', 'Tenda branca para eventos ao ar livre', 250.00, 'Manutenção'),
('660e8400-e29b-41d4-a716-446655440005', 'Arranjo Floral Premium', 'Decoração', 'Arranjo com flores naturais para mesa principal', 80.00, 'Disponível'),
('660e8400-e29b-41d4-a716-446655440006', 'Caixa de Som JBL SRX815P', 'Áudio', 'Caixa ativa 15 polegadas 2000W', 120.00, 'Alugado'),
('660e8400-e29b-41d4-a716-446655440007', 'Telão 3x2m', 'Vídeo', 'Telão de projeção com tripé', 100.00, 'Disponível'),
('660e8400-e29b-41d4-a716-446655440008', 'Moving Head LED', 'Iluminação', 'Moving head com LED 60W e gobo', 180.00, 'Manutenção'),
('660e8400-e29b-41d4-a716-446655440009', 'Microfone Sem Fio', 'Áudio', 'Microfone sem fio profissional', 50.00, 'Disponível'),
('660e8400-e29b-41d4-a716-446655440010', 'Cadeira Tiffany', 'Estrutura', 'Cadeira transparente para eventos', 8.00, 'Disponível');

-- Inserir orçamentos de exemplo
INSERT INTO budgets (id, number, client_id, client_name, start_date, end_date, installation_time, removal_time, installation_location, subtotal, discount, total_value, status, observations) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'ORC-2024-001', '550e8400-e29b-41d4-a716-446655440001', 'Maria Silva Santos', '2024-12-15', '2024-12-16', '08:00', '22:00', 'Salão de Festas Villa Real', 1500.00, 0.00, 1500.00, 'Pendente', 'Evento corporativo - necessário entrega até 15h'),
('770e8400-e29b-41d4-a716-446655440002', 'ORC-2024-002', '550e8400-e29b-41d4-a716-446655440002', 'João Pedro Oliveira', '2024-12-20', '2024-12-20', '16:00', '23:00', 'Residência do Cliente', 480.00, 0.00, 480.00, 'Pendente', 'Festa de aniversário - som ambiente');

-- Inserir itens dos orçamentos
INSERT INTO budget_items (budget_id, equipment_name, quantity, daily_rate, days, total) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'Mesa de Som Yamaha MG16XU', 1, 150.00, 2, 300.00),
('770e8400-e29b-41d4-a716-446655440001', 'Kit Iluminação LED RGB', 2, 300.00, 2, 1200.00),
('770e8400-e29b-41d4-a716-446655440002', 'Caixa de Som JBL SRX815P', 4, 120.00, 1, 480.00);

-- Inserir locações de exemplo
INSERT INTO rentals (id, client_id, client_name, start_date, end_date, installation_time, removal_time, installation_location, total_value, discount, final_value, status, observations) VALUES
('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'Eventos & Cia Ltda', '2024-12-12', '2024-12-14', '14:00', '18:00', 'Espaço de Eventos Golden', 1350.00, 135.00, 1215.00, 'Ativo', 'Cliente parceiro - aplicado desconto de 10%'),
('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'João Pedro Oliveira', '2024-12-08', '2024-12-08', '16:00', '23:00', 'Residência do Cliente', 480.00, 0.00, 480.00, 'Concluído', 'Festa de aniversário - som ambiente');

-- Inserir itens das locações
INSERT INTO rental_items (rental_id, equipment_name, quantity, daily_rate, days, total) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'Projetor Epson 5000 Lumens', 1, 200.00, 3, 600.00),
('880e8400-e29b-41d4-a716-446655440001', 'Tenda 10x10m', 1, 250.00, 3, 750.00),
('880e8400-e29b-41d4-a716-446655440002', 'Caixa de Som JBL SRX815P', 4, 120.00, 1, 480.00);
