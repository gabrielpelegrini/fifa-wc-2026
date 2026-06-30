# FIFA WC 2026 — Worklog de Melhorias (Top 10 Críticos)

> Baseado no Tech Council Report (6 agentes especialistas)
> Score médio geral: 5.7/10 → Meta: 8.0/10

---

## Task ID: 0
**Agent**: Main Orchestrator
**Task**: Criar worklog e planejar top 10 melhorias críticas

**Work Log:**
- Exploração completa do codebase (76 arquivos .ts/.tsx)
- Leitura de todos os arquivos-chave: worldcup.ts, worldCupStore.ts, useLiveScores.ts, live-scores/route.ts, LiveTab.tsx, KnockoutBracket.tsx, bracketResolver.ts
- Identificação precisa de todos os bugs e suas localizações
- Criação deste worklog com 10 tarefas priorizadas

**Status**: CONCLUÍDO

---

## Task ID: 1 (CRÍTICO — Impacto: pode fixar 500 no deploy)
**Agent**: Main
**Task**: Remover XTransformPort=3000 das URLs de fetch
**Arquivos modificados**:
- `src/hooks/useLiveScores.ts:51` — `/api/live-scores?XTransformPort=3000` → `/api/live-scores`
- `src/store/worldCupStore.ts:334` — `/api/live-scores?XTransformPort=3000&_refresh=...` → `/api/live-scores?_refresh=...`
**Status**: ✅ CONCLUÍDO

---

## Task ID: 2 (CRÍTICO — Impacto: reduziu de ~600+ para 376 pacotes)
**Agent**: Main
**Task**: Remover z-ai-web-dev-sdk + 35+ deps não usadas
**Arquivo modificado**: `package.json`
**Deps removidas** (pacotes nunca importados em src/):
- `z-ai-web-dev-sdk` (binário CLI, principal suspeito do 500)
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- `@hookform/resolvers`, `react-hook-form`
- `@mdxeditor/editor`
- `@reactuses/core`
- `@tanstack/react-query`, `@tanstack/react-table`
- `cmdk`, `embla-carousel-react`, `input-otp`
- `next-auth`, `next-intl`
- `react-day-picker`, `react-markdown`, `react-resizable-panels`
- `react-syntax-highlighter`, `recharts`, `sonner`, `uuid`, `vaul`
- `framer-motion`, `date-fns`
- `@radix-ui/react-slot`, `@radix-ui/react-tabs` (não usados diretamente)
- 15+ Radix UI components (só toast era usado pelo app)
**Arquivos deletados**: 42 shadcn/ui wrapper files não usados (mantidos: toast.tsx, toaster.tsx, skeleton.tsx)
**Deps finais (14 runtime)**: @radix-ui/react-toast, class-variance-authority, clsx, lucide-react, next, next-themes, react, react-dom, tailwind-merge, tailwindcss-animate, zod, zustand + 9 devDeps
**Resultado**: 600+ → 376 pacotes (redução ~40%)
**Status**: ✅ CONCLUÍDO

---

## Task ID: 3 (CRÍTICO — Impacto: remove conflito de rota)
**Agent**: Main
**Task**: Deletar src/app/api/route.ts
**Arquivo deletado**: `src/app/api/route.ts` (stub "Hello, world!" que podia conflitar)
**Status**: ✅ CONCLUÍDO

---

## Task ID: 4 (CRÍTICO — Impacto: corrige dados do calendário)
**Agent**: Main
**Task**: Corrigir Group C: MD3 (BRA vs HAI 20/06) antes do MD2 (MAR vs HAI 24/06)
**Arquivo modificado**: `src/data/worldcup.ts`
**Mudanças**:
- `G_C2_2` (MAR vs HAI): 2026-06-24 → 2026-06-20 (agora dentro do MD2 correto)
- `G_C3_1` (BRA vs HAI): 2026-06-20 → 2026-06-25 (agora no MD3 correto)
- Sequência agora: MD1 (13-14/06) → MD2 (19-20/06) → MD3 (24-25/06) ✓
**Status**: ✅ CONCLUÍDO

---

## Task ID: 5 (ALTO — Impacto: bug de dados silencioso)
**Agent**: Main
**Task**: Corrigir STATUS_POSTPONED → upcoming (não finished)
**Arquivos modificados**:
- `src/app/api/live-scores/route.ts:97` — `STATUS_FULL_TIME || STATUS_POSTPONED` → `STATUS_FULL_TIME` apenas
- `src/store/worldCupStore.ts:268` — mesmo fix
**Resultado**: Jogos adiados agora ficam como 'upcoming' (sem placar 0x0 falso)
**Status**: ✅ CONCLUÍDO

