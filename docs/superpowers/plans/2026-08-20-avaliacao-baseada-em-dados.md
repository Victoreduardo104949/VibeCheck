# Avaliação Baseada em Dados (VibeCheck Pro) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar o Diagnóstico Pro (ghostingScore, red/green flags, conselho) fiel aos fatos da conversa, usando métricas calculadas no código + prompt enriquecido com dados medidos e citações literais.

**Architecture:** `utils/metrics.ts` calcula métricas determinísticas sobre TODAS as mensagens A/B (latência de resposta por round, inícios após pausa ≥24h, vácuo final, volume, perguntas, emojis, streaks/gaps), com citações literais reais. `formatMetricsBlock()` gera um bloco "DADOS MEDIDOS" em PT-BR injetado no prompt do Gemini; o LLM deriva os scores dos dados em vez de chutar. Schema ganha `evidence` (justificativa factual por pessoa), exibida no relatório.

**Tech Stack:** TypeScript, Vitest (novo, para testes), Vite, @google/genai (modelo `gemini-3-flash-preview`).

**Spec:** Decidido em brainstorming (Abordagem A — métricas locais + prompt enriquecido, 1 chamada de API). Aprovado pelo usuário em 2026-08-20.

## Global Constraints

- Sem git: nenhum commit deve ser executado (projeto baixado como ZIP, Git não instalado).
- Uma única chamada de API por análise (não aumentar custo/latência).
- `DatingAnalysisResult` deve permanecer compatível com `App.tsx` (campos novos são opcionais).
- Texto do bloco de dados e do prompt em PT-BR.
- Participantes considerados: os 2 primeiros de `participants`; mensagens `isSystem` e conteúdo vazio são ignorados nas métricas.
- Citações literais: trecho real truncado a ~120 caracteres, sem aspas internas conflitantes.

---

## Arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `package.json` | Modificar | Script `test` + devDependency `vitest` |
| `tests/fixtures/chat.ts` | Criar | Conversa sintética Ana/Bruno com datas explícitas |
| `tests/metrics.test.ts` | Criar | Testes TDD das métricas e do formatter |
| `utils/metrics.ts` | Criar | Cálculo puro de métricas + `formatMetricsBlock()` |
| `types.ts` | Modificar | `evidence?: string` em `ghostingScore.userA/userB` |
| `services/geminiService.ts` | Modificar | Injetar bloco no prompt; `evidence` no schema |
| `App.tsx` | Modificar | Exibir `evidence` sob cada barra de ghosting |

---

### Task 1: Setup Vitest + fixture de teste

**Files:**
- Modify: `package.json`
- Create: `tests/fixtures/chat.ts`

**Interfaces:**
- Produces: `ANABRUNO_CHAT` (ChatData importável de `../types.ts`), usado por Tasks 2 e 3.

**Fixture (tests/fixtures/chat.ts):** conversa de 2 participantes com datas controladas (base: 2026-08-01):

| # | Autor | Data/hora | Conteúdo |
|---|---|---|---|
| 0 | Ana | 10:00 | "oi amor, tudo bem?" |
| 1 | Bruno | 10:05 | "tudo ótimo e você? 😊" |
| 2 | Ana | 10:12 | "melhor agora que você respondeu hehe" |
| 3 | Bruno | 10:12 | "sempre tento responder rápido 😄" |
| 4 | Ana | 13:00 | "que tal jantar hoje?" |
| 5 | Bruno | 16:00 | "topo! 20h no sushi?" |
| 6 | Ana | 16:02 | "fechou ❤️" |
| 7 | (system) | 20:00 | "Mensagens alteradas" |
| 8 | Bruno | 21:00 | "cheguei, vamos entrar?" |
| 9 | Ana | 21:30 | "claro, já desço 😘" |
| 10 | Bruno | 2026-08-03 09:00 | "bom dia, saudade de ontem" |
| 11 | Ana | 09:10 | "bom dia! eu também 😍" |
| 12 | Bruno | 09:15 | "" (anexo emoji, conteúdo vazio) |
| 13 | Bruno | 09:20 | "olha a foto que tirei" |
| 14 | Ana | 09:22 | "que foto linda!" |
| 15 | Bruno | 2026-08-04 08:00 | "vc vai no aniversário do João?" |
| 16 | Ana | 2026-08-06 12:00 | "foi mal a demora, tava viajando" |
| 17 | Bruno | 12:30 | "sem problema, me conta da viagem!" |
| 18 | Ana | 13:00 | "foi ótima, muita praia e sol ☀️" |

