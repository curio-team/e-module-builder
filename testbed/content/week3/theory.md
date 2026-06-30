---
week: 3
title: Subgrid en Nesting
goal: je kunt subgrid gebruiken om geneste elementen uit te lijnen met de parent grid
accent: emerald
summary: Met subgrid laat je geneste grid containers de sporen van hun ouder overnemen.
leeruitkomsten:
  - Ik weet wat subgrid doet en wanneer ik het gebruik
  - Ik kan grid-template-columns en grid-template-rows instellen op subgrid
  - Ik kan meerdere grid containers nesten zonder uitlijningsproblemen
---

## Wat is Subgrid?

Met `subgrid` kan een geneste grid container de **rijen of kolommen van de parent** overnemen in plaats van eigen sporen te definiëren.

```css
.parent {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 16px;
}

.child {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: subgrid; /* erft de drie kolommen van .parent */
}
```

## Wanneer gebruik je subgrid?

Gebruik subgrid als je items in een geneste container wilt uitlijnen met het raster van de buitenste container.

<x-callout type="warning">
Subgrid wordt ondersteund in alle moderne browsers, maar niet in oudere versies van Chrome (voor versie 117).
</x-callout>

## Nesting zonder subgrid

Zonder subgrid krijgt elk genest grid zijn eigen coördinatenstelsel, wat uitlijning over de grenzen heen onmogelijk maakt.

```css
/* Zonder subgrid — items lijnen niet uit met de parent */
.child {
  display: grid;
  grid-template-columns: 1fr 2fr; /* eigen sporen */
}
```

<x-nav label="Klaar met de theorie?">
[Oefeningen](/pages/week3-oefeningen.html)
[Inleveropdracht](/pages/week3-inleveropdracht.html)
</x-nav>
