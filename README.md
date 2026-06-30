# `e-module-builder`

A CLI build tool for creating interactive e-learning modules. It processes a structured `content/` directory of Markdown files and produces a Vite-powered, single-page-style site with theory pages, quizzes, exercises, and assignments — one per week.

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
    quiz.md               ← mid-week quiz questions
    assignment.md         ← hand-in assignment
    exercises/
      _meta.md            ← exercise set metadata (week, title, color)
      1.md                ← exercise 1
      2.md                ← exercise 2
      …
  week2/ … weekN/         ← same structure
  assessments/
    theory-assessment.md        ← final theory assessment (optional)
    practical-assessment.md     ← final practical assessment (optional)
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
| `weeks` | yes | Number of weeks to include (limits which `weekN/` dirs are processed) |
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

---

### `content/weekN/quiz.md`

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

### `content/weekN/assignment.md`

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

### `content/weekN/exercises/_meta.md`

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

**Interactive (Monaco editor) exercise:**

```yaml
---
type: interactive
title: Add a gap
starterHtml: "<div class='grid'>…</div>"
starterCss: ".grid { display: grid; }"
solution: ".grid { display: grid; gap: 16px; }"
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

### `content/assessments/theory-assessment.md` and `practical-assessment.md`

Same structure as `quiz.md`. Practical assessment questions may include a `preview` field with `css` and `html` for a live CSS preview alongside the question.

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
| `src/data/manifest.json` | `module.md` + all week frontmatter |
| `src/data/theory-weekN.json` | `weekN/theory.md` |
| `src/data/meetmoment-quiz-weekN.json` | `weekN/quiz.md` |
| `src/data/exercises/weekN.json` | `weekN/exercises/` |
| `src/data/inleveropdracht-weekN.json` | `weekN/assignment.md` |
| `src/data/checklist.json` | `leeruitkomsten` from all weeks |
| `src/data/meetmoment-theorie.json` | `assessments/theory-assessment.md` |
| `src/data/meetmoment-praktijk.json` | `assessments/practical-assessment.md` |
| `pages/weekN-theorie.html` | generated from template |
| `pages/weekN-oefeningen.html` | generated from template |
| `pages/weekN-meetmoment.html` | generated from template |
| `pages/weekN-oefening.html` | generated from template |
| `pages/weekN-inleveropdracht.html` | generated from template |
| `pages/checklist.html` | generated from template |
| `pages/meetmoment-theorie.html` | generated from template |
| `pages/meetmoment-praktijk.html` | generated from template |
| `index.html` | generated from template |

In `dev` mode, changes to `content/` trigger an automatic rebuild and browser reload.
