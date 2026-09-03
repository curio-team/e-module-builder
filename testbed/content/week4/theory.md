---
week: 4
title: Grid en Flexbox combineren
goal: je kunt Grid en Flexbox bewust naast elkaar inzetten binnen één layout
accent: primary
summary: Grid regelt de tweedimensionale paginastructuur, Flexbox de eendimensionale uitlijning daarbinnen.
leeruitkomsten:
  - Ik weet wanneer ik Grid kies en wanneer Flexbox
  - Ik kan Flexbox-componenten in een Grid-cel plaatsen zonder layoutconflicten
---

## Grid of Flexbox?

Gebruik **Grid** voor de overkoepelende pagina-indeling in rijen én kolommen.
Gebruik **Flexbox** voor het uitlijnen van een rij losse elementen, zoals een
knoppenbalk of een kaart-footer.

```css
.page {
  display: grid;
  grid-template-columns: 240px 1fr;
}

.card-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
```

## Samen in één component

Een Grid-cel is zelf een gewone container: je kunt er zonder problemen
`display: flex` op toepassen voor de inhoud.
