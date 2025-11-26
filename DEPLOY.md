# Guia de Deploy e CI/CD

Este projeto está configurado para um fluxo de trabalho moderno com Docker, GitHub Actions e Coolify.

## Estrutura de Branches

Utilizamos uma estratégia simplificada baseada em dois ambientes:

*   **`develop` (Ambiente de Desenvolvimento)**:
    *   Todo código novo deve ser mergeado aqui primeiro via Pull Request.
    *   **Deploy Automático**: O Coolify deve estar configurado para observar esta branch e fazer deploy automático no ambiente de "Staging/Dev".
    *   **Objetivo**: Testar novas features em um ambiente similar ao de produção.

*   **`main` (Ambiente de Produção)**:
    *   Apenas código estável e testado em `develop` deve vir para cá.
    *   **Deploy Automático**: O Coolify observa esta branch e atualiza a produção.
    *   **Objetivo**: Ambiente estável para os usuários finais.

## Configuração Local (Docker Desktop + WSL)

Para rodar o projeto localmente com todo o stack (App + Banco de Dados):

1.  Certifique-se de que o Docker Desktop está rodando.
2.  No terminal (WSL), execute:
    ```bash
    docker-compose up -d
    ```
3.  Acesse:
    *   App: `http://localhost:8080`
    *   Banco de Dados: `localhost:5432`

## Configuração no Coolify

1.  **Criar Recurso**: Selecione "Application" -> "From Git Repository".
2.  **Repositório**: Conecte seu GitHub/GitLab e selecione este repositório.
3.  **Branch**:
    *   Para o app de **Produção**, escolha `main`.
    *   Para o app de **Dev**, escolha `develop`.
4.  **Build Pack**: O Coolify deve detectar automaticamente o `Dockerfile`.
5.  **Variáveis de Ambiente**:
    *   Adicione `GEMINI_API_KEY` e outras variáveis necessárias na aba "Environment Variables".
6.  **Banco de Dados**:
    *   No Coolify, crie um recurso de Banco de Dados (PostgreSQL).
    *   Conecte a aplicação ao banco usando as variáveis de ambiente internas do Coolify (`DATABASE_URL`, etc).

## GitHub Actions (CI)

O arquivo `.github/workflows/ci.yml` garante que:
1.  Toda vez que você fizer push para `main` ou `develop`.
2.  O GitHub irá baixar o código, instalar dependências e tentar fazer o build.
3.  Se o build falhar, você receberá um alerta e não deve fazer o merge.
