---
title: Meetmoment theorie — CSS Grid Basis
navLabel: Meetmoment Theorie
description: Meerkeuzevragen over de module. Minimaal 70% om te slagen.
passScore: 70
questions:
  - id: t1
    question: Wat is een grid container?
    options:
      - Een direct kind van een grid element
      - "Het element waarop je display: grid toepast"
      - Een kolom in het grid
      - Een HTML-element met class="grid"
    correct: 1
    explanation: "De container is het element waarop je display: grid toepast en grid-template-* definieert."
  - id: t2
    question: Wat doet de gap property?
    options:
      - Padding binnen items
      - Ruimte tussen grid-items
      - Border-radius van items
      - Buitenmarge van de container
    correct: 1
    explanation: gap (of row-gap / column-gap) bepaalt de ruimte tussen items.
  - id: t3
    question: Wat is grid-template-areas?
    options:
      - Een lijst van HTML-klassen
      - Een visuele manier om grid-gebieden namen te geven met strings
      - Een JavaScript-functie
      - Een media query
    correct: 1
    explanation: Met grid-template-areas teken je je layout met benoemde gebieden.
  - id: t4
    question: "Wat doet minmax(200px, 1fr)?"
    options:
      - Minimaal 200px breed, maximaal 1fr beschikbare ruimte
      - Exact 200px breed
      - Werkt alleen op mobiel
      - Verbergt het element
    correct: 0
    explanation: minmax stelt een minimum én een maximum in voor een grid-track.
---
