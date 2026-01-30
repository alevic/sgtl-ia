# Guia de Otimização do PRD para Desenvolvimento com LLMs

Este documento responde à sua solicitação sobre como preparar o PRD do SGTL v2.1 para ser utilizado eficientemente dentro de uma IDE com LLM (como Cursor, Windsurf, ou VS Code com Copilot).

## 1. Estrutura de Contexto para LLM

LLMs funcionam melhor quando o contexto é granular e específico. Ao invés de um único arquivo `PRD.md` gigante, sugiro dividir a documentação na pasta `docs/` da seguinte forma:

### A. `docs/schema.prisma` (ou `.sql`)
A IA entende estruturas de banco de dados muito melhor em código do que em texto. Converta a seção "Modelo de Dados" do seu PRD para um arquivo de schema real (mesmo que você não use Prisma, a sintaxe é excelente para documentação).

**Exemplo:**
```prisma
model Viagem {
  id String @id @default(uuid())
  tituloRoteiro String
  veiculo Veiculo @relation(fields: [veiculoId], references: [id])
  // ...
}
```

### B. `docs/rules.md` (Regras de Negócio)
Isole as regras complexas. Para o SGTL, o cálculo de cancelamento é crítico.
*   Crie um arquivo focado apenas em "Lógica de Cancelamento e Créditos".
*   Use tabelas Markdown para explicar as multas por prazo (ex: < 24h = 100% crédito).

### C. `docs/api_contracts.md`
Defina as interfaces TypeScript de entrada e saída da API.
*   A LLM usará isso para gerar os hooks do React Query (`useViagens`, `useReservas`) com precisão.
*   Veja o arquivo `types.ts` gerado neste projeto: ele serve como essa "fonte de verdade" para o frontend.
*   **Protocolo de Migração:** Sempre que houver alteração no `schema.ts`, adicione as instruções SQL correspondentes no script `server/src/db/setup.ts` para evitar falhas em novos ambientes.
*   **Formatação de Datas:** Utilize sempre o hook `useDateFormatter` para exibir datas. Nunca use `toLocaleDateString()` puro, para respeitar as configurações de idioma e fuso horário do sistema.

## 2. System Prompts Sugeridos

Ao iniciar uma sessão na IDE, utilize um "System Prompt" ou instruções de contexto na raíz:

```markdown
Vocé é um Engenheiro Sênior Fullstack trabalhando no SGTL v2.1.

## Contexto
1.  **Multi-Tenancy:** O app tem dois contextos: 'TURISMO' e 'EXPRESS'. Sempre verifique `currentContext` antes de renderizar menus ou dados.
2.  **Estilo:** Use Tailwind CSS e o padrão "Executive Elite" (Dark/Glassmorphism).
3.  **Stack:** React, Vite, Lucide Icons, Recharts, Radix UI (shadcn).

## Regras de Código
*   Sempre use `PageHeader` para títulos e `DashboardCard` para métricas nas listas/detalhes.
*   Arredondamentos principais: Containers `rounded-[2.5rem]`, Elementos `rounded-2xl`.
*   Altura padrão de botões e inputs de formulário principais: `h-14`.
*   Use as interfaces de `types.ts` e serviços de `services/`.
*   Componentes devem ser funcionais e seguir a estética visual consolidada.
```

## 3. Alterações Sugeridas no PRD Original

Para a IA processar melhor seu documento original:

1.  **Desambiguação de Termos:** No PRD, diferencie explicitamente `ClienteFinal` (Passageiro) de `ClienteCorporativo`.
2.  **Fluxos de Estado:** Descreva transições como `PENDENTE -> PAGO -> CONFIRMADA -> (CANCELADA | FINALIZADA)`.
3.  **Lógica:** Forneça pseudo-código para validações críticas (ex: regras de cancelamento).

## 4. Padrão Visual "Executive Elite" (Design System)

Para manter a consistência premium estabelecida, siga estas diretrizes em todas as novas telas:

### A. Componentes Fundamentais
*   **`PageHeader`**: Use em **todas** as páginas. Parâmetros: `title`, `suffix`, `icon`, `backLink`, `backLabel`.
*   **`DashboardCard`**: Use para KPIs e métricas no topo de páginas de listagem e detalhes.
*   **`Card` & `CardContent`**: Conteúdo sempre dentro de cards com fundo `bg-card/50` e `backdrop-blur-sm`.

### B. Tokens de Design
*   **Arredondamento**: Containers principais `rounded-[2.5rem]`, elementos internos `rounded-2xl`.
*   **Interações**: Altura padrão `h-14` para botões e inputs principais. Fonte `font-bold` em inputs.

### C. Arquétipos de Layout
*   **Listagens**: `PageHeader` -> Grid de `DashboardCard` -> `Card` com Tabela.
*   **Detalhes**: `PageHeader` -> Grid de `DashboardCard` -> `Card` com `Tabs`.
*   **Edição**: `PageHeader` -> Layout em colunas (Principal 2/3, Lateral 1/3) usando `Card`s.

---

**Nota:** O código gerado já segue estas práticas. Consulte `walkthrough_mass_refactor_phase3.md` para as últimas atualizações de UI.