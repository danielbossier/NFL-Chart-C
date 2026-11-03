# CLAUDE.md

This file guides Claude Code's behavior in this repository. Update it as the project evolves.

## Project Purpose

A single-page web app for ranking sports teams on a 2D chart with **Goodness** (x-axis) and **Likeability** (y-axis) axes. Users drag team chips from a tray onto the chart to place them, and can export results as CSV. Loading several CSVs combines multiple people's rankings into an **aggregate** (mean position, with a halo showing disagreement), and loading CSVs from different weeks shows a **season** view of how teams moved. Supports **NFL** (32 teams), **MLB** (30 teams), and **NBA** (30 teams) with a toggle to switch between sports. Fully responsive with mobile touch support.

## Architecture

Four files — no build step, no dependencies:

- `index.html` — markup only; links to `style.css`, `js/data.js`, and `js/app.js`
- `style.css` — all styles, including a `@media (max-width: 700px)` block for mobile
- `js/data.js` — the `sports` data object (teams, divisions, colors per sport)
- `js/app.js` — all application logic; reads from `sports` declared in `data.js`

**Key data structures:**
- `sports` — object keyed by sport (`nfl`, `mlb`, `nba`), each containing `teams`, `divisions`, `conferences`, `total`, and `divsPerConf`
- `placed` — flat object keyed by team ID storing `{ x, y }` positions for chips currently on the chart
- `currentSport` — string tracking the active sport
- `aggregate` — `null`, or `{ count, teams, label, short, history }` while viewing several loaded CSVs. Files are grouped into weeks by filename (`weekOf()`); `history` holds each week's aggregate oldest-first, and `teams`/`count` describe the latest week. Each team stores mean `x`/`y`, raw `pts`, and `spread` (standard deviation of entries around the mean point). With more than one week (`inSeason()`), the chart shows each team's trail and the table adds change columns. The chart is read-only in this mode.

**Key functions:**
- `initChart()` — builds static chart decorations (gridlines, axis labels, quadrant labels)
- `renderTray()` — rebuilds the team tray split into two conference columns
- `renderChips()` — rebuilds all chip elements on the chart from `placed`, or from `aggregate.teams` (read-only chips with hover/tap focus) when an aggregate is loaded
- `clientXY(e)` — normalizes mouse and touch events to `{ x, y }` coordinates
- `startDrag(id, x, y)` — creates the ghost element, removes team from `placed` if already on chart (re-renders the tray only), registers the non-passive `touchmove` listener
- `beginDrag(e, id)` — used for chart chips (mouse or touch); calls `preventDefault()`, hides (not removes) the chart chip being dragged, and delegates to `startDrag`
- `beginDragTouch(e, id)` — used for tray chips; records `pendingTouch` without blocking scroll, registers non-passive `touchmove` to detect drag threshold
- `onDragMove(e)` — handles `mousemove` and `touchmove`; moves ghost, highlights chart when over it
- `onDragEnd(e)` — handles `mouseup`, `touchend`, and `touchcancel`; places chip on chart or returns it to tray, then re-renders chips
- `setSport(key)` — clears `placed` and `aggregate`, switches `currentSport`, re-renders tray and chart
- `openModal()` — builds and shows the rankings table sorted by Goodness then Likeability; adds a Spread column for an aggregate and Δ Good / Δ Like columns (first week → latest) in season view. Downloads are named `<sport>-<YYYY-MM-DD>.csv` (local date), with `-aggregate` appended for aggregates.
- `parseCSV(text)` — parses an exported CSV into `{ teamId: { x, y } }` for the current sport; ignores extra columns and malformed lines
- `weekOf(filename)` — reads the week from a filename (see Loading CSVs)
- `buildAggregate(entries)` — combines one week's parsed CSVs into `{ count, teams }`
- `inSeason()` — true when the loaded aggregate spans more than one week
- `renderSpread(t, id, pos)` — draws a halo ring (radius = `spread`) behind the team's mean chip; for a single week, adds each person's entry as a dot tethered to the chip (shown on hover/tap, which also dims every other team)
- `renderTrail(spread, t, id)` — in season view, draws the team's path through each week as an SVG polyline (faint by default, full with week labels on hover/tap)

