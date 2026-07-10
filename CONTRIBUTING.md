# Contributing to e-module-builder

## Prerequisites

- Node.js ≥ 20
- npm ≥ 10

## Setup

```bash
git clone <repo-url>
cd e-module-builder
npm install
```

## Dev workflow

```bash
npm run dev
```

This starts a Vite dev server at `http://localhost:5173` using the testbed module (`testbed/content/`). The server shows a working 2-week CSS Grid module immediately — no separate content project needed.

**How it works:**

- `scripts/dev-testbed.mjs` spawns `bin/cli.js dev` with its working directory set to `testbed/`, so `process.cwd()` resolves to the testbed.
- The CLI copies `src/js/`, `src/css/`, and `src/partials/` into `testbed/src/`, then runs the content pipeline (`build.mjs`), then starts Vite.
- Any change to a file under `testbed/content/` triggers a full content-pipeline rebuild and a browser reload automatically (80 ms debounce).
- Changes to `src/js/**` or `src/css/**` are picked up by Vite's HMR without a full rebuild.

Generated files (`testbed/src/`, `testbed/pages/`, `testbed/index.html`) are listed in `testbed/.gitignore` and should not be committed.

## Modifying the testbed

The testbed lives in `testbed/content/` and mirrors the structure of a real content project:

```
testbed/content/
  module.md            ← module-level metadata (name, weeks, exerciseMode, …)
  week1/
    theory.md          ← week theory page (YAML frontmatter + Markdown body)
    quiz.md            ← mid-week quiz (questions in YAML frontmatter)
    assignment.md      ← hand-in assignment (criteria + Markdown case description)
    exercises/
      _meta.md         ← exercise hub metadata (title, color)
      1.md             ← exercise (type: css-playground | areas | responsive | external | text)
      2.md
      …
  week2/
    …
  assessments/
    theory-assessment.md     ← final theory assessment (questions in YAML)
    practical-assessment.md  ← final practical assessment
```

**To add a week:** create `testbed/content/weekN/` with the same structure, then increment `weeks:` in `module.md`.

**Exercise types** are controlled by the `type:` field in each exercise file:

| Type | What it renders |
|------|----------------|
| `css-playground` | Monaco CSS editor with live preview and automated checks |
| `areas` | Drag-and-drop grid-template-areas builder |
| `responsive` | Monaco CSS editor with resizable viewport preview |
| `external` | Link-out card with a URL |
| `text` | Description-only card (no interactive element); supports inline x-components in the markdown body |

**Interactieve x-components** kunnen ingebed worden in theorie, tekstoefeningen, inleveropdrachten en het praktijk-meetmoment (`assessments/practical-assessment.md`). Labels en metadata staan centraal in `src/js/x-components/registry.js` — elke module krijgt ze automatisch via de build pipeline en runtime hydration via `initProseContent()`.

| Tag | Bestand | Wat het doet |
|-----|---------|--------------|
| `<x-keuzevraag>` | `keuzevraag.js` | Meerkeuzevraag met directe feedback |
| `<x-koppelvraag>` | `koppelvraag.js` | Koppel termen aan definities |
| `<x-vind-de-fout>` | `vind-de-fout.js` | Vind de fout in een codestuk |
| `<x-woordzoeker>` | `woordzoeker.js` → [`components/word-search/`](../src/js/components/word-search/) | Woordzoeker met module-trefwoorden |
| `<x-invul>` | `invul.js` → [`components/fill-blank/`](../src/js/components/fill-blank/) | Invuloefening met dropdowns of vrije invoer |

Nieuwe component toevoegen? Registreer tag + label in `registry.js`; build, PDF en hydration pakken het automatisch op.

**Invuloefening hergebruiken buiten `<x-invul>`:**

```js
import { mountFillBlank } from '/src/js/components/fill-blank/index.js'

mountFillBlank(document.querySelector('#blanks'), {
  code: '.box { display: ___; }',
  blanks: [{ answer: 'grid', options: ['flex', 'grid'] }],
  onCheck: ({ allCorrect }) => console.log(allCorrect),
})
```

**Woordzoeker hergebruiken buiten `<x-woordzoeker>`:**

```js
import { mountWordSearch } from '/src/js/components/word-search/index.js'

mountWordSearch(document.querySelector('#puzzle'), {
  words: ['GRID', 'GAP', 'FLEX'],
  onComplete: () => console.log('klaar!'),
})
```

## Running tests

```bash
npm test           # run all tests once (CI-friendly)
npm run test:watch # watch mode for development
```

Test output:

- **Unit tests** (`tests/validators.test.js`, `tests/html-includes.test.js`) — fast, no filesystem side-effects.
- **Integration test** (`tests/build-pipeline.test.js`) — copies testbed content to a temp directory, runs `build.mjs`, asserts the generated JSON and HTML files. Takes a few seconds; skipping it is not recommended before committing.

## Adding tests

| What you're testing | Where to add |
|--------------------|-------------|
| A pure function exported from `src/js/` | `tests/validators.test.js` or a new `tests/<module>.test.js` |
| The HTML-includes Vite plugin | `tests/html-includes.test.js` |
| `build.mjs` output (new JSON shape, new page type) | `tests/build-pipeline.test.js` |

Vitest is configured in `vitest.config.js`. Timeouts are set to 60 s to accommodate the integration test's build step.

## Build output

```bash
npm run build:testbed
```

Produces a static site in `testbed/dist/` — the same output a real content project would get. Useful for checking the production build of a UI change.

## Package layout

| Path | Purpose |
|------|---------|
| `bin/cli.js` | CLI entry point — `e-module-builder <build\|dev\|preview>` |
| `build.mjs` | Content pipeline — reads `content/`, writes `src/data/` + `pages/` |
| `vite.config.js` | Vite configuration factory (`createConfig`) |
| `vite-plugin-html-includes.js` | Custom plugin: replaces `<!-- include:name -->` with partials |
| `src/js/` | Frontend JavaScript (exercises, quiz, x-components, nav, …). Copied to consumer projects on every `build`/`dev` — do not patch locally in content projects. |
| `src/css/` | Tailwind CSS entry |
| `src/partials/` | Shared HTML snippets (e.g. `head.html`) |
| `templates/` | HTML stubs filled in by `build.mjs` |
| `public/` | Static assets (logo, favicon) |
| `testbed/` | Self-contained dev environment for working on the builder |
| `scripts/` | Helper scripts for `npm run dev` and `npm run build:testbed` |
| `tests/` | Vitest unit and integration tests |

## Publishing

This package is distributed directly from GitHub — no npm publish step needed.

1. Ensure `npm test` passes.
2. Bump the version and create a git tag:

   ```bash
   npm version patch   # or minor / major, or `npm version 0.x.0` for a specific version
   git push origin --tags
   ```

Consumers install the package by referencing the tag:

```bash
npm install github:curio-team/e-module-builder#v0.x.0
```

Or to track the latest commit on `main` (not recommended for production):

```bash
npm install github:curio-team/e-module-builder
```
