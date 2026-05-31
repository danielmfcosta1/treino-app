# App Treino — Design Doc

**Data:** 2026-05-31
**Autor:** Daniel Costa
**Status:** Aprovado (brainstorming) — pronto pra plano de implementação

## 1. Visão

App pessoal de treino de academia pra registrar treinos, acompanhar progressão
de carga e manter motivação. Single-user, foco em **velocidade de registro
durante o treino** e em **dados confiáveis pra ver evolução real** (não
sensação).

## 2. Decisões fundamentais

| Dimensão | Decisão | Por quê |
|---|---|---|
| Plataforma | **App nativo (Expo / React Native)** | Uso no celular na academia; notificações de rest timer e (v2) HealthKit exigem nativo. |
| Usuários | **Single-user** | Só o Daniel. Sem multi-tenant, auth mínima. |
| Persistência | **Supabase free tier** (Postgres + Storage) | Nuvem custo zero; Daniel já domina Supabase. Storage pra fotos de progresso. |
| Offline | **Offline-first** | Academia tem sinal ruim; registro de série nunca pode travar. |
| Sync | **Legend-State + plugin Supabase** | Estado reativo com sync/persistência local prontos. Cuida de fila, retry, offline. Single-user ⇒ quase sem conflito. |

## 3. Escopo

### v1 — o app que já vale usar todo dia

**Registro**
- Rotinas/divisões (A/B/C, Push-Pull-Legs): montar e seguir templates
- Musculação: exercício → séries (reps, carga, RPE/RIR)
- Suporte a **superset / dropset** (no schema desde o início)
- Cardio (tempo, distância, FC manual)
- Métricas corporais (peso, medidas, fotos de progresso)

**Inteligência de progressão** (tudo roda sobre os dados já registrados, infra zero)
- **"Último desempenho" na hora** — ao abrir o exercício, mostra o que fez da última vez. Referência imediata.
- **1RM estimado (Epley) + gráficos** de evolução de carga/volume
- **Sugestão de próxima carga** — regra de progressive overload (bateu todas as reps no topo da faixa → +incremento)
- **Detecção de estagnação / deload** — alerta quando um exercício empaca há X semanas

**Experiência & motivação**
- Rest timer automático com notificação
- PRs/recordes + streaks de dias treinados
- Heatmap de grupos musculares (volume semanal)

**Dados**
- Export/backup CSV/JSON — seguro contra perda de histórico

### v2 — depois que o núcleo girar
- **AI coach** — módulo que lê o banco e chama LLM **sob demanda** (botão "analisa meu progresso"). Custo de token mínimo por ser on-demand. Faz sentido só com histórico acumulado.
- **Sync Apple Health / Google Fit** — exige dev build com módulo nativo (HealthKit / Health Connect). Benefício: peso/treinos viram dados do sistema, puxa FC/calorias do Apple Watch e peso de balança smart automaticamente.

## 4. Modelo de dados (esboço)

Tabelas principais (Postgres / Supabase), todas com `updated_at` e soft-delete
(`deleted_at`) pra sync incremental:

- `exercises` — catálogo (nome, grupo muscular, tipo, equipamento)
- `routines` — divisões/templates (nome, ex: "Push A")
- `routine_exercises` — exercícios de uma rotina (ordem, faixa de reps alvo)
- `workouts` — sessão de treino (data, rotina opcional, notas)
- `workout_exercises` — exercício dentro de uma sessão
- `sets` — série individual (reps, carga, RPE/RIR, tipo: normal/superset/dropset, ordem)
- `cardio_sessions` — cardio (tipo, duração, distância, FC)
- `body_metrics` — peso/medidas/% gordura por data
- `progress_photos` — referência a foto no Storage + data
- `personal_records` — PRs derivados (exercício, tipo de recorde, valor, data)

O schema de `sets` já contempla superset/dropset/RPE desde o v1 pra não migrar depois.

## 5. Arquitetura (alto nível)

```
[ Expo App (React Native) ]
        │
   Legend-State (estado reativo + persistência local)
        │  sync plugin
        ▼
[ Supabase Postgres + Storage ]
```

- **Fonte da verdade local**: estado Legend-State persistido no device → app funciona 100% offline.
- **Sync**: plugin Supabase do Legend-State faz push/pull incremental em background quando há rede.
- **Inteligência de progressão**: computada client-side sobre o estado local (1RM, sugestões, estagnação) — sem round-trip de servidor.
- **AI coach (v2)**: função sob demanda que serializa histórico relevante e chama o LLM.

## 6. Pontos de atenção pra fase de arquitetura

- **Path com espaço** (`app treino`): React Native / builds nativos historicamente quebram com espaços no caminho. Decidir na arquitetura: renomear pra `app-treino` ou criar o projeto Expo num subdiretório sem espaço.
- **Dev build vs Expo Go**: rest timer com notificação e (v2) HealthKit exigem dev build. Definir setup de build custo zero (EAS free / build local).
- **Auth single-user**: decidir entre uma conta Supabase fixa com RLS simples vs. sem auth + RLS aberto. Trade-off de segurança vs. simplicidade.
- **Catálogo de exercícios**: seed inicial de exercícios comuns vs. cadastro 100% manual.

## 7. Próximo passo

Plano de implementação detalhado (plan mode / writing-plans): scaffolding do
projeto Expo, schema + migrations Supabase, integração Legend-State, e ordem de
construção das features (núcleo de registro primeiro, depois inteligência,
depois motivação).
