---
week: 2
title: Template Areas
goal: je kunt grid-template-areas gebruiken om gebieden te benoemen en een responsieve layout te maken
accent: violet
summary: Met grid-template-areas geef je gebieden een naam en tekent je de layout visueel in CSS.
leeruitkomsten:
  - Ik kan grid-template-areas gebruiken om een layout te tekenen
  - Ik ken het verschil tussen auto-fit en auto-fill
  - Ik kan een responsieve grid maken met media queries
---

## Grid Template Areas

Met `grid-template-areas` geef je gebieden een naam en tekent je de layout als een kaart.

```css
.pagina {
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-areas:
    "header header"
    "nav    main"
    "footer footer";
}

header { grid-area: header; }
nav    { grid-area: nav; }
main   { grid-area: main; }
footer { grid-area: footer; }
```

## Auto-fit vs auto-fill

Beide maken automatisch zoveel kolommen als er passen, maar:

- **`auto-fill`** — houdt lege tracks in stand (maakt ruimte aan)
- **`auto-fit`** — klapt lege tracks in (items vullen alle ruimte)

```css
/* auto-fit: items groeien mee als ze alleen zijn */
.grid {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
```

<x-callout type="warning">
Gebruik `auto-fit` voor responsieve kaartenlayouts zonder media queries.
</x-callout>

<x-nav label="Klaar met de theorie?">
[Oefeningen](/pages/week2-oefeningen.html)
[Meetmoment](/pages/week2-meetmoment.html)
</x-nav>