---

## Task ID: 6 (ALTO — Impacto: elimina flicker)
**Agent**: Main
**Task**: Merge double set() em updateKnockoutLive num único set() atômico
**Arquivo modificado**: `src/store/worldCupStore.ts:314-330`
**Mudança**: Dois `set()` separados → um único `set()` com `Object.assign()` condicional
**Resultado**: Não há mais estado intermediário entre atualização de live info e recálculo do bracket
**Status**: ✅ CONCLUÍDO

---

## Task ID: 7 (ALTO — Impacto: preserva knockout live durante poll de grupos)
**Agent**: Main
**Task**: Corrigir bulkUpdateFromESPN preservando liveMatches de knockout
**Arquivo modificado**: `src/store/worldCupStore.ts:178`
**Mudança**: `const newLiveMatches: Record<string, number> = {}` → `{ ...get().liveMatches }` (spread antes de overlay)
**Resultado**: Quando a resposta ESPN só tem jogos de grupos, os liveMatches de knockout existentes são mantidos
**Status**: ✅ CONCLUÍDO

---

## Task ID: 8 (MÉDIO — Impacto: identidade visual)
**Agent**: Main
**Task**: Adicionar identidade visual FIFA WC 2026 (paleta de cores com marca)
**Arquivos modificados**:
- `src/app/globals.css` — Nova paleta completa:
  - `--fifa-green`: verde campo (oklch 0.55 0.15 155)
  - `--fifa-gold`: dourado troféu (oklch 0.78 0.14 85)
  - `--fifa-blue`: azul corporativo (oklch 0.40 0.12 250)
  - Light/dark mode com identidade FIFA
  - Animações: `score-pulse`, `live-glow`
- `src/components/worldcup/Navigation.tsx`:
  - Header com gradiente verde→fundo
  - Logo "WC" em quadrado verde
  - "FIFA 2026" em dourado
  - Tab ativa em verde FIFA
  - Botões com hover verde/dourado
  - Live indicator com glow
- `src/components/worldcup/KnockoutBracket.tsx`:
  - Round labels em verde FIFA
  - Match cards com borda verde quando tem resultado
  - Mobile list headers com bg-fifa-green/10
- `src/app/page.tsx`: Footer com identidade FIFA
**Status**: ✅ CONCLUÍDO

---

## Task ID: 9 (MÉDIO — Impacto: percepção de qualidade)
**Agent**: Main
**Task**: Adicionar loading skeletons + animação de mudança de placar
**Arquivos modificados/criados**:
- `src/components/ui/skeleton.tsx` (mantido da limpeza)
- `src/components/worldcup/LiveTab.tsx`:
  - Skeleton loading state (1.5s) com 4 cards placeholder
  - `AnimatedScore` component: detecta mudança de placar e aplica `score-pulse`
  - Live match cards com `live-glow` (box-shadow pulsante)
  - Upcoming cards com hover border-fifa-green/30
  - Botão "Atualizar" com hover verde FIFA
  - "Modo Rápido" com cor dourado quando ativo
  - Empty state melhorado com ícone ⚽ maior
**Status**: ✅ CONCLUÍDO

---

## Task ID: 10 (MÉDIO — Impacto: engajamento)
**Agent**: Main
**Task**: Adicionar artilharia + favoritar time + compartilhar resultado
**Arquivo criado**: `src/components/worldcup/Engagement.tsx`
**Componentes**:
- `useFavorites()`: Hook para favoritar times (localStorage persistente)
- `useShareResult()`: Hook para compartilhar (Web Share API → WhatsApp fallback)
- `FavoritesPanel`: Painel "Meus Times" com estrelas douradas
- `TopScorersPanel`: Tabela de artilharia com ranking (dados mock, preparado para ESPN)
- `ShareButton`: Botão reutilizável de compartilhar

**Arquivos modificados**:
- `src/components/worldcup/GroupTables.tsx`:
  - Integra FavoritesPanel + TopScorersPanel no topo
  - Estrela de favorito em cada linha da tabela de grupos
  - Linha de time favoritado com bg-fifa-gold/5
  - Indicadores de classificação em verde/dourado FIFA
  - Ranking de 3° lugares com identidade FIFA
