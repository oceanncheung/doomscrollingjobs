# Agent notes (UI system + profile/settings)

> **Read [CLAUDE.md](CLAUDE.md) first** for project-wide hard rules, doc map, scope discipline, and verification commands. This file owns UI-specific governance — stylesheet ownership, protected surfaces, shared contracts, and refinement scope.

Use this when editing UI code in this repo, especially:
- `app/globals.css`
- `app/styles/*.css`
- `components/profile/profile-form.tsx`
- dashboard / detail / prep surfaces

## First principles

- Preserve the current layout unless the request explicitly changes it.
- This repo uses a split CSS architecture. Do **not** treat `app/globals.css` as the styling home.
- Generated artifacts are never part of the design system. Do not edit `.next`, `.next 2`, caches, or traces.
- Before editing CSS or TSX, read [DESIGN.md](DESIGN.md) (design language + spec) and [UI_CHANGE_PROTOCOL.md](UI_CHANGE_PROTOCOL.md) (stylesheet ownership map + edit protocol). This file owns governance (red lines, protected surfaces, contracts), not the protocol itself.

## UI work expectations

For harness workflow, verification commands, and scope discipline → [CLAUDE.md](CLAUDE.md) + [docs/repo-harness.md](docs/repo-harness.md). For UI work specifically:

- Always operate on a single issue at a time. Do not bundle multiple fixes.
- Use `repo-harness-triage` for diagnosis and `repo-controlled-fix-loop` for implementation unless instructed otherwise.
- If no failure exists, pick the highest-value weak spot from the latest eval — do not invent new work.
- Rerun `npm run eval` when the change affects a scored layer, shared contract, workflow behavior, UI contracts, or UI artifacts. Otherwise rerun the smallest relevant verification first.

## Custom UI Protection Rules

- Preserve the existing custom design language across the product.
- Do **not** normalize bespoke UI into generic design-system output.
- Do **not** replace custom components with generic abstractions unless the user explicitly instructs that refactor.
- Do **not** make broad global visual refactors unless the user explicitly asks for them.
- Prefer surgical fixes over broad cleanup.
- Treat current visuals as intentional unless they are clearly broken, inconsistent within the same pattern family, inaccessible, or unresponsive.
- Consistency means preserving the logic of related pattern families, not flattening the whole product into one uniform layout.
- When adjusting UI, preserve the editorial grid, ruled seams, monochrome hierarchy, and custom split-shell composition unless the request explicitly changes them.
- When a surface looks custom rather than accidental, assume that character is part of the product and should be protected.

## UI Consistency Refinement Scope

Allowed without extra approval:

- spacing and gap consistency
- alignment fixes
- text hierarchy refinement for elements serving the same role
- padding consistency
- same-family button/control sizing consistency
- responsive spacing and alignment fixes
- removal of obvious visual drift across related pages or pattern families

Not allowed without explicit instruction:

- layout structure changes
- composition changes
- replacing component types
- redesigning buttons or controls
- global typography redesign
- global spacing-system redesign
- visual simplification that removes intended character
- flattening intentionally different pages into one pattern

This refinement zone exists to improve implementation consistency, not to redesign the UI. Keep layout, composition, component choices, and the custom design language intact while fixing local drift.

## Frontend Logic Refinement Scope

Allowed without extra approval:

- extracting duplicated frontend logic into shared helpers or hooks
- simplifying component state handling
- improving loading, empty, and error-state consistency
- reducing fragile conditional rendering branches
- tightening boundaries between UI components and server/data logic
- improving type safety and shared transformation logic
- removing dead or obviously stale frontend paths when confidence is high

Not allowed without explicit instruction:

- broad architectural rewrites
- changing product behavior
- replacing core state-management patterns globally
- moving large areas of logic across the app at once
- refactoring unrelated files as cleanup
- changing route structure or API contracts unless required by the issue

This refinement zone exists to improve implementation quality and maintainability, not to redesign the product architecture.

## Sameness Rule

- Consistency should follow semantic role and pattern family.
- Elements that serve the same role should feel related.
- Elements with different roles or emphasis do **not** need to be forced to match.
- Same-family buttons should have consistent height, padding, and text/icon spacing unless a difference is clearly intentional.

