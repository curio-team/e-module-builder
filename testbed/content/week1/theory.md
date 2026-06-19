---
week: 1
title: De grote bouwstenen
goal: je begrijpt wat CSS Grid is en kunt een eenvoudige pagina-indeling maken
accent: indigo
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

## Visueel overzicht

![Grid diagram](grid-diagram.svg)

![Extern voorbeeld](https://placehold.co/600x400)

<x-nav label="Klaar met de theorie?">
[Oefeningen](/pages/week1-oefeningen.html)
[Toets](/pages/week1-toets.html)
[Week 2](/pages/week2-theorie.html)
</x-nav>
