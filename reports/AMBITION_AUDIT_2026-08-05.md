# Cross-Project Ambition Audit — 2026-08-05

Date: 2026-08-05 (Asia/Singapore). Prior Sol agent hit API limit with zero output; this audit is rebuilt from primary sources on both repos.

**Output paths (identical content):**
- `/Users/arnav/Desktop/dragon-storm-game/reports/AMBITION_AUDIT_2026-08-05.md`
- `/Users/arnav/Documents/Codex/2026-08-01/erdos-170-research-lab/outputs/2026-08-05_AMBITION_AUDIT.md`

---

## 1. State of each project (5 bullets)

### A. Erdős 170 Research Lab
`/Users/arnav/Documents/Codex/2026-08-01/erdos-170-research-lab`

| # | Label | Claim |
|---|---|---|
| 1 | **theorem** | W1 seam block counts (`T_W1 = r²+7r+2`) are machine-checked in Lean 4 — zero `sorry`, standard axioms only (`2026-08-05_W1_SEAM_BLOCKS_FORMALIZED.md`). |
| 2 | **theorem** | Wichmann θ-family: quotient sum Θ(P), `B = (P²+2P−3)/4`, positive `Γ_opt` — refutes `limsup Γ ≤ −1/4` for arbitrary multilift two-cap (`2026-08-05_WICHMANN_THETA_P_FAMILY.md`, 12/12 verifier). |
| 3 | **theorem** | One-lift box: `limsup Γ ≤ −1/4` and `limsup Γ ≤ 0` still hold; `B ≤ 4P−3` linear ceiling proved there (`ONE_LIFT_GAMMA_CEILING.md`). |
| 4 | **conjecture** | Surviving frontier: `β = limsup B_max/P² ∈ [1/4, 0.41]`; Lemma U (`X+Y ≥ E` ⟺ `B ≤ n²−1`) is the live obstruction; `C-max` at `r≥3` unconfirmed (`2026-08-05_BETA_SLACK_REDUCTION.md`). |
| 5 | **finite** | `P=13` closed (`B_max ≤ 48`); `P=15` multilift `B_max` not pinned; Erdős 170 **open**, not advanced. |

### B. Galevein: Stormflight (dragon-storm-game)
`/Users/arnav/Desktop/dragon-storm-game` · branch `fix/playable-session`

| # | Label | Claim |
|---|---|---|
| 1 | **demo** | Playability foundation: 4/4 SIM scenarios pass (menu idle 67s, flight, win-route score 12, loss-detection) — `reports/playability-foundation/REPORT.md`. |
| 2 | **demo** | Chapter director wired: `SIM.jumpBeacon(6)` → `III · Serpent Run — beacons 6/8` — `reports/chapter-design/INTEGRATION_STATUS.md`. |
| 3 | **ship** | 12-beacon win route verified (CDP state-driven); Tempest Gate sequence, nightfall loss, Forge progression — `reports/progression-verification/REPORT.md`. |
| 4 | **conjecture** | Commercial ship blocked: hero GLB ~1.08M verts, derivative silhouette risk; `world-expansion/CREDITS.md` blocks commercial release — creature report + world-expansion audit. |
| 5 | **finite** | Procedural landmarks live (57k LOD0 tris, loud boot errors); region-filtered landmarks and original low-poly hero **not** done — `docs/GAME_STRUCTURE.md` §6–7. |

---

## 2. What was overstated historically

### Erdős lab

