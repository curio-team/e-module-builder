---
week: 3
title: ArticleGrid — uitlijnen met subgrid
subtitle: Inleveropdracht Week 3
maxPoints: 9
deliverables:
  - index.html met semantische HTML
  - styles.css met subgrid voor kaartuitlijning
criteria:
  - id: w3h1
    text: De parent container gebruikt display grid met minstens drie kolommen
    points: 3
  - id: w3h2
    text: De geneste kaarten gebruiken subgrid om hun inhoud uit te lijnen
    points: 3
  - id: w3h3
    text: De layout is leesbaar op zowel breed als smal scherm
    points: 3
tips:
  - Geef de kaarten tijdelijk een gekleurde border om het raster te zien.
  - Controleer in de DevTools of de subgrid-sporen overeenkomen met de parent.
linked_theory:
  - week3
---

TechBlog wil een overzichtspagina met artikelkaarten die allemaal even hoge titels en beschrijvingen hebben, ongeacht de tekstlengte.

## Opdracht

Bouw een artikeloverzicht met **CSS subgrid** zodat de titel, afbeelding en beschrijving van elke kaart verticaal uitlijnen over de kolommen heen.

Gebruik `grid-template-rows: subgrid` op de kaarten en `grid-row: span 3` zodat elke kaart drie rijen beslaat.