## UI Red Lines

- Do **not** change brand-defining components without explicit instruction.
- Do **not** change flagship page composition without explicit instruction.
- Do **not** change motion behavior or distinctive layout rhythms without explicit instruction.
- Do **not** turn the current ruled editorial UI into card-heavy, rounded, shadowed, gradient, or generic SaaS styling.
- Do **not** merge distinct pattern families just to make the product feel more uniform.

### Visual deny-list (never introduce any of these without explicit instruction)

- Shadows of any kind (box-shadow, drop-shadow, elevation)
- `border-radius > 0` — the system is 0px radius everywhere
- A second accent color — `#D4E700` chartreuse is the only chromatic hue
- Gradients (linear, radial, conic)
- Rounded pills, chip-like rounded containers
- Decorative CSS (dot patterns, background illustrations, non-structural ornamentation)
- Accent as **text color** on white backgrounds (insufficient contrast)
- Accent as **link color** — links are black, underline-on-hover, not accent
- Font weight 700 at sizes below 32px — Light (300) at display, Regular (400) at body, Medium (500) for labels, SemiBold (600) for emphasis

### Protected Surfaces

- Global workflow header and queue navigation:
  - `app/layout.tsx`
  - `components/navigation/workspace-header.tsx`
  - `app/styles/tokens.css`
  - `app/styles/responsive.css`
- Split workspace shell and rail seam:
  - `components/navigation/workspace-surface.tsx`
  - `components/navigation/workspace-rail-shell.tsx`
  - `app/styles/shell.css`
- Editorial page-header language:
  - `components/dashboard/queue-meta.tsx`
  - `components/ui/page-intro-header.tsx`
  - `components/jobs/job-flow-header.tsx`
  - `app/styles/dashboard/queue-meta.css`
  - `app/styles/settings/page-shell.css`
- Queue row family and action bands:
  - `components/dashboard/potential-row.tsx`
  - `components/dashboard/saved-row.tsx`
  - `components/dashboard/stage-row.tsx`
  - `app/styles/dashboard/queue-rows.css`
  - `app/styles/controls.css`
- Profile elevated controls and seam logic:
  - `components/profile/profile-form-controls.tsx`
  - `components/profile/sections/job-targets-section.tsx`
  - `components/profile/sections/experience-strengths-section.tsx`
  - `components/profile/sections/cover-letter-strategy-section.tsx`
  - `app/styles/settings/elevated-controls.css`
- Source upload row:
  - `components/profile/sections/application-materials-section.tsx`
  - `app/styles/forms/uploads.css`
  - `app/styles/forms/settings-fields.css`
- Flagship route structures:
  - `/`
  - `/dashboard`
  - `/profile`
  - `/jobs/[jobId]`
- Internal reference surface:
  - `/system-inventory`
  - `app/system-inventory/page.tsx`
  - `components/system/system-inventory-page.tsx`

## Shared control + hairline contract

- The base `.button` contract lives in `app/styles/controls.css`. Do not define root `.button`, `.button-primary`, `.button-ghost`, `.button-small`, `.button__label`, or `.action-note*` selectors anywhere else.
- Surface styles may size or place buttons, but they should not re-own button reset/centering mechanics unless the user explicitly asks for a visual change.
- Queue-column hairlines must use the shared edge-bleed variables from `app/styles/controls.css` instead of reintroducing raw `calc(-1 * var(--queue-column-pad))` math in pseudo-element rules.
- Treat UI cleanups as zero-diff by default. If a request is about a bug like centering or flush edges, fix the contract without redesigning the surrounding UI.

## Grid-cell contract

The site-wide grid contract lives in `app/styles/utilities/grid.css` (Commits 3–4 of the 2026-04 grid audit). The rule is simple:

