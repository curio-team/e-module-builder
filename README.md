# `e-module-builder`

A CLI build tool for creating interactive e-learning modules. It processes a structured `content/` directory of Markdown files and produces a Vite-powered, single-page-style site with theory pages, quizzes, exercises, and assignments.

> [!IMPORTANT]
> If you want to use the template for your own e-module, please go to <https://github.com/curio-team/e-module-template> and press 'Use this template' on the right.

## Installation

```bash
npm install --save-dev github:curio-team/e-module-builder
```

Add these scripts to your project's `package.json`:

```json
{
  "scripts": {
    "dev":     "e-module-builder dev",
    "build":   "e-module-builder build",
    "preview": "e-module-builder preview"
  }
}
```

## Commands

| Command | Description |
| ------- | ----------- |
| `dev` | Start dev server at `localhost:5173`, watches `content/` and hot-reloads |
| `build` | Production build to `dist/` |
| `preview` | Locally preview the `dist/` build |

## Project structure

Your project only needs a `content/` directory. Everything else (`src/data/`, `pages/`, `index.html`) is generated automatically.

```txt
content/
  module.md               ← module metadata (name, weeks, language, exercise mode)
  week1/
    theory.md             ← theory content (Markdown + YAML frontmatter)
    quiz.md               ← mid-week quiz (optional)
    assignment.md         ← hand-in assignment (optional)
    exercises/            ← exercises (optional)
      _meta.md            ← exercise set metadata (week, title, color)
      1.md                ← exercise 1
      2.md                ← exercise 2
      …
  week2/ … weekN/         ← same structure; folder name determines nav label
  extra/                  ← arbitrary folder — only theory.md required (see below)
    theory.md
  assessments/
    theory-assessment.md        ← final theory assessment (optional)
    practical-assessment.md     ← final practical assessment (optional)
```

### Numbered sections (`week1`, `week2`, …)

Folders whose name matches the pattern `<prefix><number>` (e.g. `week1`, `mod2`) are treated as **numbered sections**. The number determines their sort order in the navigation. The `weeks` field in `module.md` limits how many are processed.

Each numbered section can contain any combination of `theory.md`, `quiz.md`, `assignment.md`, and `exercises/`. Only `theory.md` is required — the others are all optional:

- **`quiz.md`** — if absent, no quiz page or nav link is generated for that section.
- **`assignment.md`** — if absent, no assignment page or nav link is generated.
- **`exercises/`** — if absent, no exercises page or nav link is generated.

### Arbitrary sections (`extra/`, `appendix/`, …)

Any folder that does **not** match the `<prefix><number>` pattern and contains a `theory.md` is treated as an **arbitrary section**. These folders:

- Appear in the navigation as a collapsible group.
- Are sorted relative to numbered sections using the `sort:` field in their `theory.md` frontmatter (e.g. `sort: 4` places the section after week 3).
- Support the same optional pages as numbered sections — each page is only generated when its source file is present:
  - **`quiz.md`** → quiz page and nav link (optional)
  - **`assignment.md`** → assignment page and nav link (optional)
  - **`exercises/`** with `_meta.md` → exercises pages and nav link (optional)
- Have their `leeruitkomsten` included in the Checklist.

```txt
content/
  extra/
    theory.md       ← required; must contain sort: <number> to position it in the nav
    quiz.md         ← optional
    assignment.md   ← optional
    exercises/      ← optional
      _meta.md
      1.md
```

## Content file formats

### `content/module.md`

```yaml
---
name: CSS Grid
subtitle: E-module
weeks: 4
language: nl
exerciseMode: interactive   # or: external
description: Learn CSS Grid from the ground up.
youtube: https://www.youtube.com/watch?v=...
youtubeTitle: Crash Course   # optional, defaults to "Crash Course"
logoAlt: My module logo
algemeen:
  - I can explain the difference between Flexbox and Grid
---
```