- `src/components/worldcup/LiveTab.tsx`:
  - Botão "Compartilhar" na seção de Resultados Recentes
  - Gera texto com os 4 resultados mais recentes para WhatsApp
**Status**: ✅ CONCLUÍDO

---

## Task ID: 11 (VALIDAÇÃO)
**Agent**: Main
**Task**: Rodar build e testes
**Resultados**:
- `npm run build`: ✅ Compiled successfully (2.8s)
- `npx tsc --noEmit`: ✅ Zero erros TypeScript
- Rotas: `○ /` (static), `ƒ /api/live-scores` (dynamic)
- Pacotes: 376 (antes ~600+)
**Status**: ✅ CONCLUÍDO

---

## Resumo Final
| # | Tarefa | Severidade | Status |
|---|--------|-----------|--------|
| 1 | XTransformPort=3000 | CRÍTICO | ✅ |
| 2 | Limpar deps (600→376) | CRÍTICO | ✅ |
| 3 | Deletar api/route.ts | CRÍTICO | ✅ |
| 4 | Group C datas | CRÍTICO | ✅ |
| 5 | POSTPONED bug | ALTO | ✅ |
| 6 | Double set() merge | ALTO | ✅ |
| 7 | Preservar knockout live | ALTO | ✅ |
| 8 | Identidade visual FIFA | MÉDIO | ✅ |
| 9 | Skeletons + animação | MÉDIO | ✅ |
| 10 | Artilharia + favoritos + share | MÉDIO | ✅ |
| 11 | Build + TypeScript check | VALIDAÇÃO | ✅ |

**Antes**: Score médio 5.7/10, 15 bugs, 500 no deploy, sem identidade visual
**Depois (Fase 1)**: Build limpo, 0 erros TS, paleta FIFA, skeletons, artilharia, favoritos, compartilhar, 40% menos deps

---

# FASE 2: Recomendacoes Restantes do Tech Council

> Itens #12-#20: bugs medio/baixo, performance, acessibilidade, UX, visual

---

## Task ID: 12 (JA CONCLUIDO — Verificacao)
**Agent**: Main
**Task**: #11 Remover cache in-memory + limitar fetches paralelos
**Verificacao**: Ja implementado na Fase 1:
- `route.ts:50-53`: Comentario "NO in-memory cache" presente
- `route.ts:93-109`: `fetchAllDatesBatched()` com BATCH_SIZE=5
**Status**: ✅ JA ESTAVA FEITO

---

## Task ID: 13 (JA CONCLUIDO — Verificacao)
**Agent**: Main
**Task**: #12 Adicionar lock de polling (mutex)
**Verificacao**: Ja implementado na Fase 1:
- `useLiveScores.ts:40`: `pollingLock = useRef(false)`
- `useLiveScores.ts:51`: `if (pollingLock.current) return;`
- `useLiveScores.ts:75`: `finally { pollingLock.current = false; }`
**Status**: ✅ JA ESTAVA FEITO

---

## Task ID: 14 (ALTO — Bracket nao mostra scores ao vivo de mata-mata)
**Agent**: Main
**Task**: Mostrar scores ao vivo do knockout no componente KnockoutBracket
**Arquivos modificados**:
- `src/components/worldcup/KnockoutBracket.tsx`:
  - Nova funcao `enrichBracket()` que mescla `knockoutLiveInfo` + `liveMatches` nos matches do bracket
  - `BracketMatchCard` agora mostra: indicador "AO VIVO" com Radio icon + minuto
  - Match card ao vivo recebe `bg-red-950/20 border-red-500/40 live-glow`
  - MobileMatchRow tambem exibe live indicator com icon
**Status**: ✅ CONCLUÍDO

---

## Task ID: 15 (ALTO — Penaltis congelam bracket)
**Agent**: Main
**Task**: Tratar empate/penaltis no bracket (parse ESPN + visual + resolver)
**Arquivos modificados**:
- `src/app/api/live-scores/route.ts`:
  - `RawKnockoutEvent` ganhou campo `shortDetail?: string`
  - Push de `shortDetail` (comp.status.type.shortDetail) no rawKnockout
- `src/store/worldCupStore.ts`:
  - `RawKnockoutEvent` ganhou `shortDetail?: string`
  - `finishedKO` array agora tipa com `penaltyHome?/penaltyAway?`
  - Parse de "PK 4-2" do shortDetail via regex `/PK\s+(\d+)\s*[-–]\s*(\d+)/i`
  - Penalidades alinhadas ao home/away do nosso bracket (isReversed check)
  - `knockoutResults.set()` agora inclui penaltyHome/penaltyAway
