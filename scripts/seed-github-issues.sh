#!/usr/bin/env bash
# Seeds the PolitScope roadmap as 39 GitHub issues on NoelHuibers/politscope.
# Idempotency: NOT idempotent — running twice creates duplicates. Use once on an empty issue list.
# Labels must exist first (see label-creation block at top).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# --- helpers ---
new() {
  # new "Title" "label1,label2,label3" <<'BODY' ... BODY
  local title="$1"
  local labels="$2"
  local label_args=()
  IFS=',' read -ra parts <<< "$labels"
  for l in "${parts[@]}"; do label_args+=(--label "$l"); done
  gh issue create --title "$title" "${label_args[@]}" --body-file -
}

# ========================================================================
# PHASE 0 — INFRA (issues #1–#4)
# ========================================================================

new "Provision Neon Postgres + pgvector + DATABASE_URL secret in Vercel" \
    "area:infra,phase:0-foundations,priority:high" <<'BODY'
**Context.** Foundation for all data-layer work — every downstream issue assumes this is done.

**Acceptance.**
- Neon project `politscope` created with `politscope-prod` + `politscope-dev` branches
- `pgvector` extension enabled (`CREATE EXTENSION IF NOT EXISTS vector;`)
- `DATABASE_URL` set in Vercel project env (Preview + Production)
- `DATABASE_URL` in local `.env.local`
- `pnpm db:studio` connects to the dev branch

**Notes.** Neon's free tier supports DB branching per PR; we'll wire that into the CI gate later.
BODY

new "Run initial Drizzle migration + HNSW vector index + German FTS index" \
    "area:infra,phase:0-foundations,priority:high" <<'BODY'
**Context.** The Drizzle schema in `src/lib/db/schema.ts` is the source of truth; this issue applies it to Neon and adds the two indexes that drive atlas vector kNN + Cmd+K German speech search.

**Acceptance.**
- `pnpm db:generate` produces a clean SQL migration
- Migration applied to `politscope-dev` and `politscope-prod` via `pnpm db:migrate`
- HNSW index present on `speech_embeddings.embedding` with `vector_cosine_ops` operator class
- GIN index present using `to_tsvector('german', text)` on `speeches.text`
- `EXPLAIN` of a sample kNN query shows HNSW used (not seq scan)

**Blocked by.** #1

**Notes.** German FTS uses the `german` config (stemming, stopwords) shipped with Postgres.
BODY

new "Add health-check server function + verify Vercel reaches Neon" \
    "area:infra,phase:0-foundations" <<'BODY'
**Context.** Lightweight smoke test that the deployed app can talk to the DB. Catches missing env vars + connection-string issues before they hit user-facing routes.

**Acceptance.**
- TanStack Start server function at `/api/health` returns JSON `{ ok: true, now, mps_count, speeches_count }`
- Calls `SELECT NOW()` + two count queries
- Returns 503 with structured error if DB unreachable
- Vercel preview deployment returns 200 from `/api/health`

**Blocked by.** #2
BODY

new "GitHub Actions CI gate — typecheck + biome lint on every PR" \
    "area:infra,phase:0-foundations" <<'BODY'
**Context.** Today nothing blocks a broken PR from landing on main. Adds a cheap, fast CI gate so the build can never regress beneath green.

**Acceptance.**
- `.github/workflows/ci.yml` runs on `pull_request` to `main`
- Steps: setup-pnpm, install (frozen-lockfile), `pnpm typecheck`, `pnpm check`
- Job fails on any error
- Required status check enabled on `main` (note this in the close comment so we remember the manual repo-setting step)

**Notes.** Playwright + Vitest get added to the same workflow in #37.
BODY

# ========================================================================
# TECH DECISIONS (issues #5–#11)
# ========================================================================

new "Decision: ingest source — OpenDiscourse vs Bundestag XML vs hybrid" \
    "area:tech-decision,priority:high" <<'BODY'
**Decision needed.** Where to source the historical speech corpus (~1.25M speeches, WP 12–21).