Esperados (verificação manual):
- Rounds: Ana(0), Bruno(1), Ana(2), Bruno(3), Ana(4), Bruno(5), Ana(6), [system], Bruno(8), Ana(9), Bruno(10), Ana(11), Bruno(12,13), Ana(14), Bruno(15), Ana(16), Bruno(17), Ana(18)
- Mensagens A: 9 (0,2,4,6,9,11,14,16,18); B: 9 (1,3,5,8,10,12,13,15,17); system: 1
- Latências B→? Ver Task 2. Pausa >24h: entre 9 (21:30 dia 1) e 10 (09:00 dia 3) = autor do início do round: Bruno
- Vácuo final: última msg Ana(18) 13:00 dia 6 (não respondida)
- Perguntas: msg 0 (Ana "?"), msg 10 (Bruno "?"), msg 15 (Bruno "?") = Ana 1, Bruno 2
- Emojis: B(1)😊, B(3)😄, A(6)❤️, A(9)😘, A(11)😍, A(18)☀️ → Ana 4, Bruno 2

- [ ] **Step 1: Adicionar vitest e script test em `package.json`**

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest run"
}
```
devDependencies: `"vitest": "^3.0.0"`.

- [ ] **Step 2: Instalar**

Run: `npm install`
Expected: vitest presente em `node_modules`.

- [ ] **Step 3: Criar `tests/fixtures/chat.ts`** com o ChatData acima (mensagem 12 com `content: ""`, mensagem 7 com `isSystem: true`).

- [ ] **Step 4: Sanidade — criar `tests/smoke.test.ts`** com `import { ANABRUNO_CHAT } from './fixtures/chat'; it('has 19 messages', () => expect(ANABRUNO_CHAT.messages).toHaveLength(19))`.

Run: `npm test`
Expected: PASS.

---

### Task 2: `utils/metrics.ts` — núcleo (TDD)

**Files:**
- Create: `utils/metrics.ts`
- Test: `tests/metrics.test.ts`

**Interfaces:**
- Consumes: `Message`, `ChatData` de `../types.ts`; `ANABRUNO_CHAT` da Task 1.
- Produces:
  - `interface PersonMetrics { name: string; messageCount: number; totalChars: number; avgChars: number; longestMessage: string; questions: number; emojis: number; responseRate: number; avgResponseMin: number; medianResponseMin: number; initiations: number }`
  - `interface ConversationMetrics { participantA: PersonMetrics; participantB: PersonMetrics; lastMessageAuthor: string; lastMessageLagHours: number; activeDays: number; longestStreakDays: number; longestSilenceDays: number; pausesOver48h: number; citations: { conversationStart: string; conversationEnd: string; longestSilenceBreak?: string } }`
  - `computeMetrics(chat: ChatData): ConversationMetrics`
  - `formatMetricsBlock(m: ConversationMetrics): string`

Definições (fixas, para os testes):
- **Round:** sequência máxima de mensagens do mesmo autor (ignora system). `roundStart` = primeira msg do round; `roundEnd` = última msg do round.
- **Latência de um round X:** `roundEnd.date → proximo round Y.roundStart.date` (só se houve round seguinte e dif > 0).
- `avgResponseMin`: média das latências dos rounds do autor; `medianResponseMin`: mediana (ordenar, valor do meio se ímpar, média dos 2 do meio se par).
- `responseRate`: nº de rounds do autor que receberam resposta (latência calculada) / nº total de rounds do autor. Rotundos sem round seguinte não contam como "sem resposta" (o vácuo é do autor que TAMBÉM não respondeu... na real: round do autor X sem round seguinte = X tem a última palavra; esse round não é contabilizado no denominador).
- `initiations`: rounds do autor cuja `roundStart` ocorre ≥24h (1440min) após a msg anterior de qualquer autor (ou a 1ª mensagem da conversa, se do autor).
- **Vácuo:** última msg não-system da conversa → `lastMessageAuthor`, `lastMessageLagHours` = horas desde a msg anterior (dif/3600000, 1 casa).
- **Dias ativos:** nº de dias distintos (YYYY-MM-DD local) com ≥1 msg não-system de A ou B.
- `longestStreakDays`: maior número de dias consecutivos com troca (cada dia com ≥1 msg de cada autor) — hoje apenas; sequência mais longa.
- `longestSilenceDays`: maior gap em dias entre msg N e N+1 (floor(dif/86400000)) — incluindo gaps >1.
- `pausesOver48h`: contagem de gaps >48h.
- `citations.conversationStart/End`: primeira/última mensagem não-system com content não vazio (truncada a 120 chars).
- `citations.longestSilenceBreak`: primeira mensagem não-system APÓS o maior gap (>0 dias), truncada a 120 chars; ausente se só 1 mensagem.

- [ ] **Step 1: Escrever os testes que FALHAM** (`tests/metrics.test.ts`), com asserts manuais derivados da fixture:

```ts
import { describe, it, expect } from 'vitest';
import { computeMetrics, formatMetricsBlock } from '../utils/metrics';
import { ANABRUNO_CHAT } from './fixtures/chat';

