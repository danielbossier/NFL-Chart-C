# CLAUDE.md

This file guides Claude Code's behavior in this repository. Update it as the project evolves.

## Project Purpose

<!-- Describe what this project does and why it exists. -->
<!-- Example: "A CLI tool for X", "A web app that does Y", "A library for Z" -->

_TODO: Add project description._

## Architecture

<!-- Describe the high-level structure of the project. -->
<!-- Example: directory layout, data flow, key modules and their responsibilities. -->

_TODO: Add architecture notes once the project structure is established._

## Tech Stack

<!-- List the primary languages, frameworks, and tools used. -->
<!-- Example: TypeScript, Node.js, React, PostgreSQL, Jest -->

_TODO: Add stack details._

## Coding Conventions

- Follow the style already present in the file being edited — don't reformat code that wasn't changed.
- Prefer editing existing files over creating new ones.
- Do not add comments unless the logic is genuinely non-obvious.
- Do not add error handling for scenarios that cannot occur.
- Keep abstractions close to where they are used; avoid premature generalization.

<!-- Add project-specific rules here as they emerge. Examples: -->
<!-- - Use named exports only (no default exports) -->
<!-- - All async functions must be awaited at the call site, never `.then()`-chained -->
<!-- - Tests live next to source files as *.test.ts -->

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

<!-- Fill in once the project has a build/run setup. -->
<!-- Example: -->
<!-- ```bash -->
<!-- npm install     # install deps -->
<!-- npm run dev     # start dev server -->
<!-- npm test        # run tests -->
<!-- ``` -->

_TODO: Add commands once the project is initialized._
