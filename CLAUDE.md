# CLAUDE.md

This file guides Claude Code's behavior in this repository. Update it as the project evolves.

## Project Purpose

A single-page web app for ranking sports teams on a 2D chart with **Goodness** (x-axis) and **Likeability** (y-axis) axes. Users drag team chips from a tray onto the chart to place them, and can export results as CSV. Supports **NFL** (32 teams) and **MLB** (30 teams) with a toggle to switch between sports.

## Architecture

Three files — no build step, no dependencies:

- `index.html` — markup only; links to `style.css`, `js/data.js`, and `js/app.js`
- `style.css` — all styles
- `js/data.js` — the `sports` data object (teams, divisions, colors per sport)
- `js/app.js` — all application logic; reads from `sports` declared in `data.js`

**Key data structures:**
- `sports` — object keyed by sport (`nfl`, `mlb`), each containing `teams`, `divisions`, `conferences`, `total`, and `divsPerConf`
- `placed` — flat object keyed by team ID storing `{ x, y }` positions for chips currently on the chart
- `currentSport` — string tracking the active sport

**Key functions:**
- `initChart()` — builds static chart decorations (gridlines, axis labels, quadrant labels)
- `renderTray()` — rebuilds the team tray split into two conference columns
- `renderChips()` — rebuilds all chip elements on the chart from `placed`
- `beginDrag(e, id)` — initiates a drag, creates a ghost element, removes team from `placed` if already on chart
- `setSport(key)` — clears `placed`, switches `currentSport`, re-renders tray and chart
- `openModal()` — builds and shows the rankings table sorted by Goodness then Likeability

**Coordinate system:** chart values run from -10 to +10 on both axes. Pixel position converts to/from this range via `(v - MIN) / RANGE * 100 + '%'`.

## Tech Stack

- Vanilla HTML/CSS/JavaScript — no frameworks, no bundler
- Drag implemented with `mousedown` / `mousemove` / `mouseup` events and a floating ghost element
- CSV export via `Blob` + `URL.createObjectURL`

## Coding Conventions

- Follow the style already present in the file being edited — don't reformat code that wasn't changed.
- Prefer editing existing files over creating new ones.
- Do not add comments unless the logic is genuinely non-obvious.
- Do not add error handling for scenarios that cannot occur.
- Keep abstractions close to where they are used; avoid premature generalization.
- All sport-specific data (teams, divisions) lives inside the `sports` object — do not add top-level `teams` or `divisions` variables.
- When adding a new sport, follow the existing `nfl`/`mlb` shape exactly: `{ label, total, conferences, divsPerConf, teams, divisions }`.

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
4. Update tests to cover the new behavior.

## Running the Project

Open `index.html` directly in a browser — no server or build step required.

> Note: some browsers block local `<script src>` loads when opening a file via `file://`. If the page is blank, serve the folder with any static server (e.g. `npx serve .` or VS Code Live Server).