describe('computeMetrics', () => {
  const m = computeMetrics(ANABRUNO_CHAT);
  it('nomeia A e B', () => {
    expect(m.participantA.name).toBe('Ana');
    expect(m.participantB.name).toBe('Bruno');
  });
  it('conta mensagens', () => {
    expect(m.participantA.messageCount).toBe(9);
    expect(m.participantB.messageCount).toBe(9);
  });
  it('mede latências por round', () => {
    // Rounds de Ana: 0,2,4,6,9,11,14,16,18 → latências: 5,7,180,30,10,2,2,30 min?? -> ver nota: somente rounds respondidos
    expect(m.participantA.medianResponseMin).toBe(7);
    expect(m.participantB.medianResponseMin).toBe(55.5);
  });
  it('taxa de resposta', () => {
    expect(m.participantA.responseRate).toBe(8/8); // rd18 final não conta
    expect(m.participantB.responseRate).toBe(8/9); // rd15 sem resposta
  });
  it('inícios após pausa >=24h', () => {
    expect(m.participantA.initiations).toBe(0);
    expect(m.participantB.initiations).toBe(2); // rd10 (09:00 dia3, gap 35.5h) e rd15 (08:00 dia4, gap 22.6h?? não!)  -> rederivar abaixo
  });
  it('perguntas e emojis', () => {
    expect(m.participantA.questions).toBe(1);
    expect(m.participantB.questions).toBe(2);
    expect(m.participantA.emojis).toBe(4);
    expect(m.participantB.emojis).toBe(2);
  });
  it('vácuo final', () => {
    expect(m.lastMessageAuthor).toBe('Ana');
    expect(m.lastMessageLagHours).toBeGreaterThan(0);
  });
  it('silêncios', () => {
    expect(m.longestSilenceDays).toBe(2); // dia4 08:00 -> dia6 12:00
    expect(m.pausesOver48h).toBe(1);
    expect(m.pausesOver48h).toBe(1);
  });
  it('citações literais', () => {
    expect(m.citations.conversationStart).toBe('oi amor, tudo bem?');
    expect(m.citations.conversationEnd).toBe('foi ótima, muita praia e sol ☀️');
    expect(m.citations.longestSilenceBreak).toBe('foi mal a demora, tava viajando');
  });
});

