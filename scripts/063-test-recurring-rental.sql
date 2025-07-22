-- Teste de inserção de locação recorrente diretamente no banco

-- 1. Inserir uma locação recorrente de teste
INSERT INTO rentals (
    client_id,
    client_name,
    start_date,
    end_date,
    installation_date,
    removal_date,
    installation_time,
    removal_time,
    installation_location,
    total_value,
    discount,
    final_value,
    status,
    observations,
    
    -- Campos de recorrência
    is_recurring,
    recurrence_type,
    recurrence_interval,
    recurrence_end_date,
    recurrence_status,
    parent_rental_id,
    next_occurrence_date
) VALUES (
    'test-client-id',
    'Cliente Teste Recorrente',
    '2024-01-01',
    '2024-01-31',
    '2024-01-01',
    '2024-01-31',
    '08:00',
    '18:00',
    'Local de Teste',
    1000.00,
    0.00,
    1000.00,
    'Instalação Pendente',
    'Locação de teste para recorrência',
    
    -- Campos de recorrência
    true,
    'monthly',
    1,
    '2024-12-31',
    'active',
    NULL,
    '2024-02-01'
);

-- 2. Verificar se foi inserida corretamente
SELECT 'LOCAÇÃO DE TESTE INSERIDA:' as info;
SELECT 
    id,
    client_name,
    start_date,
    end_date,
    is_recurring,
    recurrence_type,
    recurrence_interval,
    recurrence_status,
    recurrence_end_date,
    next_occurrence_date,
    created_at
FROM rentals 
WHERE client_name = 'Cliente Teste Recorrente'
ORDER BY created_at DESC;

-- 3. Verificar se aparece na consulta de locações recorrentes
SELECT 'CONSULTA DE LOCAÇÕES RECORRENTES:' as info;
SELECT 
    id,
    client_name,
    start_date,
    end_date,
    is_recurring,
    recurrence_type,
    recurrence_interval,
    recurrence_status
FROM rentals 
WHERE is_recurring = true
ORDER BY created_at DESC; 