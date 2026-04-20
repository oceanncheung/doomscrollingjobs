# Session retros

Lightweight per-session record of what was done, what worked, and what to pick up next. Loads automatically at SessionStart via the hook in `.claude/settings.json` so the next session has continuity without re-briefing.

## When to write one

- After any **non-trivial** session — anything that ships a commit, makes a real decision, or leaves a hanging thread.
- **Skip** for trivial sessions (single-line typo, "what does this do?" Q&A, exploratory reads).
- The Stop hook leaves a stub at `docs/retros/YYYY-MM-DD-session.md` if nothing was written. Either fill the stub in or delete it.

## File naming

`docs/retros/YYYY-MM-DD-topic.md`

- Date prefix sorts chronologically.
- Topic is a short kebab-case noun phrase (`linkedin-resync-fix`, `claude-md-restructure`, `harness-overhaul`).
- Multiple retros per day are fine — just use different topics.

## Structure

Copy [`_template.md`](_template.md). Keep entries tight — bullets over prose. The retro is a memory aid, not a report.

## Lifecycle

- **Read** at SessionStart (latest retro auto-surfaces).
- **Write** at session end when something durable happened.
- **Prune** quarterly — older than ~3 months, archive or delete.
