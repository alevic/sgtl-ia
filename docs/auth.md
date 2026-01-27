# Autenticação e Integração do Portal do Cliente

Este documento descreve a arquitetura de autenticação do SGTL, com foco na integração dos usuários do Portal do Cliente.

## 1. Visão Geral
Utilizamos a biblioteca **Better Auth** para gerenciar sessões, tokens e credenciais. O sistema suporta dois tipos principais de usuários:
1.  **Usuários Internos** (Painel Administrativo): Roles `admin`, `operacional`, `financeiro`.
2.  **Usuários Externos** (Portal do Cliente): Role `client`.

## 2. Estrutura de Dados

### Tabela `user` (Auth)
Armazena as credenciais de acesso e informações básicas de login.
-   **`id`**: UUID gerado pelo Better Auth.
-   **`role`**: Define o nível de permissão (ex: `'client'` para usuários do portal).
-   **`username`**: Identificador único (pode ser usado para login).

### Tabela `clients` (Perfil de Negócio)
Armazena os dados do cliente para fins de CRM, reservas e financeiro.
-   **`id`**: UUID interno do cliente.
-   **`user_id`**: Chave estrangeira ligando ao registro na tabela `user`.
-   **Relacionamento**: 1:1 entre `user` (role='client') e `clients`.

> **Nota:** A existência de uma coluna `user_id` na tabela `clients` é o vínculo oficial que permite a um usuário logado acessar seus dados de reservas e histórico.

## 3. Fluxos de Autenticação do Cliente

### Cadastro (`Sign Up`)
*   **Endpoint:** `POST /api/public/client/signup`
*   **Processo:**
    1.  Cria usuário no Better Auth (Email/Senha).
    2.  Define `role = 'client'`.
    3.  Cria registro correspondente na tabela `clients` com os dados pessoais/empresariais (CPF/CNPJ).
    4.  Vincula ambos através do `user_id`.

### Login
*   **Endpoint:** `POST /api/public/client/login`
*   **Diferenciais:**
    *   Suporta login por **Email**, **Username** ou **CPF**.
    *   Internamente resolve o identificador para o email correto antes de autenticar via Better Auth.

## 4. Segurança e Middleware

### `clientAuthorize`
Existe um middleware específico para proteger rotas do Portal do Cliente.
*   **Localização:** `server/middleware.ts`
*   **Função:**
    *   Verifica se a sessão é válida.
    *   Permite acesso **sem** exigir um `activeOrganizationId` (pois clientes podem não pertencer a uma organização interna do sistema multi-tenant).
    *   Valida a role `'client'`.
