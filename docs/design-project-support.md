---
doc: design-note
project: teletubby
date: 2026-09-02
status: SHIPPED 2026-09-02 (commit 213e874) — create/switch/rename live, d01 attached to kybernesis-phase-1; guard refusals verified against the running app
source: plaud 0729 2026-09-02 (David's spec) · agent-a-day-orch narrowing · flihub-dev contract
---

# Project support — create / switch / rename

**Deliverable, in David's words**: *"get ready so that I can create new projects… create,
create, create, add scripts, and modify scripts. We can already add and modify scripts.
That's the only thing that we've got to do."* Three projects, one per upcoming video.
Script add/modify is explicitly out of scope. Per-script naming (video-script vs
chapter-script) is PARKED with David — nothing here depends on it.

## The contract with FliHub (verified by flihub-dev against code and disk — cite
`flihub/docs/architecture/project-codes.md`, not memory)

- Identity is **ONE string, the folder name**: `d01-kybernesis-12-videos`. Kebab rule is
  the only thing enforced; the letter+number series is convention. FliHub owns the
  grammar (`shared/naming.ts`, `projectResolver.ts`).
- Current truth: `d01-kybernesis-12-videos` is the ONLY d project. **No d00.** David
  names the next projects — never invent d02/d03.
- **FliHub has NO project rename.** Titles (`.flihub-state.json`, FR-157) are the
  renameable display layer; folder identity never changes. "Move" exists only as
  storage lifecycle, not identity change — in BOTH apps, by David's ruling: *"if the
  code is changing that's not a rename, that's a move, and that's a different problem."*
- Machine-readable while FliHub runs: `GET :5101/api/query/projects` and
  `/api/query/projects/:code` (prefix-tolerant); `POST /api/projects` creates. Do NOT
  read `v-appydave/projects.json` (DAM manifest, not the registry).

## The design

1. **`ScriptSet.project: string | null`** — the FliHub folder name VERBATIM. Never
   parsed into code+name fields; display may slice the `d01` prefix for a chip.
   Backfill: `kybernesis-phase-1` → `d01-kybernesis-12-videos`.
2. **`create_set`** input gains optional `project` (kebab-validated).
3. **`rename_set`** (new verb, HELD pending Swagger/David's confirm): changes `title`
   ONLY — which is precisely FliHub's FR-157 layer (mutable display titles over
   immutable folder identity), so it has an exact counterpart and NO desync surface.
   Swagger's rename concern applies to IDENTITY rename — which this verb refuses by
   construction: an input touching `project` errors with "that's a move, not a rename".
   Null→value is an **attach** (allowed; the backfill path). Value→different refused.
   David's transcript aspiration ("renaming should lead to renaming the folder") maps
   to the deferred MOVE, unbuilt in both apps — not to this verb.

   **The shared contract being authored here** (Teletubby implements first, FliHub
   adopts later per David's expected source-of-truth inversion): folder name = identity,
   immutable through the app; prefix-resolvable as convenience only; titles are mutable
   metadata on top; identity change = move, a distinct future verb pair in both apps.
4. **Switch is UI-only** — no agent verb, same rule as `set_active_context` (an agent
   must never move the talent). Two renderer changes: boot stops hardcoding `sets[0]`
   and honours `workspace.position.setId`; the setup panel gains a PROJECT section
   listing sets as chips, switch loads that set at its default script.
5. Capability-surface pin updated deliberately (+`rename_set`, widened `create_set`).

## flihub-dev's attach cautions (adopted)

- **Store the FULL folder name, never a prefix.** `d01` resolves by startsWith to the
  first ALPHABETICAL match on their side — lookup convenience, not identifier. If David
  types a short code at attach, resolve via `GET :5101/api/query/projects/:code` and
  persist the returned `.project.code`.
- **Existence-check is a courtesy, not a gate.** FliHub may be down, and its projects
  root holds non-project folders (poem, tools, catalog) and oddballs (x01-test).
  Behaviour: verify when 5101 answers; warn-and-store when it does not. Kebab-validity
  ≠ project-exists.

## Deferred by David explicitly — document, never build here

- "Promote" a Teletubby project into a new FliHub project (*"over time"*).
- Shared project-naming library between the apps (*"a problem for future days"*). The
  seam when it comes: extract FliHub's `shared/naming.ts` + `projectResolver.ts`.
- FliHub is source of truth for now; the inversion he expects later is not built.

## Scope guard (from the 0604 conversation, David's "Too far" ruling)

Tubby is teleprompter control plus cadence adjustment of someone else's script —
*"It's not our script writer, keep that in mind."* Nothing in this feature makes it one.

## Cost & state

~200 lines + tests. Not started. The other queue (version history + atomic write on the
`replaceTranscript` spine, then the four older tickets — see
`docs/checkpoint-2026-08-31-recording-day.md`) sits BELOW this per the recording
schedule. App currently down; start detached (`npm run app`) for verification when built.
