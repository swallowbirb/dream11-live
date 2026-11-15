# Project rules for Shubham Dream11

A prototype live-streaming platform for cricket creators and fans (Twitch-style, with match pages, live
scorecard and polls). The design is in `DESIGN.md`. The stack is not final (see DESIGN.md §5.1), so fill in
the build, typecheck and test commands under "Commands" once it is chosen.

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

## Commands

TODO: fill in once the stack is chosen: install, dev server, build, typecheck, test (all, and a single file).

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