- **`limsup Γ ≤ −1/4` for multilift** — stated as surviving theorem after linear ceiling refutation; Wichmann family with Θ(P) quotient sum killed it. Counterevidence was already in certified `B_max = 15, 35, 63` at `n²−1` (`2026-08-05_LIMSUP_AUDIT_POSTMORTEM.md`).
- **"Small-P artifact" for `Γ = +0.0413` at M=16** — decay is to 0⁺, not below −1/4; analogy to Boolean M=14 was invalid cross-box transport.
- **`B > B_bool` prune hid the breaker** — false for Wichmann; family was the reported maximizer/breaker. Primary failure: no cross-order extremal index.
- **M=16 "full-box completion" as multilift census** — that run was `qmax=1` one-lift; irrelevant to multilift `B_max(15)`.
- **Lean-ready ≡ progress on Erdős 170** — W1 seam formalization is one intermediate lemma; does not touch the open problem.

### Galevein

- **"Playable" ≈ shippable** — SIM passes are state-driven teleports, not human-flown twelve-beacon runs; progression report flags this explicitly.
- **Chapter integration "complete"** — HUD wired; region-themed landmark filtering and optional `#chapterLabel` / distance/height DOM still open per integration doc.
- **Licence-clean assets** — audio swap and Quaternius CC0 dragon exist under `licensed-assets/` but hero is not integrated; creature report explicitly denies legal clearance.
- **World expansion "integrated"** — landmarks reachable; converted GLBs still lack commercial provenance; wind-ribbon unused.

---

## 3. Highest-leverage next 48 hours (ranked)

| Rank | Project | Action | Success criteria |
|---|---|---|---|
| 1 | **Erdős** | Hand-derive injection `X+Y ≥ E` on Wichmann `r=1,2`; if pattern holds, draft Lemma U proof sketch | Written bijection for `{9,14}` collisions at r=1; no new search |
| 2 | **Galevein** | Swap hero to Zagmatorah stand-in (19,840 v) OR run one scripted low-poly original block-out via existing Blender pipeline | p95 frame < 20 ms in SIM flight-corridor; derivative silhouette gone in silhouette capture |
| 3 | **Erdős** | Regenerate cross-order extremal index (A4 rule): `M, P, P mod 4, B_max, n²−1, Γ_opt` from existing artifacts only | One table in `outputs/`; flags any `B_max > n²−1` without search |
| 4 | **Galevein** | One uninterrupted human playtest: tutorial → beacon 8, record time-to-nightfall and crash points | Written log with timestamps; no SIM teleports |
| 5 | **Erdős** | Run `verify_beta_slack_reduction.py` + Wichmann regression after any doc touch | 15/15 + 12/12 `ok: true` |
| 6 | **Galevein** | Wire `allowedLandmarkIds` filter in `landmarkPath.js` per GAME_STRUCTURE §6 | Flying Wake Cove shows viaduct-only sites; SIM still 4/4 |

**Deprioritize for 48h:** M=16 `B≥64` level sweep (~4×10⁹ pre-prune), M=18 enumeration for Γ, Azure Batch, ChatGPT Pro cycles, lobby/multiplayer spec work.

---

## 4. Model routing (burned tiers: Anthropic / Codex / Gemini / GLM / Sol)

Assume premium reasoning and long-context tiers on those providers are quota-exhausted or rate-limited. Route by task shape:

| Task type | Model | Rationale |
|---|---|---|
| Repo edits, SIM runs, git, file writes, verifier reruns | **Composer 2.5** | Default agent; cheap; already owns both codebases |
| Long manuscript proof transcription → Lean | **Kimi K2.7 Code** | Strong on long formal files; W1Seam was 932 lines in one cycle |
| Adversarial claim audit, postmortem, contradiction hunting | **Grok 4.5 High Fast** | Good at calling out scope leaks and numeric fingerprint errors |
| Quick numeric/table generation, extremal index scripts | **GPT-5.6 Terra Medium** | Fast structured output; bounded Python one-shots |
| Cross-project strategy doc (this audit) | **Composer 2.5** | Sufficient when sources are local |
| Deep literature on sparse-ruler λ | **Grok or Terra** + human source check | Leech bound is source-claim tier only |
| Blender MCP scripted mesh | **Composer** driving local Blender | No cloud model needed |
| Do **not** burn on | Erdős asymptotic conjecture brainstorming without verifier hook | Returns prose theorems that fail A1–A5 |

