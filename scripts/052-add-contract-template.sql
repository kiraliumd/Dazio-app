-- Adicionar campo de modelo de contrato na tabela company_settings
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS contract_template TEXT DEFAULT 'CONTRATO DE LOCAÇÃO DE EQUIPAMENTOS

CONTRATANTE: {company_name}
CNPJ: {cnpj}
Endereço: {address}
Telefone: {phone}
Email: {email}

CONTRATADO: {client_name}
Documento: {client_document}
Endereço: {client_address}
Telefone: {client_phone}
Email: {client_email}

OBJETO DO CONTRATO:
A locação dos seguintes equipamentos:

{equipment_list}

PERÍODO DE LOCAÇÃO:
Data de início: {start_date}
Data de término: {end_date}
Horário de instalação: {installation_time}
Horário de retirada: {removal_time}

LOCAL DE INSTALAÇÃO:
{installation_location}

VALORES:
Valor total: R$ {total_value}
Desconto: R$ {discount}
Valor final: R$ {final_value}

CONDIÇÕES GERAIS:
1. O contratado se compromete a devolver os equipamentos no estado em que foram recebidos.
2. Qualquer dano ou perda será de responsabilidade do contratado.
3. O pagamento deve ser realizado conforme acordado entre as partes.
4. Este contrato está sujeito às leis brasileiras.

Assinaturas:

_____________________
{company_name}
Contratante

_____________________
{client_name}
Contratado

Data: {contract_date}';

-- Atualizar o registro existente com o template padrão
UPDATE company_settings 
SET contract_template = 'CONTRATO DE LOCAÇÃO DE EQUIPAMENTOS

CONTRATANTE: {company_name}
CNPJ: {cnpj}
Endereço: {address}
Telefone: {phone}
Email: {email}

CONTRATADO: {client_name}
Documento: {client_document}
Endereço: {client_address}
Telefone: {client_phone}
Email: {client_email}

OBJETO DO CONTRATO:
A locação dos seguintes equipamentos:

{equipment_list}

PERÍODO DE LOCAÇÃO:
Data de início: {start_date}
Data de término: {end_date}
Horário de instalação: {installation_time}
Horário de retirada: {removal_time}

LOCAL DE INSTALAÇÃO:
{installation_location}

VALORES:
Valor total: R$ {total_value}
Desconto: R$ {discount}
Valor final: R$ {final_value}

CONDIÇÕES GERAIS:
1. O contratado se compromete a devolver os equipamentos no estado em que foram recebidos.
2. Qualquer dano ou perda será de responsabilidade do contratado.
3. O pagamento deve ser realizado conforme acordado entre as partes.
4. Este contrato está sujeito às leis brasileiras.

Assinaturas:

_____________________
{company_name}
Contratante

_____________________
{client_name}
Contratado

Data: {contract_date}'
WHERE id = 1; 