**Options.**
- **A. Hybrid (OpenDiscourse for history + Bundestag XML for daily delta)** — best quality on history (OD is community-cleaned), fresh on the edge (bundestag.de publishes within hours). Two parsers to maintain.
- **B. Bundestag XML only** — single source, freshest. Raw XML is messier (interjections inline, OCR artifacts on older WPs); we'd reimplement OD's cleanup work.
- **C. OpenDiscourse only** — one source, simplest. Lags real-time by weeks; missing WP21 partial coverage.

**Recommendation.** A — best quality + freshness for the cost of writing two simple parsers.

**Blocks.** #12 (parser), #27 (daily delta).

**How to close.** Comment with the chosen option + rationale, then close.
BODY

new "Decision: embedding model — OpenAI 3-small / Cohere / Jina / self-hosted" \
    "area:tech-decision,priority:high" <<'BODY'
**Decision needed.** Which sentence-embedding model for ~1.25M speeches.

**Options.**
- **A. OpenAI `text-embedding-3-small`** — 1536-dim, ~$0.02 / 1M tokens → ~$12 one-shot for full corpus. Multilingual but English-leaning. Trivial ops.
- **B. Cohere `embed-multilingual-v3`** — 1024-dim, ~$60 one-shot. Strong on German specifically. Vendor lock-in.
- **C. Jina `jina-embeddings-v3`** — 1024-dim, ~$12 one-shot. Multilingual, open-weights, can self-host later.
- **D. Self-hosted BGE-m3 / paraphrase-multilingual-mpnet** — free at inference, needs GPU (~6–8 A100-hours for 1.25M batch). Best privacy. Most ops.

**Recommendation.** A — cheapest hosted option, quality good enough for v1; re-embed with Jina later if quality matters more.

**Blocks.** #15, #16.

**How to close.** Comment with the chosen model + version, then close.
BODY

new "Decision: atlas rendering at 1.25M-point scale" \
    "area:tech-decision" <<'BODY'
**Decision needed.** How to render the embedding atlas at full scale (SVG dies past ~5k points).

**Options.**
- **A. Paginated deck.gl ScatterplotLayer** — load points in viewport-aware batches (~50k per zoom). Smooth pan/zoom; complex layer caching.
- **B. Full deck.gl point cloud loaded once** — ~30 MB of float32 + topic_id sent to client. Simple code; slow first load.
- **C. Server-precomputed tile images** — render PNG tiles per zoom level; client shows tiles. Cheapest runtime, no per-point interactivity.

**Recommendation.** A — best UX; deck.gl is already in deps.

**Blocks.** #25.

**How to close.** Comment with chosen approach + the trade-off you're accepting, then close.
BODY

new "Decision: CDU/CSU split timing — in parser vs in MP identity layer" \
    "area:tech-decision" <<'BODY'
**Decision needed.** OpenDiscourse encodes "CDU/CSU" as a single faction; we need to split into `cdu` (Christian Democrats) vs `csu` (Bavarian sister party). Where does the split happen?