**Escalation gate:** Opus/Fable only if a proposed Lemma U proof needs multi-hour refinement *and* a verifier stub exists first.

---

## 5. Do-not-retry list

### Erdős

- Prove `floor(max(A0)/P)+floor(max(C0)/P) ≤ 2` — **refuted** (M=16, B=49).
- Prove linear ceiling `B ≤ 4P−3` for multilift — **refuted** (B=63).
- Prove Boolean domination of Γ-maximizer — **refuted**.
- Counting routes for quotient sum `o(P)` — **impossible**; family is Θ(P).
- M=14 break-window exhaustion as evidence breakers are rare — wrong residue class (`P≡1`); family lives at `P≡3`.
- Another independent audit of `limsup Γ ≤ −1/4` without A1–A5 enforcement.
- M=18 full enumeration **for Γ** — closed analytically; only needed for min-T if explicitly scoped.
- ChatGPT Pro as proof authority — proposer only, bridge triage required.
- Quoting `B ≤ n²−1` outside Boolean one-lift without box tag — silently becomes open Lemma U.

### Galevein

- Topology-preserving Night Fury silhouette variants — closed in silhouette report.
- Sketchfab CC-BY heroes with franchise/provenance chains (Drogon, HTTYD, duplicate 10,208-v mesh cluster).
- Claiming commercial clearance from creature replacement **research** doc.
- Full-scene frame claims under load >25 on 18 cores — discard per progression report discipline.
- Lobby / GameLift / PlayFab implementation before solo story loop human-verified.

---

## 6. Honest one-week ceiling

### Erdős (7 days, local, $0)

**Achievable:** Lemma U progress or disproof at one order (`P=15`, `k=r` window localized by T-W); cross-order index automated; W1 seam support lemmas extended in Lean using `repDiff` kit; `β < 0.41` bracket documented with explicit literature tier.

**Not achievable:** Erdős Problem 170 solved or materially advanced; `β = 1/4` proved; `C-max` confirmed at r=3 without major compute; full M=16 multilift census; any published paper.

### Galevein (7 days)

**Achievable:** Hero stand-in or v0 original low-poly mount integrated; human playtest log through mid-route; region landmark filter v1; attribution line in credits if CC-BY stand-in; maintain 4/4 SIM green.

**Not achievable:** Commercial ship; App Store / Steam submission; legal clearance sign-off; multiplayer hub; final art pass on all landmarks; guaranteed 60 fps on integrated GPU under all loads.

---

## Report summary

### Paths written
1. `/Users/arnav/Desktop/dragon-storm-game/reports/AMBITION_AUDIT_2026-08-05.md`
2. `/Users/arnav/Documents/Codex/2026-08-01/erdos-170-research-lab/outputs/2026-08-05_AMBITION_AUDIT.md`

### Top 3 Erdős moves
1. **Lemma U injection** — read Wichmann r=1,2 collisions by hand; only path to `β=1/4` without petabyte search.
2. **Cross-order extremal index (A4)** — cheap table refutes repeated scope leaks; should have caught Wichmann in August.
3. **Lean extension** — reuse `repDiff_eq_card_filter` for next seam block; do not start new hypothesis families.

### Top 3 Galevein moves
1. **Hero swap** — Zagmatorah stand-in or scripted low-poly original; kills 1M-vert budget and IP risk.
2. **Human playtest** — one real run tutorial→beacon 8; SIM is necessary not sufficient.
3. **Landmark region filter** — wire `allowedLandmarkIds` so chapters read distinct; small code, high narrative payoff.

---

*Audit tier: synthesis from verified local artifacts (MEMORY_LOG, 2026-08-05 outputs, playability/chapter/creature reports, git log). No external API calls. Erdős 170 remains open. No legal clearance claimed for Galevein.*
