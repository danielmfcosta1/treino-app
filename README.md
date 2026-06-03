# Treino App

App pessoal de musculação para registrar treinos, acompanhar evolução de carga e manter motivação. Roda no iPhone, funciona offline, sincroniza com a nuvem.

---

## O que é

Um caderno de treino inteligente no celular. A ideia principal é simples: você registra cada série na academia (exercício, carga, reps) e o app cuida do resto — mostra o que você fez da última vez, sugere quanto aumentar, avisa quando você estagnação por semanas e exibe gráficos de evolução.

Feito pra uso pessoal (single-user), com foco em **velocidade de registro durante o treino** e **dados confiáveis pra ver progressão real** (não sensação).

---

## Funcionalidades

### Registro de treino
- Rotinas/divisões (ex.: Push A / Pull B / Legs C) com templates de exercícios
- Musculação: exercício → séries (reps, carga, RPE/RIR opcional, obs. por série)
- Suporte a superset e dropset (schema completo desde o início)
- Exercícios isométricos (tempo em vez de reps)
- Cardio (tipo, duração, distância, FC manual)
- Métricas corporais: peso, medidas, fotos de progresso

### Inteligência de progressão
- **Último desempenho na hora** — abre o exercício e já vê o que fez da última vez
- **1RM estimado (Epley)** + gráficos de evolução de carga e volume
- **Sugestão de próxima carga** — regra de progressive overload automática
- **Detecção de estagnação/deload** — alerta quando um exercício empacou há semanas
- Streaks de dias treinados e recordes pessoais (PRs)
- Heatmap semanal de grupos musculares

### Qualidade de vida
- Rest timer automático com notificação local
- Retomar treino em andamento se fechar o app
- Export/backup em CSV e JSON (sem lock-in)
- Catálogo de 75+ exercícios pré-cadastrados

---

## Stack

| Camada | Tecnologia |
|---|---|
| App | Expo SDK 54 · React Native 0.81 · React 19 · TypeScript |
| Navegação | Expo Router (file-based, tabs) |
| Estado & offline | Legend-State v3 (SQLite local + sync reativo) |
| Backend | Supabase — Postgres + Storage + Auth |
| Gráficos | react-native-gifted-charts |
| Testes | Jest — 57 testes unitários |
| Qualidade | TypeScript strict · ESLint |

### Arquitetura em uma linha

```
[ Expo (React Native) ] ←→ Legend-State (SQLite local) ←→ Supabase (Postgres + Storage)
```

- **Fonte da verdade local**: estado persistido no device → app funciona 100% offline.
- **Sync em background**: plugin Supabase do Legend-State faz push/pull incremental quando há rede.
- **Progressão calculada no device**: 1RM, sugestões e detecção de estagnação rodam client-side, sem round-trip de servidor.
- **Custo zero**: Supabase free tier cobre o uso tranquilamente.

---

## Roadmap

### v1 — funcionando hoje
Todas as 9 fases implementadas e rodando no iPhone 16 Pro Max:
andaime offline/sync → auth → catálogo → registro → cardio/corpo/fotos → rest timer → inteligência de progressão → gráficos/PRs/streaks → export.

### Próximos passos
1. Rotina com exercícios pré-definidos (eliminar "treino vazio")
2. Criar exercício customizado pelo app
3. Rework de equipamentos (separar movimento de equipamento)
4. Superset/dropset na UI (schema já suporta)
5. Editar/excluir treino no histórico

### v2 (planejado)
- **AI coach** — botão "analisa meu progresso" que lê o banco e chama um LLM
- **Sync Apple Health / Google Fit** — puxa peso de balança smart, FC do Apple Watch

---

## Estrutura do projeto

```
treino-app/
├── app/                    # Rotas (Expo Router)
│   ├── (tabs)/             # Telas principais (Home, Histórico, Progresso, Corpo, Rotinas)
│   ├── (auth)/             # Login
│   └── workout/[id].tsx    # Tela de treino em andamento
├── src/
│   ├── domain/             # Lógica de negócio: 1RM, progressão, heatmap (testado)
│   ├── store/              # Legend-State: estado + sync Supabase
│   ├── components/         # Componentes de UI reutilizáveis
│   └── seed/               # Catálogo de exercícios
├── docs/
│   ├── plans/              # Design doc original
│   └── STATUS.md           # Estado atual detalhado
└── plugins/                # Plugin Expo: notificações locais (sem push pago)
```

---

## Por que esse stack?

- **Expo** — deploy no iPhone sem precisar de conta Apple Developer paga (Apple ID grátis com validade de 7 dias por build; conta paga US$99/ano elimina isso)
- **Legend-State** — estado reativo com persistência local e sync Supabase prontos; academia tem sinal ruim, offline é obrigatório
- **Supabase** — Postgres gerenciado, free tier generoso, Storage para fotos, Auth pronta
- **Single-user** — sem multi-tenant, sem complexidade de conflitos de sync, RLS simples por `user_id`