describe('formatMetricsBlock', () => {
  it('contém números e nomes', () => {
    const block = formatMetricsBlock(computeMetrics(ANABRUNO_CHAT));
    expect(block).toContain('Ana');
    expect(block).toContain('Bruno');
    expect(block).toContain('9 mensagens');
    expect(block).toContain('CITAÇÕES LITERAIS');
  });
});
```

**NOTA IMPORTANTE — rederivar manualmente os valores exatos antes de escrever o teste final (durante a execução, conferir com a fixture). A tabela abaixo é o cálculo esperado:**
- Rounds Ana: [0],[2],[4],[6],[9],[11],[14],[16],[18] → latências (para rounds com próximo round): rd0→1: 5min; rd2→3: 0min(10:12→10:12, dif 0 → ignorar? usar >=1min para "respondido") → sem isso, latências Ana: 5, 0(ignorar→não conta?), 180, 30, 10, 2, 2, 30 → ver passo de execução: definir "dif > 0" (estritamente) para contar resposta. Com dif>0: Ana latências: 5,180,30,10,2,2,30 → mediana 10. Bruno: rd1→2: 7; rd3→4: 165; rd5→6: 2; rd8→9: 30; rd10→11: 10; rd13→14: 2; rd15→16: gritante 2440min (dia4 08:00 → dia6 12:00); rd17→18: 30 → medianas: [2,2,7,10,30,30,165,2440] → med 20.→ VERIFICAR na execução e ajustar asserts conforme o cálculo documentado, mantendo os asserts coerentes com a definição formal. Os valores abaixo (7 e 55.5) são EXEMPLO de shape e devem ser recalculados na execução com a definição final (dif>0).

- [ ] **Step 2: Rodar e confirmar falha**

Run: `npm test`
Expected: FAIL — módulo `../utils/metrics` não existe.

- [ ] **Step 3: Implementar `utils/metrics.ts`** (funções puras, sem dependência de UI; seguir as definições da seção "Definições"; truncar citações com `slice(0,120)`).

- [ ] **Step 4: Rodar testes**

Run: `npm test`
Expected: PASS (valores ajustados conforme nota acima, sempre coerentes com a definição formal).

---

### Task 3: Formatter + prompt + schema

**Files:**
- Modify: `utils/metrics.ts` (adicionar `formatMetricsBlock`)
- Modify: `types.ts`
- Modify: `services/geminiService.ts`

**Interfaces:**
- Consumes: `ConversationMetrics` da Task 2; `Message`, `DatingAnalysisResult` de `types.ts`.
- Produces:
  - `formatMetricsBlock(m: ConversationMetrics): string` — bloco PT-BR:
    ```
    DADOS MEDIDOS (verdade absoluta da conversa):
    - Mensagens: Ana 9, Bruno 9.
    - Tempo médio de resposta: Ana Xmin (mediana Ymin); Bruno ...
    - Taxa de resposta: Ana 100%, Bruno 89%.
    - Inícios após silêncio >=24h: Ana 0, Bruno 2.
    - Vácuo: a última mensagem é de Ana, há N horas sem resposta.
    - Perguntas feitas: Ana 1, Bruno 2. Emojis: Ana 4, Bruno 2.
    - Maior silêncio: 2 dias. Pausas >48h: 1.
    - Dias ativos: 4. Maior streak: N dias.
    
    CITAÇÕES LITERAIS (use exatamente, sem alterar):
    - Início da conversa: "oi amor, tudo bem?"
    - Fim da conversa: "foi ótima, muita praia e sol ☀️"
    - Mensagem após o maior silêncio: "foi mal a demora, tava viajando"
    ```
  - `ghostingScore.userA.evidence?: string`, `ghostingScore.userB.evidence?: string` em `DatingAnalysisResult` (types.ts).

- [ ] **Step 1: Teste do formatter** (adicionar ao `tests/metrics.test.ts` o describe `formatMetricsBlock` com os 4 asserts: contém "Ana", "Bruno", "9 mensagens", "CITAÇÕES LITERAIS").

Run: `npm test`
Expected: FAIL (função não existe).

- [ ] **Step 2: Implementar `formatMetricsBlock` em `utils/metrics.ts`** — template literal seguindo o formato acima; datas/durações: `Math.round` para minutos; "N horas/dias" conforme magnitude.

Run: `npm test`
Expected: PASS.

- [ ] **Step 3: Adicionar `evidence?: string` em `types.ts`** (userA e userB de `ghostingScore`).

- [ ] **Step 4: Modificar `analyzeDatingInsights` em `services/geminiService.ts`**:
  - Após derivar `participants`, se `participants.length < 2` → `throw new Error("Conversa precisa de pelo menos 2 participantes para o diagnóstico Pro.")`.
  - Criar `chat: ChatData = { participants, messages, title: '' }` e `const block = formatMetricsBlock(computeMetrics(chat));`
  - Inserir no `prompt` (antes de "IMPORTANTE"): bloco com instruções:
    ```
    Dados abaixo são a VERDADE ABSOLUTA da conversa. Derive os scores FIELMENTE deles, nunca contradiga.
    Use APENAS as citações abaixo para redFlags/greenFlags.
    goal: para cada usuário em ghostingScore, preencha evidence com 1 frase factual (ex: "responde em média em 5min e iniciou a conversa após 3 dias de silêncio").
    {block}
    ```
  - Schema: adicionar `evidence: { type: Type.STRING }` em userA e userB (required).

- [ ] **Step 5: Build**

Run: `npx tsc --noEmit`
Expected: 0 erros.

---

### Task 4: Relatório — exibir evidence

**Files:**
- Modify: `App.tsx` (bloco do Ghosting Score, ~linhas 486-498)

**Interfaces:**
- Consumes: `datingAnalysis.ghostingScore.userA/userB.evidence` (opcional) da Task 3.

- [ ] **Step 1: Renderizar evidence** — dentro do `map` dos usuários, abaixo da barra de progresso:

```tsx
{u.evidence && (
  <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1 print:text-slate-500">{u.evidence}</p>
)}
```

- [ ] **Step 2: Verificação**

Run: `npm run build`
Expected: build concluído sem erros.
Manual: http://localhost:3001 → carregar TXT → Diagnóstico Pro → confirmar que cada barra de interesse exibe a frase factual e que as citações das flags batem literalmente com o TXT carregado.