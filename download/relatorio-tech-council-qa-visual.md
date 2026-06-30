# Relatório Consolidado — FIFA WC 2026 WebApp

**Data:** 01/07/2026  
**Agentes:** QA Engineer + Design Visual + Tech Council  
**Contexto:** Revisão pós-implementação de 23 melhorias + 6 correções adicionais

---

## Resumo Executivo

| Dimensão | Nota | Status |
|----------|------|--------|
| Arquitetura | 7/10 | Boa separação, sem testes |
| Performance | 5/10 | Gargalo no fetch ESPN, sem cache |
| Segurança | 4/10 | Sem headers, sem rate limit |
| Escalabilidade | 4/10 | Dependência única ESPN |
| Qualidade de Código | 7/10 | Limpo, tipos duplicados |
| Design Visual | 7.6/10 | Consistência precisa melhorar |
| **Nota Geral Tech Council** | **5.4/10** | |

---

## BUGS ENCONTRADOS E AÇÕES

### CRÍTICOS (já corrigidos nesta sessão)

| ID | Arquivo | Bug | Ação |
|----|---------|-----|------|
| BUG-001 | LiveTab.tsx:190 | setState dentro de useMemo (efeito colateral no render) | ✅ Removido setLiveMatches do useMemo |
| BUG-001 | route.ts:280 | Erro HTTP 200 mesmo com falha | ✅ useLiveScores valida `data.source !== 'espn'` |
| BUG-002 | store:189 | liveMatches nunca é limpo (memory leak) | ✅ Limpeza a cada poll |
| BUG-001 | Calendar.tsx:92 | Duplicata knockout não cobre ordem reversa | ✅ Adicionada verificação reversa |
| BUG-003 | Calendar.tsx:424 | liveMinute undefined renderiza "undefinedmin" | ✅ Adicionada guarda `isLive && liveMinute` |

### ALTOS (pendentes)

| ID | Arquivo | Descrição |
|----|---------|-----------|
| BUG-002 | store:202 | updateKnockoutLive não limpa dados antigos quando events=[] |
| BUG-004 | store:379 | refreshNow engole erros sem feedback ao usuário |
| BUG-001 | VisualBracket.tsx:253 | Índices hardcoded (slice 0,16 etc) frágeis |
| BUG-002 | VisualBracket.tsx:134 | tryResolveFromRaw pode fazer match incorreto entre grupos |

### MÉDIOS (pendentes)

| ID | Descrição |
|----|-----------|
| BUG-002 | parseInt(\|\| 0) mascara score ausente como 0 |
| BUG-003 | Erro de parse JSON silenciado no fetch ESPN |
| BUG-005 | Classificação de status duplicada (route + store) |
| BUG-002 | LiveTab: placar nulo exibido como "0×0" |
| DADOS-002 | Fallback LiveTab não inclui STATUS_EXTRA_TIME |
| BUG-002 | standings.ts: fairPlay não funcional (campo nunca inicializado) |

---

## REVISÃO VISUAL — Nota: 7.6/10

### Notas por Componente

| Componente | Nota | Destaque |
|-----------|------|----------|
| globals.css | 8/10 | Paleta OKLCH moderna, animations bem calibradas |
| Navigation | 7/10 | Logo forte, sticky com blur, falta aria-controls nas tabs |
| LiveTab | 8/10 | Cards ao vivo com glow, skeleton loading, score animado |
| GroupTables | 7/10 | Badges coloridos, falta caption e abbr nas tabelas |
| KnockoutBracket | 7/10 | Dual mobile/desktop, conectores SVG, erro ortográfico "Decisoes" |
| **VisualBracket** | **9/10** | **Melhor componente — design broadcast, troféu com glow, dourado premium** |
| Calendar | 8/10 | Dots de data, filtros completos, agora com mata-mata |
| Engagement | 7/10 | Estrela dourada, artilharia mock sem aviso |
| page.tsx | 8/10 | Estrutura semântica, footer limpo |

### 5 Problemas Críticos de Design

