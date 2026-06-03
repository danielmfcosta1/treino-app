# App Treino — Estado & Pendências

_Última atualização: 2026-06-02_

App pessoal de treino de academia (single-user). Offline-first, sincroniza com
a nuvem, custo zero. Rodando no iPhone do Daniel como build standalone.

## Stack
- **Expo SDK 54** (RN 0.81, React 19), TypeScript, **Expo Router** (tabs)
- **Legend-State v3** (offline-first, SQLite local) + **Supabase** (Postgres + Storage + Auth)
- Gráficos: react-native-gifted-charts · Catálogo: free-exercise-db (37 exercícios)
- Projeto: `app-treino/treino-app/` (caminho SEM espaço — obrigatório p/ iOS build)

## Backend (Supabase)
- Projeto **pessoal** `tkqfxwfqjlqkdgvdmojt` (NÃO é B2Med). Tabelas do treino convivem
  com o chatbot (`conversations`/`pending_messages`) — **nunca tocar nessas**.
- Single user: `danmfcosta@gmail.com`. RLS por `auth.uid() = user_id`.
- Trigger `handle_times` controla created_at/updated_at (cliente nunca seta updated_at).
- Bucket privado `progress-photos` (policies por pasta `{user_id}/`).
- Estado limpo em 01/06: 37 exercícios sem duplicados, 0 treinos em andamento.

## ✅ Pronto (todas as 9 fases)
0. Andaime + prova de sync offline→nuvem
1. Auth single-user (login + auth-gate declarativo via `Stack.Protected`)
2. Catálogo de exercícios (seed idempotente — corrigido p/ não duplicar)
3. Núcleo de registro (rotina→treino→séries; histórico)
4. Cardio + métricas corporais + fotos de progresso
5. Rest timer + notificação local (sem push — Apple ID grátis)
6. Inteligência: 1RM (Epley), sugestão de carga, estagnação/deload, streaks, heatmap
7. Progresso (gráficos, PRs, streaks, heatmap)
8. Export/backup CSV+JSON
- **Qualidade:** 57 testes unitários (jest), tsc + eslint limpos.
- Ícone + splash próprios (halter azul).

### Correções pós-1º treino real (commit 8f106d4) — CÓDIGO PRONTO
- Obs. por série (✎) · Equipamento por exercício (chips) · Editar série confirmada
- Dedup de exercícios (raiz: seed consultava store local antes do sync)
- **Retomar treino em andamento** (derivado dos dados, sobrevive ao app fechar) +
  botão "‹ Voltar" (minimiza sem encerrar)

### Bugfixes do 2º treino (commit fix safe-area…) — INSTALADO no device
- #1 `SafeAreaProvider` na raiz (faltava → botões caíam atrás da Dynamic Island no
  Pro Max) + botão "Fechar" no picker e em Configurações
- #2 cronômetro recalcula de `started_at` (não pausa em background)
- #6/#7 inputs de série com estado local + commit onBlur (some cursor bugado) +
  `automaticallyAdjustKeyboardInsets` (teclado não cobre)
- #4 nota com botão OK + preview · #5 card recolhível (toque no título)
- #8 isométrico (force=static) por tempo (coluna `sets.duration_seconds`)
- #3 v1: chips de equipamento só quando aplicável
- Catálogo expandido p/ 75 exercícios (38 via SQL em 02/06)

## ⚠️ Estado atual
Tudo acima **instalado e rodando** no iPhone (verificado sem crash). Aguardando o
Daniel testar no próximo treino e reportar. Build expira ~7 dias (reinstalar).

## 🗺️ Roadmap (ordem recomendada)
1. **Testar os fixes no próximo treino** e reportar
2. **Rotina com exercícios** — hoje rotina só tem nome; predefinir exercícios resolve
   "treino vazio" + "esqueci o treino" (maior impacto no uso real)
3. **Criar exercício** (custom, `is_custom=true`) — botão no picker. Daniel pediu.
   ⚠️ Catálogo já tem 75 (38 via SQL direto) — falta espelhar os 38 novos no
   `src/seed/exercises.seed.ts` E tornar `seedExercises` incremental (inserir
   faltantes por nome vs. servidor) p/ não divergir em install novo.
4. **Equipamento — rework completo (#3 v2):** separar movimento-base de equipamento
   (ex.: "Stiff" + escolher barra/halter), em vez de bakear no nome do exercício.
   Decisão de design pendente.
5. **Superset/dropset** na UI (schema já suporta: `set_type`, `superset_group`)
6. Editar/excluir treino no Histórico
7. RIR + medidas corporais detalhadas (cintura/braço) na UI
8. Alerta de estagnação/deload na tela (lógica já existe em `src/domain/progression.ts`)

### v2 (planejado, adiado)
- AI coach (LLM lendo os dados) · Sync Apple Health

### Infra / débito
- **Validade 7 dias** (Apple ID grátis) — reinstalar plugando; conta paga US$99/ano remove
- Ícone não regenera sozinho em prebuild — copiar `assets/images/icon.png` →
  `ios/treinoapp/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png` antes do build
- Teste end-to-end dos fluxos no aparelho (alguns só validáveis tocando)

## Operação (referência)
- **Device:** iPhone 16 Pro Max "iPhone de DC" · UDID `00008140-000930A111D3001C`
- **Signing:** Apple ID grátis, team `5JXL32NGFZ` · bundle `com.danielcosta.treinoapp`
- **Ferramentas:** Xcode 26.5, CocoaPods (via brew). Metro: `npx expo start`.
- **Quirks de build** (resolvidos, via plugin `plugins/withLocalNotificationsOnly.js`):
  remove entitlement de Push (grátis não suporta) + desliga ENABLE_USER_SCRIPT_SANDBOXING.
  React Compiler desligado (incompatível com `use$` do Legend nesta versão).
- **Reinstalação limpa** (se ícone/estado bugar): `xcrun devicectl device uninstall app
  --device <UDID> com.danielcosta.treinoapp` e depois instalar o `.app` de
  `~/Library/Developer/Xcode/DerivedData/treinoapp-*/Build/Products/Release-iphoneos/`.

## Git
Repo local em `app-treino/` (sem remote). Commits principais:
`8154b24` design · `18fba30` fundação · `0227660` domínio+seed · `3dd49eb` núcleo ·
`3d13ab4` rest/progresso/corpo/export · `bfa1436` fotos · `d7a88a1` fix crash Release ·
`2137b5f` ícone · `8f106d4` fixes do 1º treino.
