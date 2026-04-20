# CLAUDE.md — Doom Scrolling Jobs

Designer job operating system. Phase 1: single-user internal tool. Discovery → ranking → manual application prep. No auto-apply.

**Stack:** Next.js App Router · TypeScript · Supabase (Postgres) · custom split CSS architecture · Cloud Run deploy via GitHub Actions on push to `main`.

This file is the canonical AI entrypoint. Read it first; it tells you which deeper doc owns each topic.

---

## Read first, then act

| Task | Read before editing |
|------|---------------------|
| Any CSS or TSX | [UI_CHANGE_PROTOCOL.md](UI_CHANGE_PROTOCOL.md) → [DESIGN.md](DESIGN.md) → [AGENTS.md](AGENTS.md) |
| New surface or component family | [DESIGN.md](DESIGN.md) §1–4 + [AGENTS.md](AGENTS.md) "Protected Surfaces" |
| Database schema or migrations | [SCHEMA.md](SCHEMA.md) |
| Scoring / ranking logic | [SCORING.md](SCORING.md) |
| Product behavior or scope question | [PRD.md](PRD.md) → [DECISIONS.md](DECISIONS.md) → [TASKS.md](TASKS.md) |
| Quality verification / harness | [docs/repo-harness.md](docs/repo-harness.md) |
| Deployment | [docs/cloud-run-deployment.md](docs/cloud-run-deployment.md) |
| Grid + responsive contracts | [docs/grid-audit-2026-04/grid-inventory.md](docs/grid-audit-2026-04/grid-inventory.md) |

---

## Hard rules (no exceptions without explicit approval)

1. **Work on `main` directly.** No feature branches, no Claude worktrees. If `.claude/worktrees/*` exists, those are stale — do not create more.
2. **Verify before claiming done.** Run the smallest relevant verification (`npm run typecheck`, smoke, or `npm run eval` if a scored layer is touched) and show output. Never report success without proof.
3. **One fix per commit.** Atomic. Don't bundle "while I'm here" cleanup into a bug fix.
4. **Never edit generated artifacts** — `.next`, `.next 2`, `.trace`, `cache/`. Treat `.codex-artifacts/` as read-only inputs.
5. **Never touch `.env*`, secrets, `middleware.ts`, auth, or payment handlers** without explicit approval.
6. **Preserve the editorial design language.** No card-heavy, rounded, shadowed, gradient, or generic SaaS conversions. See [AGENTS.md](AGENTS.md) "UI Red Lines" + "Custom UI Protection Rules".
7. **Root-first fixes.** Identify the layer (token → shared contract → shared component → surface) and edit at the root, not the symptom. See `feedback_root_first_ui_fixes` memory.
8. **After `git push origin main`, start a background Monitor on the Cloud Run deploy** and notify when complete. See [docs/cloud-run-deployment.md](docs/cloud-run-deployment.md) and `feedback_post_push_deploy_monitor` memory.

---

## Scope discipline

This repo's CSS-contract architecture means a *correct* fix often spans token + shared contract + 1–2 surfaces. Hard line caps (50/bug, 300/feature) would force gaming or half-finished work. Use these instead:

- **Default surgical.** Smallest change that resolves the reported issue.
- **One logical change per session.** Do not bundle unrelated cleanup.
- **Pause-and-explain trigger:** if a single fix spans **5+ files** or **>100 lines**, stop and explain the scope before continuing.
- **Files-touched matters more than line count** in this repo. A 90-line fix in one stylesheet is healthier than a 40-line fix scattered across 6 surfaces.
- **Stage commits per logical sub-change** for legitimate multi-step refactors.

---

## Default workflow

1. If continuing harness work, read `.codex-artifacts/eval/latest/report.json` and `report.md` first.
2. Identify the owning surface, shared component, and stylesheet before editing.
3. Edit at the root layer, not at the symptom.
4. Run the smallest relevant verification first (`npm run typecheck`, route smoke). Rerun `npm run eval` only if a scored layer is affected.
5. Commit atomically. Push. Start the Cloud Run deploy monitor.

The full harness triage workflow lives in [docs/repo-harness.md](docs/repo-harness.md).

---

## Subagent delegation

For **broad** codebase exploration or research that needs more than 3 searches, delegate to the `Explore` subagent — it returns a summary and keeps the main context lean. For **focused** lookups (one file, one symbol), use Read/Grep directly.

---

## Memory

Persistent memory at `~/.claude/projects/-Users-oceancheung-Documents-Startup-MM-S-z-misc--Doom-Scrolling-Jobs/memory/`. Files prefixed `user_`, `feedback_`, `project_`, `reference_`, indexed by `MEMORY.md`. The index loads automatically each session — read individual files when their description matches the task.

Save new memories when you learn:
- A user preference or feedback correction (`feedback_*`)
- A project fact, deadline, or stakeholder context (`project_*`)
- A pointer to an external system (`reference_*`)
- Personal context about the user (`user_*`)

Do **not** save things derivable from the code, git history, or these docs.

---

## Verification commands (quick reference)

```
npm run typecheck       # fastest sanity check
npm run lint
npm run check           # lint + typecheck + ui-system audit + build
npm run eval            # full 4-layer harness — only when a scored layer is touched
npm run capture:ui      # regenerate UI screenshots only
```

Smoke tests and per-layer evals: see [docs/repo-harness.md](docs/repo-harness.md).