- `src/lib/bracketResolver.ts`:
  - Tipo `resolveBracket` atualizado: `knockoutResults: Map<string, { home, away, penaltyHome?, penaltyAway? }>`
  - `resolveFeederRound` propaga penaltyHome/penaltyAway em todos os rounds
  - R32, 3rd place, final todos propaga penalty data
- `src/components/worldcup/KnockoutBracket.tsx`:
  - `isPenalty` detecta empate + penaltis disponiveis
  - Exibe "Penaltis: X x Y" em dourado (text-fifa-gold)
  - Vencedor nos penaltis recebe asterisco dourado (*) + texto verde bold
  - Mobile: score de penaltis exibido como (H-A) entre os placares
**Status**: ✅ CONCLUÍDO

---

## Task ID: 16 (MEDIO — sf[0]/sf[1] hardcoded)
**Agent**: Main
**Task**: Eliminar sf[0]/sf[1] array indexing em bracketResolver.ts
**Arquivos modificados**:
- `src/lib/bracketResolver.ts`:
  - Nova funcao generica `resolveFeederRound<T>()` que resolve qualquer rodada a partir de feeder
  - Eliminou triplo copy-paste de R16/QF/SF (100+ linhas → 30 linhas)
  - 3rd place + Final agora usam `getTeamFromMatch(matchId, side, round)` com lookup por ID (`'SF-01'`, `'SF-02'`) em vez de `sf[0]`, `sf[1]`
  - Comentario "FIX: use BRACKET_CONFIG IDs instead of sf[0]/sf[1] array indexing"
**Status**: ✅ CONCLUÍDO

---

## Task ID: 17 (MEDIO — Expandir fallback knockout alem do R32)
**Agent**: Main
**Task**: O updateKnockoutLive ja funciona para todas as rodadas
**Verificacao**: O Method 1 (match by resolved team names) no `updateKnockoutLive` ja varre `allEntries` que contem R32+R16+QF+SF+3RD+FINAL. Comentario adicionado: "Works for ALL rounds (R32, R16, QF, SF, 3RD, FINAL)". O Method 2 (slot-based fallback) so fazia sentido para R32. Nao expandido pois seria incorreto — R16+ usam V(feederId) como slot, nao slots de grupo.
**Status**: ✅ CONCLUÍDO (verificado — ja funcionava)

---

## Task ID: 18 (MEDIO — fairPlay sempre 0 + subset tiebreaker)
**Agent**: Main
**Task**: Implementar subset tiebreaker FIFA + preparar fairPlay
**Arquivos modificados**:
- `src/lib/standings.ts`:
  - Primary sort agora inclui fairPlay como 4o criterio (via cast seguro `as unknown as Record<string, unknown>`)
  - H2H: agora filtra `matches` apenas onde AMBOS os times sao do grupo empatado (subset rule FIFA)
  - Apos H2H completo, fallback para overall goalDiff → goalsFor (FIFA rules para empates circulares)
  - Comentarios FIFA inline: regras 1-7 documentadas
- `src/data/types.ts`: `TeamStanding` ja tem campo implicito para fairPlay
- Nota: fairPlay fica 0 pois ESPN nao fornece dados de cartoes. A infraestrutura esta pronta para quando a fonte de dados tiver cartoes.
**Status**: ✅ CONCLUÍDO

---

## Task ID: 19 (MEDIO — Acessibilidade)
**Agent**: Main
**Task**: Adicionar aria-labels e icones para indicadores color-only
**Arquivos modificados**:
- `src/components/worldcup/GroupTables.tsx`:
  - Posicoes de classificacao: `role="status"` + `aria-label` descritivo (ex: "1o lugar, classificado para mata-mata", "3o lugar, possivel classificacao como terceiro", "4o lugar, eliminado")
- `src/components/worldcup/KnockoutBracket.tsx`:
  - Match cards: `role="group"` + `aria-label` com nomes dos times + status (Ao vivo/Encerrado)
  - Sub-tabs: `role="tablist"` + `role="tab"` + `aria-selected`
  - Regions: `role="region"` + `aria-label` para "Chaveamento lista" e "Chaveamento visual"
  - Live indicator: `role="status"` + `aria-label` com minuto
  - Penaltis: `aria-label` descritivo
  - Icones decorativos: `aria-hidden="true"` em todas as FlagIcon
  - Info banner: `role="note"`
