## Visão Geral do Projeto (Resumo Técnico)

### Principais Tecnologias Utilizadas

*   **Framework Full-Stack:** **Next.js (com App Router)** - Estrutura principal da aplicação, renderizando componentes no servidor e no cliente.
*   **Linguagem:** **TypeScript** - Adiciona tipagem estática ao JavaScript, garantindo mais segurança e clareza no código.
*   **Backend e Banco de Dados:** **Supabase** - Usado como a plataforma de "Backend as a Service". Ele fornece:
    *   Um banco de dados **PostgreSQL** para armazenar todos os dados.
    *   APIs auto-geradas para interagir com o banco de dados.
    *   Autenticação (embora ainda não tenhamos trabalhado nela).
*   **Estilização:** **Tailwind CSS** - Framework de CSS "utility-first" para criar o design da interface de forma rápida e consistente.
*   **Componentes de UI:** **shadcn/ui** - Uma coleção de componentes de interface (Botões, Cards, Tabelas, etc.) construídos sobre o Tailwind CSS, o que garante um visual moderno e coeso.
*   **Gerenciamento de Datas e Fuso Horário:** **date-fns** e **date-fns-tz** - Bibliotecas para manipular, formatar e, crucialmente, gerenciar datas e fusos horários de forma robusta e consistente.
*   **Gerenciador de Pacotes:** **pnpm** - Gerenciador de pacotes Node.js, utilizado para instalar e gerenciar as dependências do projeto.

### Lógica e Arquitetura do Projeto

A lógica do sistema é organizada em torno de um fluxo claro de gerenciamento de locações de equipamentos.

1.  **Estrutura de Arquivos Chave:**
    *   `app/`: Contém as rotas e as páginas da aplicação (ex: `/orcamentos`, `/locacoes`, `/agenda`). Cada pasta corresponde a uma URL.
    *   `components/`: Armazena componentes React reutilizáveis. A subpasta `ui/` contém os componentes base do `shadcn/ui`.
    *   `lib/database/`: Camada de acesso aos dados. Contém funções que abstraem as chamadas ao Supabase (ex: `getBudgets`, `createRental`). **Esta é a única parte do código que fala diretamente com o banco de dados.**
    *   `lib/utils/`: Funções utilitárias, como os `data-transformers.ts` que corrigimos para converter dados entre o formato do banco e o formato do frontend.
    *   `scripts/`: Contém os scripts SQL para criar o esquema do banco de dados (`001-create-tables.sql`) e popular com dados iniciais.

2.  **Entidades Principais (Tabelas no Banco):**
    *   `clients`: Clientes que solicitam os orçamentos.
    *   `equipments`: Equipamentos disponíveis para locação.
    *   `budgets`: Orçamentos gerados para os clientes.
    *   `rentals`: Locações/Contratos que são criados a partir de orçamentos aprovados.
    *   `logistics_events` (inferido da `lib/database/agenda.ts`): Eventos de logística (instalação e retirada) que alimentam a agenda.

3.  **Fluxo Principal: Orçamento -> Locação -> Agenda**
    *   **Criação do Orçamento:** Um usuário cria um `budget` (orçamento) para um `client`, adicionando `equipments` e definindo um período. O orçamento é salvo no banco com o status **"Pendente"**.
    *   **Aprovação do Orçamento:** Ao aprovar um orçamento:
        1.  O status do `budget` original é alterado para **"Aprovado"** (esta foi a nossa primeira refatoração).
        2.  Um novo registro é criado na tabela `rentals` (locações), copiando as informações relevantes do orçamento.
        3.  Com base nas datas de início e fim da `rental`, dois eventos são criados para a agenda: um de "instalação" e um de "retirada".
    *   **Visualização na Agenda:** A página `/agenda` lê os eventos de logística e os exibe em um calendário, permitindo que a equipe de operações veja as instalações e retiradas de cada dia.
    