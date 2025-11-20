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

## 2. System Prompts Sugeridos

Ao iniciar uma sessão na IDE, utilize um "System Prompt" ou arquivo `.cursorrules` na raiz:

```markdown
# .cursorrules

Vocé é um Engenheiro Sênior Fullstack trabalhando no SGTL v2.1.

## Contexto
1.  **Multi-Tenancy:** O app tem dois contextos: 'TURISMO' e 'EXPRESS'. Sempre verifique `currentContext` antes de renderizar menus ou dados.
2.  **Estilo:** Use Tailwind CSS. Cores: Blue para Turismo, Orange para Express.
3.  **Stack:** React, Vite, Lucide Icons, Recharts.

## Regras de Código
*   Sempre use interfaces do arquivo `types.ts`.
*   Não invente dados, use os mocks em `services/api.ts`.
*   Componentes devem ser pequenos e funcionais.
```

## 3. Alterações Sugeridas no PRD Original

Para a IA processar melhor seu documento original:

1.  **Desambiguação de Termos:** O termo "Cliente" é usado tanto para o passageiro B2C quanto para a empresa contratante B2B.
    *   *Sugestão:* No PRD, diferencie explicitamente `ClienteFinal` (Passageiro) de `ClienteCorporativo` (Fretamento).
2.  **Fluxos de Estado Explícitos:**
    *   Descreva as transições de status da Reserva como uma máquina de estados: `PENDENTE -> PAGO -> CONFIRMADA -> (CANCELADA | FINALIZADA)`. Isso ajuda a IA a evitar transições ilegais no código.
3.  **Validações em Pseudo-código:**
    *   Na seção de endpoints, ao invés de apenas texto ("Verificar se assento está livre"), forneça um pequeno pseudo-código da lógica. A IA traduzirá isso para Python/JS perfeitamente.

---

**Nota:** O código gerado neste projeto já segue estas práticas, utilizando `types.ts` como contrato central e separando contextos visualmente.