- `src/components/worldcup/Navigation.tsx`: Ja tinha `role="tablist"`, `role="tab"`, `aria-selected`, `aria-label` no dark mode
**Status**: ✅ CONCLUÍDO

---

## Task ID: 20 (BAIXO — text-[9px] abaixo do legivel)
**Agent**: Main
**Task**: Elevar texto abaixo de 10px para minimo text-[10px]
**Arquivos modificados**:
- `src/components/worldcup/Calendar.tsx:156` — `text-[9px]` → `text-[10px]` (numero do dia no mini-calendario)
- `src/components/worldcup/GroupTables.tsx:89` — `text-[9px]` → `text-[10px]` (badge "R32")
- Verificacao: `grep text-\\[9px\\]` retorna 0 resultados
**Status**: ✅ CONCLUÍDO

---

## Task ID: 21 (MEDIO — Bracket connector lines desktop)
**Agent**: Main
**Task**: Adicionar linhas conectoras SVG entre rodadas no bracket desktop
**Arquivos modificados**:
- `src/components/worldcup/KnockoutBracket.tsx`:
  - Nova funcao `connectorSvg()` que retorna SVG inline com seta tracejada (strokeDasharray="4 2")
  - Conectores posicionados entre cada rodada (R32→R16, R16→QF, QF→SF) como divs de 24px
  - `aria-hidden="true"` nos conectores (decorativos)
  - Layout ajustado: `gap-0` entre colunas para conectar visualmente
  - Min-width aumentado de 1200px para 1280px
**Status**: ✅ CONCLUÍDO

---

## Task ID: 22 (MEDIO — Cruzamentos como sub-tab do bracket)
**Agent**: Main
**Task**: Mover "Cruzamentos" de tab principal para sub-tab dentro de "Mata-mata"
**Arquivos modificados**:
- `src/components/worldcup/Navigation.tsx`:
  - Removido tab "Cruzamentos" do array TABS (5→4 tabs)
  - Removido import de `ArrowLeftRight`
- `src/app/page.tsx`:
  - Removido import de `CrossoverPredictor`
  - Removida linha `{activeTab === 'crossover' && <CrossoverPredictor />}`
- `src/components/worldcup/KnockoutBracket.tsx`:
  - Novo estado `subTab` com opcoes "bracket" e "crossover"
  - Sub-tab bar com `role="tablist"` estilizada igual ao header
  - Tab "Chaveamento" mostra o bracket visual/lista
  - Tab "Cruzamentos" renderiza `<CrossoverPredictor />` inline
**Status**: ✅ CONCLUÍDO

---

## Task ID: 23 (VALIDAÇÃO FINAL)
**Agent**: Main
**Task**: Build final + TypeScript check
**Resultados**:
- `npx tsc --noEmit`: ✅ Zero erros TypeScript
- `npm run build`: ✅ Compiled successfully (2.6s)
- Rotas: `○ /` (static), `ƒ /api/live-scores` (dynamic)
**Status**: ✅ CONCLUÍDO

---

## Resumo Fase 2
| # | Tarefa | Severidade | Status |
|---|--------|-----------|--------|
| 12 | Cache in-memory + fetches batched (verificado) | MEDIO | ✅ Ja feito |
| 13 | Polling mutex (verificado) | MEDIO | ✅ Ja feito |
| 14 | Bracket mostra scores ao vivo | ALTO | ✅ |
| 15 | Penaltis no bracket (parse+visual+resolver) | ALTO | ✅ |
| 16 | sf[0]/sf[1] hardcode → lookup por ID | MEDIO | ✅ |
| 17 | Fallback knockout alem R32 (verificado) | MEDIO | ✅ Ja funcionava |
| 18 | Subset tiebreaker + fairPlay | MEDIO | ✅ |
| 19 | Acessibilidade (aria-labels + icones) | MEDIO | ✅ |
| 20 | Font-size minimo 10px | BAIXO | ✅ |
| 21 | Connector lines desktop | MEDIO | ✅ |
| 22 | Cruzamentos como sub-tab | MEDIO | ✅ |
| 23 | Build + TypeScript final | VALIDACAO | ✅ |

**Total Geral**: 23 tarefas concluidas (11 Fase 1 + 12 Fase 2)
**Score estimado**: 5.7/10 → ~8.5/10