- First cell of a row: `padding-left: 0`. Container's page padding (typically `var(--queue-column-pad)`) provides the left inset. Do NOT set cell-level `padding-left` on the first cell.
- Non-first cells: `padding-left: 0`. Text aligns to the invisible column grid line. Buttons below share the same left edge as text above — no half-pixel drift between headings and controls.
- Breathing between cells: owned by the surface via `gap: var(--grid-gap-*)` on the grid container OR via `padding-right: Npx` on the cell. Never set a `padding-right` default on the utility itself (that would double-breathe any gap-based grid).
- Last cell, when flush to viewport: `padding-right: 0`. Pair with the edge-flush contracts in `queue-rows.css` / `responsive.css` / `settings-fields.css` to zero the button's border at the viewport edge.

Utility classes (opt-in annotation):
- `.u-grid-cell` — non-first cell marker (`padding-left: 0`).
- `.u-grid-cell--first` — first cell marker.
- `.u-grid-cell--first-inset` — first cell for nested grids without a padded container.
- `.u-grid-cell--last` — pairs with viewport-edge-flush.
- `.u-grid-cell--gap-tight` / `--gap-standard` / `--gap-spacious` / `--gap-section` — opt-in cell-level `padding-right` for surfaces that don't use grid `gap`.

The full inventory of grids + their contract status lives at `docs/grid-audit-2026-04/grid-inventory.md`. When adding a new grid anywhere, skim the inventory's "Adding a new grid" section at the bottom.

Edge-flush is a separate contract — the viewport is not a painted container, so button clusters that bleed to the viewport edge must zero the viewport-adjacent borders and (where needed) anchor top hairlines at the bar level. Four named blocks currently own this concern; see the inventory doc for the list.

## Elevated controls (single pattern)

**Additional filters** (`details.settings-action-disclosure`) and **Experience tabs** (`.settings-tab-shell`) share one layout contract—keep them in sync.

1. **Vertical stack on the profile form**: `.settings-main` uses **`--settings-stack-gap: 24px`** for spacing between major blocks (section grid gap, disclosure body gap). **Do not** add extra `margin-top` on `.settings-action-disclosure` or `.settings-tab-shell`—rely on that gap. Label/textarea/helper stacks use **`.field` / `.upload-slot` gap `6px`** under `.settings-main` for upload-style blocks.

2. **Open surface (Additional filters)**:
   - **`details[open]`**: horizontal bleed only — **`background: transparent`**, **`padding-bottom: 0`**. The **summary row** stays **page white** (`var(--bg)`) to the **right** of the chip; **grey fill is only** the **tab chip** + **`.settings-action-body`**.
   - **`.settings-action-body`**: grey background, **`border-top: 1px solid var(--line)`** (full width), **`padding-bottom: calc(24px + 48px)`** for the tail. **`margin-bottom: -1px`** + **`z-index`** on the **open chip** so the chip’s grey overlaps the body’s top rule — the black line **only reads to the right** of the tab (one continuous grey from chip into content).
   - **`.settings-action-toggle`**: **`border-bottom: none`** always (closed and open). When **open**: grey fill, **L/T/R** black borders, **`margin-bottom: -1px`**, **`z-index: 2`**.

3. **Experience tabs:** Same bleed on **`.settings-tab-shell.has-selection`**; panel/body rules can mirror the above pattern where applicable.

4. **Toolbar** (tabs only): When `has-selection`, same horizontal inset as inner panel: `padding-left: var(--queue-column-pad); padding-right: var(--settings-section-pad-right);` so tab chips line up with padded content. Background **`var(--surface-soft)`**; active tab **`var(--bg)`**.

## Application materials (`#source-files`)

- **Secondary column** (`settings-source-secondary`): **`padding-bottom: 48px`** under the portfolio upload.

## Vertical rhythm (section / disclosure blocks)

- **`padding-bottom: 48px`** on **`.settings-main > details.disclosure` only** — not on the job targets **`section`**, or a white band appears under **closed** Additional filters.
- **`.settings-main .profile-form-footer`**: **`padding-bottom: 48px`**.

## Job targets fields

- **Ideal roles**: `settings-search-brief` textarea keeps the standard `.field` bottom border (do not zero it).

## Text fields

- Default: transparent background, **bottom border only** on `.field` inputs/textareas (plus listed exceptions in `globals.css`).
