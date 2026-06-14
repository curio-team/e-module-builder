---
title: Eindtoets praktijk — CSS Grid Basis
passScore: 70
questions:
  - id: p1
    question: Schrijf de CSS om een 3-koloms grid te maken met gap van 16px.
    options:
      - "display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;"
      - "display: flex; gap: 16px;"
      - "float: left; margin: 16px;"
      - "position: absolute; width: 33%;"
    correct: 0
    explanation: "display: grid met repeat(3, 1fr) en gap maakt een 3-koloms grid."
  - id: p2
    question: Hoe laat je een element 2 kolommen beslaan met grid-template-areas?
    options:
      - "width: 200%"
      - 'Herhaal de naam 2x in de string: "header header"'
      - "float: left"
      - "colspan: 2"
    correct: 1
    explanation: In grid-template-areas herhaal je de naam voor elke kolom die het element beslaat.
  - id: p3
    question: Welke media query zorgt voor 1 kolom op schermen smaller dan 768px?
    options:
      - "@media (min-width: 768px) { grid-template-columns: 1fr; }"
      - "@media (max-width: 768px) { grid-template-columns: 1fr; }"
      - "@media screen { grid-template-columns: 1fr; }"
      - "@media print { grid-template-columns: 1fr; }"
    correct: 1
    explanation: max-width zorgt dat de stijl geldt op schermen smaller dan 768px.
---