**Options.**
- **A. Defer to MP identity layer (#13)** — parser emits `cdu` + a `rawFactionName` field; identity layer re-tags Bavarian MPs as `csu` via Stammdaten lookup.
- **B. Heuristic in parser** — look at MP's Landesliste in OpenDiscourse data directly; tag at parse time.

**Recommendation.** A — keeps parser deterministic + testable; single place to fix when the rule changes.

**Blocks.** #12, #13.

**How to close.** Comment with chosen approach, then close.
BODY

new "Decision: contributions_extended (interjections) — include or skip" \
    "area:tech-decision" <<'BODY'
**Decision needed.** OpenDiscourse's `contributions_extended.csv` contains short interjections ("Beifall bei der SPD", "Lachen bei der AfD") inline with speeches. Treat as speech records, attach to parent, or skip?

**Options.**
- **A. Skip in v1** — interjections are short + noisy + would dominate the embedding corpus.
- **B. Include as separate speech records** — captures cross-party reactions; ~5× corpus size.
- **C. Attach as metadata to parent speech** — preserves signal without bloating corpus; more complex schema.

**Recommendation.** A — easy to add later if #15 finds the embedding signal lacks reaction data.

**Blocks.** #12, #15.

**How to close.** Comment with chosen approach, then close.
BODY

new "Decision: topic taxonomy — auto-cluster vs curated" \
    "area:tech-decision" <<'BODY'
**Decision needed.** Topics shown in atlas/Sankey (mockup has 14: Wirtschaft, Umwelt & Klima, Migration, Außenpolitik, Soziales, Bildung, Digitalisierung, Verteidigung, Haushalt, Verkehr, Justiz & Inneres, Europa, Landwirtschaft, Gesundheit). Drive them from auto-clustering or from a curated list?

**Options.**
- **A. BERTopic with manual curation pass** — let HDBSCAN propose 30–50 clusters, then manually merge/rename to the 14 mockup topics. Best of both worlds; manual work each model refresh.
- **B. Pure auto-cluster (BERTopic, no curation)** — fully reproducible, may produce odd labels ("EU-Subventionen agrarwirtschaftliche Strukturen"). Lower editorial quality.
- **C. Fully curated (we define 14 topics, classify speeches via embedding similarity)** — most editorial control, brittle if topics drift over 35 years.

**Recommendation.** A — matches the mockup's existing labels + maintains editorial quality.

**Blocks.** #17, #19, #20, #21.

**How to close.** Comment with chosen approach, then close.
BODY

new "Decision: MP photo source — Wikidata Commons or skip for v1" \
    "area:tech-decision" <<'BODY'
**Decision needed.** The MP profile page (mockup) shows a photo placeholder. Source real photos?

**Options.**
- **A. Skip for v1** — keep the SVG placeholder. Saves an entire ingest pipeline + image hosting + attribution work.
- **B. Wikidata Commons via SPARQL** — each MP page on Wikidata links to a Commons photo (CC-licensed). Need: attribution overlay, fallback for missing photos, image proxy for performance.

**Recommendation.** A — defer to v2; not worth the complexity for a prototype launch.

**Blocks.** #34 (only if methodology modal should include photo attribution).

**How to close.** Comment with chosen approach, then close.
BODY

# ========================================================================
# PHASE 1 — INGEST (issues #12–#14)
# ========================================================================

new "OpenDiscourse → typed Speech parser (historical bulk)" \
    "area:ingest,phase:1-data" <<'BODY'
**Context.** First step in moving off mock data. Pure data transformation: CSV in, typed records out, no DB writes (that's #14). Detailed implementation plan in `.claude/plans/do-the-fist-thing-jazzy-hinton.md` (pre-pivot, but parser content is still current).

**Acceptance.**
- `src/lib/ingest/opendiscourse/` exports `streamSessions / streamMps / streamSpeeches`
- All output types match Drizzle insert types in `src/lib/db/schema.ts`
- Vitest tests against `__fixtures__/tiny/`, `malformed/`, `split-rows/`, `real-sample-wp20/` pass
- CLI at `scripts/ingest-opendiscourse.ts` emits JSONL to stdout
- Per-WP row count within ±2% of OpenDiscourse's published totals (committed as `EXPECTED_COUNTS`)
- Zero new runtime deps; one dev dep (`tsx`)

**Blocked by.** #5

**Notes.** This task does NOT write to Postgres — see #14 for that.
BODY

new "Stable MP identity layer + alias resolution" \
    "area:ingest,phase:1-data" <<'BODY'
**Context.** Multiple OpenDiscourse speakers can refer to the same real-world person (name variants across decades: "Friedrich Merz", "Dr. Friedrich Merz", "Merz, F."). This issue builds the canonical `mps` table with stable ext_id + an alias resolution table.

**Acceptance.**
- Stammdaten XML from bundestag.de parsed → canonical MP records
- Every parsed speech (from #12) links to exactly one `mp_id` via alias resolution
- CSU members tagged correctly (Bavarian Landesliste)
- Alias collision rate (multiple MPs match same speech speaker) < 0.5%
- Vitest tests for tricky cases (Mehrfachnamensträger like Müller, Schmidt)

**Blocked by.** #2, #8
BODY

new "GitHub Action for historical bulk ingest (no Vercel timeout)" \
    "area:ingest,phase:1-data" <<'BODY'
**Context.** Vercel functions cap at 5–15 min; full historical bulk ingest takes much longer. GitHub Actions has no per-job time limit (6h on free tier).

**Acceptance.**
- `.github/workflows/ingest-bulk.yml` — manual trigger (workflow_dispatch)
- Runs `scripts/fetch-opendiscourse.ts` + parser + bulk-insert into Neon prod branch
- Uses `pg.unnest()` or `COPY FROM STDIN` for fast inserts (>10k rows/s)
- Streams progress logs to GitHub Actions UI
- Idempotent — can resume / re-run safely
- Full WP 12–21 backfill completes in < 2h

**Blocked by.** #2, #12, #13
BODY

# ========================================================================
# PHASE 2 — NLP (issues #15–#18)
# ========================================================================

new "Embedding worker — batch + write to speech_embeddings" \
    "area:nlp,phase:2-nlp" <<'BODY'
**Context.** Worker that pages through `speeches` rows lacking embeddings, batches them, calls the embedding API, writes vectors back.

**Acceptance.**
- `scripts/embed.ts` — CLI accepts `--batch-size`, `--limit`, `--model`
- Idempotent — skips already-embedded speeches
- Batches sized for the chosen model's max input (~96 for OpenAI 3-small)
- Cost telemetry logged: tokens in, $ estimate, throughput
- Failed batches logged + retried with backoff
- Dry-run mode for 1k speeches succeeds + reports estimated full-corpus cost

**Blocked by.** #6, #14
BODY

new "Run full embedding job + verify HNSW kNN performance" \
    "area:nlp,phase:2-nlp" <<'BODY'
**Context.** One-shot run of the embedding worker over all 1.25M speeches. After completion, verify the HNSW index is fast enough for atlas + Cmd+K.

**Acceptance.**
- Full corpus embedded; row count in `speech_embeddings` matches `speeches` (excluding empty-text rejects)
- Cost telemetry: actual $ vs estimate captured
- HNSW index rebuilt after bulk insert
- Sample 5-NN queries from random speech vectors return in p50 ≤ 50 ms, p95 ≤ 200 ms
- `pnpm test src/lib/db/kNN.test.ts` passes

**Blocked by.** #15
BODY

new "Topic clustering — BERTopic + curated labels" \
    "area:nlp,phase:2-nlp" <<'BODY'
**Context.** Cluster the 1.25M embeddings into ~14 top-level topics matching the mockup's TOPICS.

**Acceptance.**
- Python script (Poetry project under `pipeline/`) runs BERTopic on a 200k sample
- Top-c-tf-idf words per cluster + LLM-summarized topic labels
- Manual curation pass: merge/rename clusters to the 14 mockup topics
- Topic assignments written back to `speeches.topic_id`
- ≥ 80% of test speeches land in a topic that a native German speaker calls correct
- Topic centers updated in `src/data/topics.ts` (or moved to DB)

**Blocked by.** #10, #16
BODY

new "UMAP project all embeddings to 2D" \
    "area:nlp,phase:2-nlp" <<'BODY'
**Context.** Each speech needs `(umap_x, umap_y)` coordinates for the atlas viz.

**Acceptance.**
- Python script: fit UMAP (n_neighbors=30, min_dist=0.05, metric=cosine) on a sample
- Transform all 1.25M embeddings; write to `speeches.umap_x` + `umap_y`
- Spatial autocorrelation between `topic_id` and `(umap_x, umap_y)` > 0.6
- Scatter visually clusters by topic (eyeball test)

**Blocked by.** #16
BODY

# ========================================================================
# PHASE 3 — ANALYTICS (issues #19–#22)
# ========================================================================

new "Materialized view topic_flows_by_period — Sankey data" \
    "area:analytics,phase:3-analytics" <<'BODY'
**Context.** Sankey panel needs speech-share % per `(topic_id, wahlperiode)`. Materialized for fast reads; refreshed on cron.

**Acceptance.**
- SQL materialized view created, supports `REFRESH MATERIALIZED VIEW CONCURRENTLY`
- Shares sum to 100% per period (sanity check)
- Numbers stable across re-runs given same `speeches.topic_id`
- Drizzle accessor wraps `SELECT * FROM topic_flows_by_period`

**Blocked by.** #17
BODY

new "Speaker positioning — cosine distance to faction medians per topic" \
    "area:analytics,phase:3-analytics" <<'BODY'
**Context.** Powers the positioning scatter ("Wer klingt wie eine andere Fraktion?"). Per `(mp, topic)`: cosine similarity from MP's mean embedding to each faction's median embedding.

**Acceptance.**
- View / table `mp_positioning(mp_id, topic_id, ax_score, ay_score, cohesion, n_speeches)`
- Cohesion = mean similarity to own faction median
- Min 20 speeches per `(mp, topic)`, else row absent (insufficient data)
- Outliers ("klingt eher wie X") match editorial intuition on spot-check of mockup's listed outliers

**Blocked by.** #17
BODY

new "Scattertext — log-odds-ratio words per party pair per topic" \
    "area:analytics,phase:3-analytics" <<'BODY'
**Context.** Scattertext panel shows words that distinguish two parties' rhetoric. Computed via scaled log-odds-ratio with informative Dirichlet prior (Monroe et al. 2008).

**Acceptance.**
- Python script computes per `(partyA, partyB, topic)` top 100 distinguishing words
- Persisted to `scatter_words` table
- AfD-vs-Grüne table contains expected signals ("Remigration", "Klimagerechtigkeit", "Energiewende", "Heimat", etc.) without manual seeding
- Words filtered against German stopwords + procedural Bundestag vocabulary ("Bundespräsident", "Antrag", etc.)

**Blocked by.** #17
BODY

new "Speaker fingerprint — 5 features × N quarters per MP" \
    "area:analytics,phase:3-analytics" <<'BODY'
**Context.** Fingerprint panel shows rhetorical traits over time per MP.

**Acceptance.**
- Per `(mp_id, quarter)`, 5 features computed:
  - Mean sentence length
  - Lexical richness (TTR)
  - German sentiment (via pretrained classifier)
  - Formality (passive-voice + nominalization heuristic)
  - Party deviation (positioning ax-distance to faction median)
- Persisted to `mp_fingerprint` table
- 8 hero MPs (Merz, Habeck, Weidel, Wagenknecht, Lindner, Scholz, Özdemir, Trittin) all have rows for last 8 quarters

**Blocked by.** #20
BODY

# ========================================================================
# PHASE 4 — UI WIRING (issues #23–#26)
# ========================================================================

new "Server functions for all viz data" \
    "area:ui,phase:4-ui-wire" <<'BODY'
**Context.** Wire every viz to a typed TanStack Start server function returning real data.

**Acceptance.**
- `getAtlasPoints({ bbox, topic, period, parties })`
- `getTopicFlows({ period, topic })`
- `getPositioningScatter({ topic, period, parties, axisA, axisB })`
- `getScattertextWords({ partyA, partyB, topic })`
- `getMPProfile(id)` — single MP with all derived metrics
- `searchSpeeches(query)` — German FTS
- Each: typed via Drizzle row types, throws clear errors on missing data

**Blocked by.** #19, #20, #21, #22
BODY

new "Wire vizes to TanStack Query — replace mock data imports" \
    "area:ui,phase:4-ui-wire" <<'BODY'
**Context.** Every viz currently imports `MPS`, `TOPIC_FLOWS`, etc. from `src/data/*.ts`. Swap to `useQuery({ queryFn: getXxx })`.

**Acceptance.**
- `@tanstack/react-query` added; `QueryClient` provider in `__root.tsx`
- All 5 dashboard vizes use real data via hooks
- MP profile + positioning detail use real data
- Loading state uses existing `.skeleton` CSS class
- Mock data files (`src/data/mps.ts`, `topic-flows`, `scatter-words`) deletable

**Blocked by.** #23
BODY

new "deck.gl atlas with paginated ScatterplotLayer (replace SVG)" \
    "area:ui,phase:4-ui-wire" <<'BODY'
**Context.** SVG atlas dies past ~5k points; we have 1.25M. Replace with deck.gl.

**Acceptance.**
- `<EmbeddingMap>` SVG replaced with `DeckGL + ScatterplotLayer`
- Viewport-aware paginated loading via `getAtlasPoints`
- Cluster labels overlaid as SVG (keeps typography under design control)
- Point picker for click → speech inspector
- Theme tokens flow into deck.gl colors (light/dark switch works)
- 1.25M points render at ≥ 30 fps on a mid-range laptop

**Blocked by.** #7, #23
BODY

new "Wire LeftRail filters end-to-end (period + parties)" \
    "area:ui,phase:4-ui-wire" <<'BODY'
**Context.** nuqs is already in URL state; plumb filter values through every server function so the UI actually reflects them.

**Acceptance.**
- Clicking a Wahlperiode button changes Sankey highlight + atlas counts visibly
- Clicking a party toggle dims that party's points in atlas + positioning
- Resetting filters returns to default view
- URL changes are shareable (bookmark restores filter state)

**Blocked by.** #24
BODY

# ========================================================================
# PHASE 5 — OPS (issues #27–#30)
# ========================================================================

new "Vercel Cron — daily delta ingest from bundestag.de XML" \
    "area:ops,phase:5-ops" <<'BODY'
**Context.** Keep the dataset fresh. Pulls yesterday's new sessions from the Bundestag XML feed, parses, embeds, classifies, inserts.

**Acceptance.**
- `/api/cron/ingest-delta` server function gated by `CRON_SECRET` header check
- `vercel.json` cron schedule: daily 23:00 UTC
- Pulls last 7 days as buffer against missed runs
- New speeches embedded via #15's worker
- New speeches' topic_id assigned via nearest cluster centroid (no re-clustering)
- A sample new session appears in DB + atlas within 24h of bundestag.de publication

**Blocked by.** #18
BODY

new "Refresh materialized views nightly + recompute metrics weekly" \
    "area:ops,phase:5-ops" <<'BODY'
**Context.** Derived data (`topic_flows`, `mp_positioning`, `mp_fingerprint`, `scatter_words`) needs periodic recompute.

**Acceptance.**
- `/api/cron/refresh-derived` (nightly) refreshes `topic_flows_by_period`
- `/api/cron/refresh-metrics` (Sunday 02:00 UTC) recomputes `mp_positioning` + `mp_fingerprint` + `scatter_words`
- Derived numbers visibly track newly ingested speeches within ≤ 1 week of session

**Blocked by.** #27
BODY

new "Sentry error tracking + structured logging" \
    "area:ops,phase:5-ops" <<'BODY'
**Context.** Today we have zero observability on production errors or cron failures.

**Acceptance.**
- `@sentry/react-router` (or `@sentry/node`) configured for client + server
- Server functions wrapped with logger that prefixes correlation IDs
- Ingest jobs log row counts + duration + cost
- A deliberate dev-mode throw appears in Sentry within 60s

**Blocked by.** #3
BODY

new "Rate-limit public read endpoints" \
    "area:ops,phase:5-ops" <<'BODY'
**Context.** Public endpoints currently have no rate limits — one malicious actor could exhaust Neon compute.

**Acceptance.**
- `/api/ssr` + search endpoints limited to 60 req/min per IP
- 429 response with `Retry-After` header
- Load test: 200 req/min from one IP gets ~140 rejected
- Mechanism: Upstash Redis OR Vercel Edge Config OR `@vercel/limits` — pick + document trade-off in close comment

**Blocked by.** #3
BODY

# ========================================================================
# PHASE 6 — POLISH (issues #31–#35)
# ========================================================================

new "Cmd+K speech search palette (cmdk + German FTS)" \
    "area:polish,phase:6-polish" <<'BODY'
**Context.** Mockup TopBar shows a Cmd+K palette; today it's a fake `<span>`.

**Acceptance.**
- `cmdk` dialog opens on ⌘K / Ctrl+K
- Real-time search via `searchSpeeches(query)` server function
- Results ordered by `ts_rank` of `to_tsvector('german', text)`
- Each result links to speech inspector + atlas highlight
- Typing "Energiewende" returns ≥ 10 real speeches with relevance ordering

**Blocked by.** #23
BODY

new "InsufficientDataFrame + 'Profil der Woche' weekly pipeline" \
    "area:polish,phase:6-polish" <<'BODY'
**Context.** Mockup has two states we don't implement yet: insufficient-data MP frame (for new MPs like Lena Vogt) and the editorial "Profil der Woche" rotation.

**Acceptance.**
- MP profile with < 20 speeches per topic renders `InsufficientDataFrame` (from `mockup/project/frames.jsx`)
- Weekly cron picks MP with highest positioning-outlier score
- `MaverickCard` populated dynamically from a `profil_der_woche` table

**Blocked by.** #24
BODY

new "Cross-viz interactions — atlas / Sankey / topic highlighting" \
    "area:polish,phase:6-polish" <<'BODY'
**Context.** Connect vizes so user can drill in from any panel.

**Acceptance.**
- Click Sankey band → atlas dims to that topic + scattertext switches to topic-scoped words
- Click atlas cluster label → Sankey highlights that topic
- Click scattertext word → Cmd+K palette opens preloaded with example speeches
- All cross-links via TanStack Router search params (no page reload)

**Blocked by.** #25, #31
BODY

new "Real methodology modal — actual numbers, model versions, GitHub link" \
    "area:polish,phase:6-polish" <<'BODY'
**Context.** Methodology modal text is hardcoded. Wire to real pipeline metadata.

**Acceptance.**
- `getMethodology()` server fn returns: embedding model + version, UMAP params, topic count, last refresh time
- Modal renders these dynamically
- Footer links to public GitHub repo
- "Letzte Methodik-Änderung" reflects actual git commit date

**Blocked by.** #28
BODY

new "Mobile breakpoints — collapse vizes to single-column carousel" \
    "area:polish,phase:6-polish" <<'BODY'
**Context.** Mockup is desktop-only (> 1280 px). Add mobile breakpoints.

**Acceptance.**
- At < 768 px: TopBar collapses, LeftRail becomes a Sheet drawer
- MainGrid stacks vizes vertically as a scrollable carousel
- Atlas auto-zooms to fit narrow viewport
- Site usable on iPhone 15 + Pixel 8 sizes (manual test)

**Blocked by.** #26
BODY

# ========================================================================
# PHASE 7 — LAUNCH (issues #36–#39)
# ========================================================================

new "Impressum + Datenschutzerklärung (German legal requirements)" \
    "area:legal,phase:7-launch" <<'BODY'
**Context.** TMG §5 requires Impressum on public German sites. Datenschutzerklärung must declare Vercel logs, Sentry, analytics.

**Acceptance.**
- `/impressum` page (DE + EN versions)
- `/datenschutz` page (DE + EN versions)
- Both linked from footer
- Reviewed against German legal template (eRecht24 etc.)
- Honest about all third-party data flows (Vercel, Neon, Sentry, Cloudflare)
BODY

new "Playwright E2E + Vitest data-layer tests + tighten CI gate" \
    "area:infra,phase:7-launch" <<'BODY'
**Context.** #4 added a minimal lint+typecheck CI gate. Now add actual feature tests.

**Acceptance.**
- Playwright: dashboard loads, MP click navigates, locale switch works, filter toggle changes URL, Cmd+K returns results
- Vitest integration: server functions tested against dockerized Postgres + pgvector
- Both run in `.github/workflows/ci.yml`
- Merge to main blocked if either fails
- Green pipeline on a no-op PR

**Blocked by.** #4, #26
BODY

new "Performance budget — Lighthouse + bundle audit" \
    "area:polish,phase:7-launch" <<'BODY'
**Context.** Atlas + deck.gl can balloon the bundle. Set + enforce a budget.

**Acceptance.**
- Lighthouse perf ≥ 85 on `/de` (Vercel preview)
- Initial JS bundle ≤ 250 KB gzipped (atlas code-split, lazy-loaded)
- Critical fonts preloaded; non-critical fonts deferred
- Lighthouse run added to CI as a non-blocking check (regression alert)

**Blocked by.** #25, #35
BODY

new "Soft launch — domain, robots.txt, sitemap, editorial review" \
    "area:legal,phase:7-launch" <<'BODY'
**Context.** Final pre-launch sweep.

**Acceptance.**
- Custom domain via Vercel (DNS configured)
- `robots.txt` + `sitemap.xml` (dynamic — TanStack Start route)
- Editorial pass: every German string read by a native speaker
- Every AI-generated label has the `KI-Tag` (or visible equivalent)
- Impressum + Datenschutz visible
- Soft-launch checklist (in this issue) ticked through

**Blocked by.** #36, #37, #38
BODY

echo "all 39 issues seeded"
