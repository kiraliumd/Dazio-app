-- Teste simples para verificar eventos
SELECT 'Testando tabela de eventos...' as info;

-- Verificar se a tabela existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'rental_logistics_events'
) as tabela_existe;

-- Contar total de eventos
SELECT COUNT(*) as total_eventos 
FROM rental_logistics_events;

-- Verificar eventos dos próximos 7 dias
SELECT COUNT(*) as eventos_proximos_7_dias
FROM rental_logistics_events 
WHERE event_date >= CURRENT_DATE 
  AND event_date <= CURRENT_DATE + INTERVAL '7 days'
  AND status = 'Agendado';

-- Verificar alguns eventos de exemplo
SELECT 
    event_type,
    event_date,
    status,
    created_at
FROM rental_logistics_events 
ORDER BY created_at DESC 
LIMIT 5; 