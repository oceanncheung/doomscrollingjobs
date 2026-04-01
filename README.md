# AI Job Search Dashboard & Application Prep Hub
_Last updated: April 1, 2026_

## 1. Product Definition

Build a **job search dashboard and application-prep hub for designers**.

This is **not** a full auto-apply bot in the first phase.

The product should help a designer:

- automatically discover relevant jobs
- prioritize **quality-first** opportunities
- filter for **remote-only**
- evaluate salary potential
- support **graphic design + adjacent roles**
- generate all application materials needed for each job
- prepare field-by-field content for manual submission
- adapt the resume per job while keeping **one core user profile**

## 2. Product Goal

Create a system that behaves like a **designer job operating system**, not a spray-and-pray tracker.

The product should answer:

- Which jobs are worth applying to?
- Which remote roles are highest quality?
- Which roles fit the user's real experience and portfolio?
- Which resume version and portfolio link should be used?
- What text should be pasted into each application field?
- What has already been applied to, skipped, or followed up on?

## 3. Phase 1 Scope

Phase 1 is a **job discovery, ranking, and application-prep system**.

It should:

- collect jobs from a small set of sources
- normalize and deduplicate job records
- score jobs against one canonical user profile
- rank remote roles by quality first and salary second
- support designer-first and adjacent design roles
- let the user shortlist, dismiss, and track jobs
- generate application materials for **manual** submission

Phase 1 does **not** include direct application submission automation.

## 4. Confirmed Product Rules

- Primary user is a designer; adjacent design roles are allowed when fit is strong.
- Each user has **one core profile**.
- Resume tailoring happens **per job** from that source profile.
- Remote is a **hard requirement**.
- Quality and salary are the most important ranking factors after remote.
- Portfolio strategy is first-class, not an afterthought.
- AI should prepare application content, but the user stays in control of the final submission.

## 5. Recommended Stack

- **Next.js** for the web app and authenticated dashboard
- **Supabase** for auth, Postgres, storage, and row-level security
- **GitHub** for source control, issue tracking, and CI/CD
- **OpenAI / Anthropic / Google models** routed by task for parsing, scoring, and generation
- **Playwright** later for browser-assisted workflows, once manual apply prep is working
- **PostHog** later for product analytics and funnel instrumentation
- **Sentry** later for production error monitoring

## 6. Repo Contents

This initial commit is intentionally docs-first. It establishes the product, data, and scoring foundation before app scaffolding begins.

- `README.md` -> project overview and implementation direction
- `PRD.md` -> Phase 1 product requirements
- `SCHEMA.md` -> initial data model
- `SCORING.md` -> job ranking framework
- `TASKS.md` -> practical execution checklist
- `DECISIONS.md` -> accepted product and architecture decisions
- `.gitignore` -> baseline ignore rules for a modern Next.js/Node repo

## 7. Recommended Future Project Structure

Planned structure once the app is scaffolded:

- `app/` -> Next.js routes, layouts, and server actions
- `components/` -> UI components for dashboard, detail views, and packet review
- `lib/` -> shared utilities for parsing, scoring, prompt orchestration, and exports
- `supabase/` -> SQL schema, policies, seeds, and local config
- `docs/` -> later home for long-form documentation if repo docs expand

## 8. Next Steps

1. Convert `SCHEMA.md` into the first Supabase schema and row-level security plan.
2. Define ingestion contracts for raw jobs, normalized jobs, and deduplication.
3. Build the scoring service around the hard-filter plus weighted-score model in `SCORING.md`.
4. Scaffold the Next.js app and first authenticated flows:
   - profile setup
   - jobs dashboard
   - job detail view
   - application packet review
5. Add generation services incrementally:
   - job parsing
   - scoring explanations
   - resume tailoring
   - portfolio recommendation
   - field-by-field application prep