1. **text-[9px] e text-[10px]** — Ilegível por WCAG 1.4.4. Mínimo: 11px
2. **Contraste insuficiente no modo escuro** — text-gray-600 sobre gray-900 (~2.5:1)
3. **Sem prefers-reduced-motion** — Animações pulsantes sem alternativa
4. **Sem skip-to-content** — Obrigatório WCAG 2.4.1
5. **Inconsistência fifa-gold vs yellow-500 vs amber** — 3 variações de dourado

---

## REVISÃO TÉCNICA — Nota: 5.4/10

### Arquitetura (7/10)

**Pontos fortes:**
- Separação clara: dados → lógica → estado → UI
- Hook customizado de polling idiomático
- Zustand v5 sem prop drilling

**Problemas:**
- ZERO testes unitários (standings, bracket, thirdPlaceRanking são complexos)
- reactStrictMode desabilitado
- Sem camada de abstração sobre API ESPN

### Performance (5/10)

**Gargalo crítico — /api/live-scores:**
- ~27 datas × fetches paralelos = pode exceder timeout do Vercel (10s free)
- `revalidate: 0` desabilita cache completamente
- `getMatchLookup()` reconstruída a cada request
- `GROUP_MATCHES.find()` O(n) dentro do loop (deveria usar Map)

**Store:**
- `computeAll` chamado em cada atualização (12 grupos + bracket completo)
- Sem Page Visibility API para pausar polling

### Segurança (4/10)

- **CRÍTICO:** `_debug` expõe estratégia de fetch
- **CRÍTICO:** `String(error)` pode vazar stack traces
- Sem security headers (CSP, X-Frame-Options, etc.)
- Sem rate limiting (SSRF via ESPN proxy)
- Sem CORS explícito

### Escalabilidade (4/10)

- Fonte única (ESPN) — sem fallback
- Sem cache distribuído (CDN)
- Sem persistência (refresh perde tudo)
- N × 5.4 req/min ESPN para 10K usuários = rate limit garantido
- Polling HTTP sem SSE/WebSocket

---

## CORREÇÕES IMPLEMENTADAS NESTA SESSÃO

1. **API**: Voltou a buscar TODAS as datas de grupos (17) + janela knockout (-2 a +10)
2. **API**: Batch size 5→10, timeout 8s→25s
3. **API**: RawKnockoutEvent agora inclui homeName, awayName, date, time, venue, city
4. **Store**: Salva rawKnockoutEvents para fallback de exibição
5. **LiveTab**: Fallback ESPN para knockout não-resolvido (sem setState no useMemo)
6. **LiveTab**: Filtro "próximos" agora inclui amanhã + jogos sem data
7. **Calendar**: Agrega jogos de mata-mata (bracket + raw ESPN)
8. **Calendar**: Filtro "Mata-mata" nas rodadas
9. **Calendar**: Detecção de duplicata em ordem reversa
10. **Calendar**: liveMinute com guarda contra undefined
11. **useLiveScores**: Valida `data.source !== 'error'` antes de processar
12. **useLiveScores**: Limpeza liveMatches a cada poll (remove jogos não-live)
13. **Nova aba "Chave"**: VisualBracket com tema escuro, dourado, troféu
14. **5 bugs CRÍTICOS corrigidos** (ver tabela acima)

---

## PRÓXIMAS AÇÕES RECOMENDADAS

### Alta Prioridade
1. Middleware com security headers
2. Rate limiting (20 req/min por IP)
3. Revalidate 30-60s no fetch ESPN
4. Unificar tipos duplicados em types.ts
5. Adicionar fairPlay ao TeamStanding e inicializar

### Média Prioridade
6. Testes unitários (standings, bracket, thirdPlace)
7. Substituir polling por SSE para jogos ao vivo
8. Persistência localStorage para placares
9. prefers-reduced-motion no CSS
10. Unificar fifa-gold (remover yellow-500/amber)

### Baixa Prioridade
11. Habilitar reactStrictMode
12. Adicionar skip-to-content link
13. Elevar text-[9px] para 11px mínimo
14. Aumentar contraste no modo escuro
15. Corrigir "Decisoes" → "Decisões" no KnockoutBracket