---
week: 1
title: De grote bouwstenen
goal: je begrijpt wat CSS Grid is en kunt een eenvoudige pagina-indeling maken
accent: primary
summary: CSS Grid is een tweedimensionaal layout-systeem voor rijen én kolommen.
leeruitkomsten:
  - "Ik weet wat display: grid doet"
  - Ik kan kolommen definiëren met grid-template-columns
  - Ik gebruik gap voor ruimte tussen grid-items
---

## Wat is CSS Grid?

CSS Grid is een layout-systeem waarmee je een **raster** definieert op een container. Je tekent onzichtbare lijnen en plaatst elementen in de cellen.

<x-callout>

**Onthoud:** Grid is voor de *grote indeling* van je pagina. Niet voor elk klein detail — daarvoor heb je Flexbox.

</x-callout>

```css
.pagina {
  display: grid;
  grid-template-columns: 1fr 200px;
  gap: 16px;
}
```

## Container en items

Het element met `display: grid` heet de **grid container**. Alleen de directe kinderen worden automatisch grid items.

<x-compare>
<x-compare-item title="Flexbox — één richting">

Items staan in een **rij** of **kolom**. Ideaal voor navigatiebalken en kleine componenten.

```css
.nav { display: flex; gap: 1rem; }
```

</x-compare-item>
<x-compare-item title="Grid — twee richtingen">

Items staan in **rijen én kolommen** tegelijk. Ideaal voor pagina-layouts.

```css
.pagina { display: grid; grid-template-columns: 1fr 250px; }
```

</x-compare-item>
</x-compare>

<details>

<summary>Waarom twee systemen?</summary>

Flexbox is geweldig voor kleine componenten, maar wordt onhandig voor hele pagina's. Grid is ontworpen voor complexe layouts, maar is overkill voor simpele rij- of kolomstructuren.

</details>

## Visueel overzicht

![Grid diagram](grid-diagram.svg)

![Extern voorbeeld](https://placehold.co/600x400)

## Linkjes

- [CSS Grid op MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)
- [CSS Grid Generator](https://cssgrid-generator.netlify.app/)

## Check je kennis

<x-keuzevraag>
question: Welke property maakt een element een grid container?
options:
  - "display: flex"
  - "display: grid"
  - "layout: grid"
correct: 1
explanation: "Alleen display: grid activeert CSS Grid."
</x-keuzevraag>

<x-koppelvraag>
prompt: Koppel de term aan de definitie
pairs:
  - left: grid-template-columns
    right: Kolombreedtes definiëren
  - left: gap
    right: Ruimte tussen grid-items
shuffle: true
</x-koppelvraag>

<x-vind-de-fout>
language: css
code: |
  .grid {
    display: flex;
    gap: 16px;
  }
errorLine: 2
hint: "Kijk naar de display property."
explanation: "Grid vereist display: grid, niet flex."
</x-vind-de-fout>

<x-invul>
prompt: Vul de ontbrekende CSS-eigenschappen in.
code: |
  .pagina {
    display: ___;
    grid-template-columns: 1fr 200px;
    ___: 16px;
  }
blanks:
  - answer: grid
    options:
      - flex
      - grid
      - block
  - answer: gap
    options:
      - gap
      - margin
      - padding
explanation: "display: grid maakt een grid container; gap zet ruimte tussen items."
</x-invul>

<x-woordzoeker>
words:
  - gridarea
  - template
  - gap
  - column
  - row
</x-woordzoeker>

<x-nav label="Klaar met de theorie?">
[Oefeningen](/pages/week1-oefeningen.html)
[Meetmoment](/pages/week1-meetmoment.html)
[Week 2](/pages/week2-theorie.html)
</x-nav>
