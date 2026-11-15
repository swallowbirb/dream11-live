# Project rules for Shubham Dream11

A prototype live-streaming platform for cricket creators and fans (Twitch-style, with match pages, live
scorecard and polls). The design is in `DESIGN.md`; the stack is decided there (§5.1). The build order,
timeboxes and prototype cuts are in `plan.md` (3 modules, steps, then per-step phase files under `plans/`).

## Speed over perfection (read first)

The whole prototype has a **4–5 hour budget**. This overrides polish and completeness everywhere else here.

- Build the happy path only. If it works when used normally in a demo, it's done.
- Stay inside the current step's scope and timebox in `plan.md`. Don't build anything `plan.md` lists as cut,
  even if `DESIGN.md` lists it under "Build now". Where they disagree, `plan.md` wins for the prototype.
- New ideas go to `plan.md` §8 (Parking lot), not into code. If a step runs over, cut using `plan.md` §7.
- Prefer seed data, hardcoded constants and in-memory state over settings screens and editors.
- Update the progress table in `plan.md` §9 when a step is done.

## Machine and paths (Linux)

- Fedora Linux: bash, case-sensitive filesystem, `/` paths.
- **Project root:** `/home/swallow/Dev Projects/Shubham Dream11` (note the space: quote every path). Work only here.

## Workflow

- **Git and GitHub: you own source control.** The user is a solo dev and wants Claude to manage the repo, no
  need to ask first.
  - Check `git status` at the start of a task so you know what's already uncommitted.
  - Commit after each completed, verified piece of work (builds clean, tests pass if they were run). One
    logical change per commit, with a clear message describing what and why.
  - Stage by path, not `git add -A` blindly. Never commit `node_modules/`, `dist/`/`build/` output, `.env` or
    other secrets, logs, local databases or generated files.
  - Push to `origin` after committing (once a remote is set). Use branches when a change is large or risky and
    merge when done.
  - Ask first before anything destructive or history-rewriting: force-push, `reset --hard`, rebase of pushed
    commits, deleting branches, `clean -fd`, or discarding uncommitted changes you didn't make.
- **Design doc:** keep `DESIGN.md` in sync. When scope, architecture, the data model or the API changes, update
  it in the same piece of work.
- **Stuck process:** if a dev server, app or tool looks hung, stop sending it commands, tell the user, and
  wait for them to say continue.
- **Phase handoff: update the docs at the end of every phase**, before the final commit, so the next phase can
  start in a fresh chat with no context:
  1. The current module's phase file in `plans/` (e.g. `plans/m1-live-core.md`): set the phase's row in its
     **Status** table to done with the date, write short handoff notes (what exists, where, gotchas found,
     anything cut or changed from the plan), and update the **Next up** line.
  2. `plan.md` §9 when a whole step is done; §6/§7 if something was cut; §8 for new ideas.
  3. This file's **Commands** section if a command was added or changed.
  4. `DESIGN.md` if scope, architecture, the data model or the API changed.
- **Starting a phase in a new chat:** read this file, then the current module's phase file in `plans/` (its
  Status table says what's next), then do that phase only.
- **Verify it yourself.** Don't ask the user to click through browsers. Run the check headless with Playwright
  (Chromium with a fake camera and mic), the way `spike/check.mjs` does, and look at its screenshot.

## Commands

- **pnpm** is in `~/.local/bin` (pnpm 9; there is no corepack on this machine).
- **LiveKit keys:** `spike/.env` (gitignored; `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, project
  "Dream12" on LiveKit Cloud). Never print the secret.
- **Spike (`spike/`):** `pnpm start` serves http://localhost:5180 (`?role=publisher` / `?role=viewer`).
  `pnpm media` generates `test-media/match.webm` (WebM, since Playwright's Chromium can't play H.264).
  `pnpm check` runs the headless publish → watch check against a running `pnpm start` and writes
  `test-media/viewer.png`. Stop a background server by its PID, not `pkill -f` (it matches its own shell).

TODO: the rest is filled in during M1 P2 (scaffold): install, dev server, build, typecheck. Stack: pnpm monorepo,
`apps/web` (Vite + React), `apps/server` (Fastify + Socket.IO + Prisma on SQLite), `packages/shared`.

## Build and typecheck

- Use the project's real build and typecheck commands. Never write a modified copy of a config or generated
  file just to type-check edits.
- A task touching several files: make all the edits first, then build or typecheck once at the end.
- Skip the build for changes that can't affect it: comments, whitespace, Markdown, docs, JSON or config text.
- Don't re-verify a file that hasn't changed since the last clean build.
- If the build can't be run, ask the user exactly what to run and what to report back, then wait.

## Tests

- **Strict test budget.** Don't run obvious, self-evident, redundant, broad or defensive tests for extra
  confidence when inspection or a build can verify the change. Build checks are separate and still happen.
- **Skip tests** for renames, one-line tweaks, constant or default-value changes, formatting, comments, doc
  updates, a log string, or a colour or magic number.
- **Run tests** for new or changed logic, edge cases, persisted data, and state machines (live/offline state,
  chat, polls and WebSocket flows count).
- If unsure whether a change is quick and simple, don't run tests, and say so. The user can ask for a test pass.
- **Keep runs short.** Use a narrow filter while iterating. Run the full suite once at the end of a piece of work.
- For a long-running job: start it once, don't re-trigger it, and read the result file or output instead of
  polling a status that can be wrong.

## Working efficiently

- **Never conclude something is missing from a search miss.** Read the file directly or check the running app
  before reporting a gap.
- Discover what a tool can do before guessing at command names. Prefer machine-readable output (`--format
  json`) when parsing.
- Batch related calls and run independent reads in parallel.
- Check that a service is up once per session, and again only after a real failure. Reuse results you already
  have if nothing has changed.

## Safety

Confirm before high-impact actions: deleting data or files, bulk edits, deploys, dropping or resetting
database tables. Local, reversible edits (changing a value, adding a component, reading state, screenshots)
need no ceremony.