| Field | Required | Description |
| ----- | -------- | ----------- |
| `name` | yes | Module title |
| `weeks` | no | How many numbered `weekN/` dirs to include. Defaults to all discovered. Set to `0` or omit to include all. |
| `exerciseMode` | yes | `interactive` (Monaco editor) or `external` (link-out) |
| `language` | no | UI language, default `nl` |
| `subtitle` | no | Shown below the title |
| `description` | no | Short module description |
| `youtube` | no | Intro video URL |
| `youtubeTitle` | no | Label for the YouTube button; defaults to `Crash Course` |
| `algemeen` | no | General learning outcomes added to the checklist |

---

### `content/weekN/theory.md`

YAML frontmatter + Markdown body. The body supports standard Markdown, syntax-highlighted code blocks, and custom block-level elements (see [Custom elements](#custom-elements)).

```yaml
---
week: 1
title: The building blocks
goal: You understand what CSS Grid is and when to use it.
accent: indigo          # Tailwind color name used as the week's accent color
summary: Short summary shown on the home page.
leeruitkomsten:
  - I can explain what a grid container is
  - I can define columns with grid-template-columns
---

Markdown content here…
```

For **arbitrary sections** (non-numbered folders), replace `week:` with `sort:` to control the position of the section in the navigation relative to numbered sections:

```yaml
---
sort: 4                 # appears after week 3 in the nav
title: Extra material
goal: You explore additional topics.
accent: slate
summary: Supplementary content outside the weekly structure.
leeruitkomsten:
  - I am familiar with the extra material
---
```

---

### `content/weekN/quiz.md` _(optional)_

```yaml
---
title: Mid-week quiz — Week 1
passScore: 70
questions:
  - id: q1
    question: What does display:grid do?
    options:
      - Creates a flex container
      - Activates CSS Grid on the element
    correct: 1
    explanation: display:grid activates CSS Grid.
---
```

---

### `content/weekN/assignment.md` _(optional)_

The Markdown **body** is split on blank lines: the first paragraph becomes the `case`, the rest becomes the `assignment` description.

```yaml
---
week: 1
title: Build a page layout
subtitle: Practical assignment
deliverables:
  - A working HTML/CSS page
criteria:
  - Grid is used for the overall layout
maxPoints: 10
tips:
  - Start with the grid container
---

Case description paragraph.

Assignment instructions paragraph.
```

---

### `content/weekN/exercises/_meta.md` _(optional)_

```yaml
---
week: 1
title: CSS Grid exercises
color: indigo
mode: interactive   # optional, overrides module-level exerciseMode for this set
---
```

---

### `content/weekN/exercises/N.md`

Each file is a single exercise. The YAML frontmatter holds metadata; for text exercises the markdown **body** (content below the frontmatter) is rendered as the exercise content.

**Text exercise with markdown body (recommended for rich content):**

```markdown
---
id: 1
difficulty: 1
title: Columns
type: text
---

Create a grid with **two equal columns** using `grid-template-columns`.

## Tips

- Use `repeat(2, 1fr)` for equal columns.
- `fr` stands for _fractional unit_.
```

The body can contain any markdown: headings, bold/italic, lists, images, code blocks, and [custom elements](#custom-elements-in-markdown). No CSS playground or external link is needed — teachers can write the full exercise content as plain markdown.

**Shorthand (inline description in YAML, for very short exercises):**

```yaml
---
type: text
title: Columns
description: Create a grid with two equal columns.
---
```

When both a body and a `description` field are present the body takes precedence.

**Linking theory pages (optional):**

Use `linked_theory` to attach one or more theory pages to an exercise. A collapsible panel slides in from the right with a tab per week, embedding the theory page so students can look up content without leaving the exercise.

```yaml
---
id: 3
type: text
title: Columns
linked_theory:
  - week1
  - week2
---
```

| Field | Required | Description |
| ----- | -------- | ----------- |
| `linked_theory` | no | List of week identifiers (e.g. `week1`). Renders a collapsible right-side panel with tabbed iframes — one per linked week. When absent, no panel or toggle button is shown. Theory pages load without their own navbar inside the panel. |

---

**Exercise types** are controlled by the `type:` field:

| Type | What it renders |
| ---- | ---------------- |
| `css-playground` | Monaco CSS editor with live preview and automated checks |
| `areas` | Drag-and-drop grid-template-areas builder |
| `responsive` | Monaco CSS editor with resizable viewport preview |
| `js-playground` | Monaco JS editor, sandboxed execution (iframe, no same-origin), console output + automated checks |
| `external` | Link-out card with a URL |
| `text` | Description-only card (no interactive element) |

**CSS playground exercise:**

```yaml
---
type: css-playground
title: Add a gap
starterCss: ".grid { display: grid; }"
previewHtml: "<!DOCTYPE html><html>…<div class='grid'>…</div>…</html>"
solution: ".grid { display: grid; gap: 16px; }"
checks:
  - type: includes
    value: gap
    msg: 'display: gap'
---
```

**Areas exercise (grid-template-areas builder):**

```yaml
---
type: areas
title: Header over full width
areaItems: [header, main, sidebar]
areaOptions: [header, main, sidebar]
gridColumns: 1fr 1fr
expected:
  container: |-
    "header header"
    "main sidebar"
  items:
    header: header
    main: main
    sidebar: sidebar
---
```

**Responsive exercise (resizable viewport preview):**

```yaml
---
type: responsive
title: Mobile layout
starterCss: ".grid { grid-template-columns: repeat(2, 1fr); }"
previewHtml: "<!DOCTYPE html><html>…</html>"
solution: "@media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }"
checks:
  - type: mediaQuery
    values: ['600px', '1fr']
    msg: media query with 1 column at 600px
---
```

**JS playground exercise (sandboxed execution):**

```yaml
---
type: js-playground
title: Fetch a to-do item
starterJs: "// TODO: use fetch() and console.log()"
solution: |-
  fetch('https://jsonplaceholder.typicode.com/todos/1')
    .then((response) => response.json())
    .then((data) => console.log(data.title))
checks:
  - type: sourceIncludesAll
    values: [fetch]
    msg: 'uses fetch() to call the API'
  - type: consoleIncludes
    value: delectus aut autem
    msg: 'logs the todo title to the console'
---
```

**External exercise (link-out):**

```yaml
---
type: external
title: Grid Garden
url: https://cssgridgarden.com
---
```

---

### `content/assessments/theory-assessment.md`

Same structure as `quiz.md`.

---

### `content/assessments/practical-assessment.md`

Contains arbitrary Markdown content. This file is designed to be submitted/turned in via the learning platform Itslearning and is not rendered as a quiz or interactive assessment.

---

## Custom elements in Markdown

Theory pages support these custom block elements in Markdown:

| Element | Purpose |
| ------- | ------- |
| `<x-callout>` | Highlighted note block. Add `type="warning"` for warnings, `type="tip"` for tips, `type="danger"` for dangers, `type="info"` for information, or `type="note"` for general notes. |
| `<x-card title="…">` | Content card with a title. |
| `<x-compare>` / `<x-compare-item title="…">` | Side-by-side comparison columns. |
| `<x-nav label="…">` | Bottom navigation links (one Markdown link per line). |
| `<x-browser>` | Browser window mockup with a dark titlebar and non-functional min/max/close controls. Add `title="…"` to set a custom titlebar label (default: `Browser`). |
| `<x-keuzevraag>` | **Meerkeuzevraag** — één vraag met antwoordopties en directe feedback. Body is YAML config. |
| `<x-koppelvraag>` | **Koppelvraag** — koppel termen links aan definities rechts. Body is YAML config. |
| `<x-vind-de-fout>` | **Vind de fout** — klik op de foutieve regel in een codestuk. Body is YAML config. |
| `<x-woordzoeker>` | **Woordzoeker** — zoek trefwoorden uit de module. Lege body = alle module-trefwoorden; optioneel `scope: week1` voor één week. |
| `<x-invul>` | **Invuloefening** — vul ontbrekende stukken in een codestuk in. Gebruik `___` als placeholder; elk gat krijgt een `blanks`-item met `answer` en optioneel `options`. |

**Interactieve x-components** (`<x-keuzevraag>`, `<x-koppelvraag>`, `<x-vind-de-fout>`, `<x-woordzoeker>`, `<x-invul>`) werken op de volgende plekken. De YAML-body wordt bij build omgezet naar een `data-config` attribuut; labels komen automatisch uit `src/js/x-components/registry.js`. Trefwoorden voor de woordzoeker staan in `src/data/woordzoeker.json` (automatisch geëxtraheerd uit alle content).

| Plek | Bronbestand | Automatisch? |
|------|-------------|--------------|
| Theoriepagina | `theory.md` | Ja |
| Tekstoefening | `exercises/*.md` (`type: text`) | Ja |
| Inleveropdracht | `assignment.md` | Ja |
| Meetmoment praktijk | `assessments/practical-assessment.md` | Ja |
| Quiz (meetmoment) | `quiz.md` / `theory-assessment.md` | Nee — gestructureerde vragen, geen markdown-prose |
| Monaco-oefeningen | `css-playground`, `areas`, `responsive` | Nee |
| Eigen `content/*.html` | handgeschreven HTML | Nee — roep `initProseContent()` handmatig aan |

Voor eigen HTML-pagina's of custom scripts:

```js
import { initProseContent } from '/src/js/x-components/index.js'

const container = document.querySelector('.prose')
container.innerHTML = htmlFromSomewhere
initProseContent(container)
```

> **Let op:** `e-module-builder build` kopieert `src/js` en `src/css` uit het package naar je project. Pas frontend-code aan in dit repository, niet lokaal in een consumer project — lokale wijzigingen worden bij elke build overschreven.

Voorbeeld `<x-keuzevraag>`:

```markdown
<x-keuzevraag>
question: Welke property activeert CSS Grid?
options:
  - "display: flex"
  - "display: grid"
correct: 1
explanation: "display: grid maakt het element een grid container."
</x-keuzevraag>
```

Example:

```markdown
<x-callout type="warning">
Watch out: only **direct children** of the grid container become grid items.
</x-callout>

<x-compare>
<x-compare-item title="Flexbox — one direction">

Use for components: navbars, button rows.

</x-compare-item>
<x-compare-item title="Grid — two directions">

Use for full page layouts.

</x-compare-item>
</x-compare>

<x-browser>

![Screenshot of the result](../assets/result.png)

</x-browser>

<x-browser title="https://example.com">

This is how the page looks after applying the CSS.

</x-browser>
```

---

## What gets generated

The build pipeline runs before Vite and produces:

| Output | Source |
| ------ | ------ |
| `src/data/manifest.json` | `module.md` + all section frontmatter |
| `src/data/theory-weekN.json` | `weekN/theory.md` |
| `src/data/theory-<folder>.json` | `<folder>/theory.md` (arbitrary sections) |
| `src/data/meetmoment-quiz-weekN.json` | `weekN/quiz.md` _(if present)_ |
| `src/data/exercises/weekN.json` | `weekN/exercises/` _(if present)_ |
| `src/data/inleveropdracht-weekN.json` | `weekN/assignment.md` _(if present)_ |
| `src/data/checklist.json` | `leeruitkomsten` from all sections |
| `src/data/meetmoment-theorie.json` | `assessments/theory-assessment.md` _(if present)_ |
| `src/data/meetmoment-praktijk.json` | `assessments/practical-assessment.md` _(if present)_ |
| `pages/weekN-theorie.html` | generated from template |
| `pages/weekN-oefeningen.html` | generated from template |
| `pages/weekN-meetmoment.html` | generated from template _(only if `quiz.md` exists)_ |
| `pages/weekN-oefening.html` | generated from template |
| `pages/weekN-inleveropdracht.html` | generated from template _(only if `assignment.md` exists)_ |
| `pages/<folder>-theorie.html` | generated from template (arbitrary sections) |
| `pages/checklist.html` | generated from template |
| `pages/meetmoment-theorie.html` | generated from template _(only if assessment file exists)_ |
| `pages/meetmoment-praktijk.html` | generated from template _(only if assessment file exists)_ |
| `index.html` | generated from template |

In `dev` mode, changes to `content/` trigger an automatic rebuild and browser reload.
