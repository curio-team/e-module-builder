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

## Test veel paragrafen 'Waarom een database?'

Een database is een plek waar we gegevens zo kunnen opslaan dat we ze later gemakkelijk en snel terug kunnen vinden. Een applicatie moet gegevens namelijk ook nog kennen nadat de gebruiker de pagina heeft gesloten. Denk bijvoorbeeld aan accounts, bestellingen, berichten of de voorraad van een webshop. Als deze gegevens alleen tijdelijk in een PHP-variabele zouden staan, waren ze na iedere page refresh weer verdwenen.

Je zou gegevens ook in een normaal tekstbestand kunnen bewaren. Dat lijkt in het begin eenvoudiger, maar wordt al snel onhandig. Een database heeft ten opzichte van zo'n bestand een aantal belangrijke voordelen: de gegevens zijn efficiënt te doorzoeken met complexe query's, applicaties kunnen de gegevens snel gebruiken en meerdere gebruikers of applicaties kunnen dezelfde gegevens benaderen.

Daar staat tegenover dat een database wat meer voorbereiding vraagt. Je moet vooraf nadenken over de vorm van de gegevens. Je kunt niet zomaar alles door elkaar opslaan zoals in een los tekstbestand. Juist die vaste structuur maakt de database later betrouwbaar en goed doorzoekbaar. In deze module gebruiken we **MySQL**, een relationele databaseserver.

In een hiërarchie staan sommige onderdelen boven andere onderdelen. Bij een database is die volgorde belangrijk, omdat woorden als _server_, _database_ en _tabel_ in het dagelijks taalgebruik soms door elkaar worden gehaald. De hiërarchie is:

1. de MySQL-**server** draait op je computer;
2. de server bevat één of meer **databases**;
3. een database bevat **tabellen**;
4. een tabel heeft **kolommen** en **rijen**;
5. één **cel** is de waarde van één kolom in één rij.

De MySQL-server is dus het programma dat verbindingen ontvangt en alle databases en gebruikers bijhoudt. Het is gebruikelijk om voor iedere applicatie een eigen database te gebruiken. Eén applicatie heeft vervolgens vaak meerdere tabellen nodig. Een webshop kan bijvoorbeeld tabellen hebben voor `producten`, `klanten` en `bestellingen`.

## Test sub-lists

Hier een lijst met een sublijst:

<x-callout type="tip">

1. Item 1
2. Item 2
   1. Subitem 2.1
   2. Subitem 2.2
3. Item 3

</x-callout>

Hier een lijst met een sublijst, die een sublijst heeft:

1. Item 1
2. Item 2
   1. Subitem 2.1
      1. Subsubitem 2.1.1
      2. Subsubitem 2.1.2
   2. Subitem 2.2
3. Item 3

Hier lijsten met witregels ertussen en code-block:

1. Item 1

2. De CSS:

    ```css
    .parent {
      display: grid;
      grid-template-columns: 1fr 2fr 1fr;
      gap: 16px;
    }
    ```

3. En hier een sublijst:

   1. Subitem 3.1

      ```css
      .child {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: subgrid; /* erft de drie kolommen van .parent */
      }
      ```
  
   2. Subitem 3.2

## Alle callout types

<x-callout type="tip">

Dit is een tip.

</x-callout>

<x-callout type="warning">

Dit is een waarschuwing.

</x-callout>

<x-callout type="danger">

Dit is een gevaar.

</x-callout>

<x-callout type="info">

Dit is informatie.

</x-callout>

<x-callout type="note">

Dit is een opmerking.

</x-callout>

## Showing browser output

This browser component can be used to show the output of a browser, for example, `var_dump` output:

<x-browser>
  ```txt
  array(3) {
    [0]=>
    string(5) "apple"
    [1]=>
    string(6) "banana"
    [2]=>
    string(6) "cherry"
  }
  ```
</x-browser>

## Testing readability of code symbols

Here's inline `==`, `!=`, `<=`, `>=`, `+`, `-`, `*`, `/`, `%`, `&`, `|`, `^`, `~`, `<<`, and `>>` symbols.

Here's them in a code block:

```js
if (a == b) {
  console.log("Equal");
} else if (a != b) {
  console.log("Not equal");
}
if (a <= b) {
  console.log("Less than or equal");
} else if (a >= b) {
  console.log("Greater than or equal");
}
let sum = a + b;
let difference = a - b;
let product = a * b;
let quotient = a / b;
let remainder = a % b;
let and = a & b;
let or = a | b;
let xor = a ^ b;
let not = ~a;
let leftShift = a << 2;
let rightShift = a >> 2;
```

<x-nav label="Klaar met de theorie?">
[Oefeningen](/pages/week3-oefeningen.html)
[Inleveropdracht](/pages/week3-inleveropdracht.html)
</x-nav>
