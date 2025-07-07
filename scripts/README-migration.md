# Migração de Colunas de Data

## Problema Identificado

As colunas `start_date` e `end_date` nas tabelas `budgets` e `rentals` estavam definidas como `DATE`, mas o sistema precisa trabalhar com timestamps para lidar corretamente com timezones.

## Solução

### 1. Aplicar a Migração (Para bancos existentes)

Execute o script de migração:

```sql
-- Execute este script no seu banco de dados
\i scripts/006-fix-date-columns.sql
```

Ou execute diretamente no seu cliente SQL:

```sql
-- Alterar colunas na tabela budgets
ALTER TABLE budgets 
ALTER COLUMN start_date TYPE TIMESTAMP WITH TIME ZONE USING start_date::TIMESTAMP WITH TIME ZONE,
ALTER COLUMN end_date TYPE TIMESTAMP WITH TIME ZONE USING end_date::TIMESTAMP WITH TIME ZONE;

-- Alterar colunas na tabela rentals
ALTER TABLE rentals 
ALTER COLUMN start_date TYPE TIMESTAMP WITH TIME ZONE USING start_date::TIMESTAMP WITH TIME ZONE,
ALTER COLUMN end_date TYPE TIMESTAMP WITH TIME ZONE USING end_date::TIMESTAMP WITH TIME ZONE;
```

### 2. Novas Instalações

Para novas instalações, o script `001-create-tables.sql` já foi atualizado com os tipos corretos.

## Benefícios da Correção

- ✅ **Resolve problemas de timezone**: As datas agora são armazenadas com timezone
- ✅ **Elimina gambiarras no código**: Não precisamos mais adicionar dias artificialmente
- ✅ **Consistência**: Todas as datas seguem o mesmo padrão
- ✅ **Precisão**: Horários são preservados corretamente

## Impacto

- **Dados existentes**: Serão convertidos automaticamente
- **Aplicação**: Funcionará normalmente após a migração
- **Performance**: Sem impacto significativo

## Verificação

Após a migração, verifique se as colunas foram alteradas:

```sql
\d budgets
\d rentals
```

As colunas `start_date` e `end_date` devem aparecer como `timestamp with time zone`. 