**Coordinate system:** chart values run from -10 to +10 on both axes. Pixel position converts to/from this range via `(v - MIN) / RANGE * 100 + '%'` (helpers `pctX()` / `pctY()`). The chart is square, so a `%` of its width is the same length in either direction — halos and tethers rely on this.

## Loading CSVs

`Load CSV` accepts one or many files:
- **One file** → loaded into `placed` as an editable ranking.
- **Several files, one week** → an aggregate: mean position per team, halo radius = standard deviation. Teams a person didn't place are excluded from that team's stats, not counted as 0.
- **Files from two or more weeks** → season view: chips at the latest week's aggregate, trails through earlier weeks.

The week comes from the filename via `weekOf()`: a `YYYY-MM-DD` date is grouped into Tuesday–Monday weeks (labelled "Week of Oct 27"); otherwise the first number is the week (`week3.csv`); otherwise "Undated" (sorts first). Browser duplicate suffixes like `(1)` are stripped first. The sport is auto-selected if the first filename contains `nfl`, `mlb`, or `nba`.

Don't load an `-aggregate` CSV alongside the files it was built from — its date makes it count as another entry for that week.

## Tech Stack

- Vanilla HTML/CSS/JavaScript — no frameworks, no bundler
- Drag implemented with `mousedown`/`mousemove`/`mouseup` and `touchstart`/`touchmove`/`touchend`/`touchcancel` events with a floating ghost element
- Touch listeners on the document `touchmove` are added dynamically (non-passive) only when a drag is active, and removed on `touchend` — this allows normal tray scroll when not dragging
- **Never remove the element a touch started on while that touch is active.** Touch events stay targeted at it, and a detached element doesn't bubble `touchend` to `document` — the ghost gets stuck on screen. Hide it instead and let `onDragEnd` re-render.
- Aggregate hover/tap focus uses `mouseenter`/`mouseleave`, which mobile browsers emulate on tap
- CSV export via `Blob` + `URL.createObjectURL`; CSV import via `File.text()`
- The file input has no `accept` filter on purpose — mobile pickers filter by MIME type, and CSVs are often reported as `text/plain` or `application/octet-stream`, which greys them out

## Mobile Layout

At ≤ 700px:
- The page does not scroll — `html, body` are `position: fixed; height: 100%; overflow: hidden`
- The chart is fixed-height at the top (`flex: 0 0 auto`)
- The team tray fills remaining space below and scrolls independently
- The two conference columns remain side-by-side (not stacked) with a larger gap (`48px`) for easier scrolling
- Drag works via touch events

## Coding Conventions

- Follow the style already present in the file being edited — don't reformat code that wasn't changed.
- Prefer editing existing files over creating new ones.
- Do not add comments unless the logic is genuinely non-obvious.
- Do not add error handling for scenarios that cannot occur.
- Keep abstractions close to where they are used; avoid premature generalization.
- All sport-specific data (teams, divisions) lives inside the `sports` object in `js/data.js` — do not add top-level variables.
- When adding a new sport, follow the existing shape exactly: `{ label, total, conferences, divsPerConf, teams, divisions }`.
- All drag handlers must support both mouse and touch events via `clientXY()`.

## Debugging

When investigating a bug:
1. Read the error message and stack trace carefully before touching code.
2. Reproduce the issue with the smallest possible input.
3. Check recent changes (`git log -p`) if the bug is a regression.
4. Fix the root cause; do not paper over symptoms with try/catch or guards.

## Adding Features

When adding a feature:
1. Read the existing code in the relevant area first — understand before modifying.
2. Make the smallest change that satisfies the requirement.
3. Do not add configuration flags or extension points for hypothetical future needs.

## Running the Project

Open `index.html` directly in a browser — no server or build step required.

> Note: some browsers block local `<script src>` loads when opening a file via `file://`. If the page is blank, serve the folder with any static server (e.g. `npx serve .` or VS Code Live Server).

## Deployment

Pushing to `main` deploys the whole repo to GitHub Pages via `.github/workflows/static.yml`. Live site: https://danielbossier.github.io/NFL-Chart-C/

GitHub Pages serves files with `Cache-Control: max-age=600`, so a normal reload can show the previous version for up to 10 minutes after a deploy — hard refresh (or wait) before judging whether a change worked, especially on mobile.
