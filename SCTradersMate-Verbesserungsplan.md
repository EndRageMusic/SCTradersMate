# SCTradersMate Verbesserungsplan

Stand: 28. Juli 2026  
Zielbranch: `test`

## Ziel

TradersMate soll Handelsgewinne realistisch berechnen, auch bei langsamen oder
unvollständigen API-Antworten zuverlässig starten und langfristig einfacher
erweiterbar sowie testbar werden.

Die fachliche Richtigkeit hat Vorrang vor neuen Funktionen. Erst danach folgen
Komfortfunktionen und eine genauere Reiseplanung.

## Umgesetzt im Testbranch

- Handelsrechnung nach Bestand, Nachfrage, SCU-Menge und Budget
- Filter fuer vollstaendig gemeldete und handelbare Mengen
- Kennzeichnung unbekannter Mengen, unverkaufter Fracht und Preisalter
- Sofortiger App-Start mit Tagesupdate im Hintergrund
- Manueller Datenabruf und 15-Sekunden-Zeitlimit
- Rohwerte der UEX-Statusfelder statt fehlerhafter Ja/Nein-Umwandlung
- JSON- und CSV-Export der Frachtliste
- Automatisierte Rechentests und GitHub-Actions-Pruefung
- Erste Auslagerung der Handelslogik in `trade-calculator.js`

## Bereits vorhanden

- Täglicher Datenabgleich mit UEX Corp API 2.0 und lokalem IndexedDB-Cache
- Trading, Shopping, Komponenten, Schiffe und Bodenfahrzeuge
- Mehrstopp-Routenplanung mit Frachtliste und SCU-Prüfung
- Räumliche 2D-Systemkarte für Stanton, Pyro und Nyx
- Automatische Gateway-Transitpunkte und Quantum-Jump-Anzeige
- Basetool-Design mit responsiver Desktop- und Mobilansicht

Die aktuelle Systemkarte ist eine navigationsnahe Darstellung. Ihre Positionen
sind teilweise fest hinterlegt oder abgeleitet und stellen noch keine exakten
Quantum-Distanzen dar.

# Teil A: Sinnvolle und notwendige Arbeiten

## Phase 1: Handelsberechnung realistisch machen

**Priorität:** Kritisch

### Problem

`buildBuyerRows()` berechnet Einkauf, Verkauf und Gewinn derzeit immer mit der
vollständig eingegebenen SCU-Menge. Bestand am Start, Nachfrage am Ziel und die
UEX-Statusfelder begrenzen die Berechnung noch nicht zuverlässig.

### Aufgaben

- Bedeutung der UEX-Felder `status_buy`, `status_sell`, `scu_buy`,
  `scu_sell` und `scu_sell_stock` anhand realer Beispieldatensätze
  dokumentieren.
- Eine zentrale Funktion für handelbare Mengen erstellen.
- Inaktive Kauf- oder Verkaufsangebote ausschließen.
- `handelbare SCU` als Minimum aus gewünschter Menge, verfügbarem Bestand und
  Zielnachfrage berechnen.
- Einkaufskosten nur für tatsächlich kaufbare SCU berechnen.
- Verkaufserlös nur für tatsächlich abladbare SCU berechnen.
- Nicht verkaufbare Restmenge separat anzeigen.
- Gewinn und Marge auf Basis der real handelbaren Menge berechnen.
- Unbekannte Bestands- oder Nachfragewerte sichtbar als unbekannt behandeln,
  statt sie automatisch als unbegrenzt oder null zu interpretieren.
- Dieselbe Berechnungsfunktion in Trading, Frachtliste und Routenstopps
  verwenden.

### Anzeige

- Gewünschte SCU
- Kaufbare SCU
- Verkaufbare SCU
- Restmenge
- Einkaufskosten
- Verkaufserlös
- Realistischer Gewinn
- Marge
- Hinweis bei inaktivem oder unvollständigem Angebot

### Abnahmekriterien

- Eine Route für 100 SCU mit 20 SCU Bestand berechnet höchstens 20 SCU Einkauf.
- Eine Route mit 20 SCU Bestand und 15 SCU Nachfrage berechnet höchstens
  15 SCU Verkauf.
- Negative Ergebnisse werden weiterhin rot dargestellt.
- Inaktive Angebote erscheinen nicht als beste Route.
- Trading, Frachtliste und Routenplaner liefern für denselben Datensatz
  identische Ergebnisse.

## Phase 2: App sofort starten und Daten im Hintergrund aktualisieren

**Priorität:** Hoch

### Problem

`script.js` wird aktuell erst nach Abschluss von
`TRADERSMATE_DAILY_REFRESH` geladen. Ein langsamer API-Aufruf kann dadurch die
gesamte Anwendung blockieren.

### Aufgaben

- Mitgelieferte lokale Daten sofort laden.
- `script.js` ohne Warten auf den Netzwerkabruf starten.
- Tagesupdate im Hintergrund ausführen.
- Einen zentralen, aktualisierbaren Datenspeicher verwenden.
- Nach erfolgreichem Update ein Ereignis wie
  `tradersmate:data-updated` auslösen.
- Sichtbare Listen und Auswahlen nach dem Update kontrolliert neu aufbauen.
- Aktuelle Benutzerauswahl erhalten, sofern der Datensatz weiterhin existiert.
- Für jeden API-Aufruf ein Zeitlimit von 10 bis 15 Sekunden ergänzen.
- Hängende Requests mit `AbortController` abbrechen.
- Den Status klar unterscheiden:
  `Lokaler Stand`, `Cache`, `Aktualisiere`, `Live aktualisiert`.

### Abnahmekriterien

- Die Startauswahl ist auch ohne Netzwerk sofort bedienbar.
- Ein hängender API-Endpunkt blockiert die Anwendung nicht.
- Nach erfolgreichem Hintergrundupdate werden die neuen Daten angezeigt.
- Bei einem Fehler bleibt der letzte funktionierende Datenstand aktiv.
- Es entstehen keine doppelten Einträge oder verlorenen Auswahlen.

## Phase 3: API-Daten und Cache robuster machen

**Priorität:** Hoch

### Aufgaben

- Erwartete Felder und Datentypen pro UEX-Endpunkt validieren.
- Ungültige Einzelzeilen protokollieren und überspringen.
- Teilausfälle einzelner Endpunkte getrennt behandeln.
- Den letzten gültigen Bereich weiterverwenden, wenn nur ein Teilabruf
  fehlschlägt.
- Cache-Version und Datenformat im Snapshot speichern.
- Veraltete Cache-Versionen kontrolliert verwerfen oder migrieren.
- Zeitpunkt des letzten erfolgreichen Updates pro Datenbereich speichern.
- Preisalter pro Datensatz aus `date_modified` übernehmen.
- Einen manuellen Button `Jetzt aktualisieren` ergänzen.
- Während des Updates Mehrfachabrufe verhindern.

### Abnahmekriterien

- Ein beschädigter Itemdatensatz verwirft nicht das gesamte Tagesupdate.
- Ein Fehler bei Fahrzeugdaten verhindert keine aktuellen Handelspreise.
- Eine inkompatible Cache-Version verursacht keinen Startfehler.
- Der Benutzer sieht Datum und Status des letzten erfolgreichen Abgleichs.

## Phase 4: Automatisierte Tests und CI einführen

**Priorität:** Hoch

### Aufgaben

- Minimale Node-Teststruktur anlegen.
- Rechenfunktionen als reine Funktionen testbar machen.
- Feste Beispieldatensätze für UEX-Preisfälle anlegen.
- Tests bei jedem Push über GitHub Actions ausführen.
- JavaScript-Syntaxprüfung und HTML-Smoke-Test ergänzen.
- Einen Browser-Smoke-Test für die wichtigsten Benutzerwege anlegen.

### Pflichtfälle

- Gewinn und Marge bei vollständiger Menge
- Begrenzter Bestand am Start
- Begrenzte Nachfrage am Ziel
- Inaktive Kauf- und Verkaufsangebote
- Fehlende oder ungültige Zahlenwerte
- Negative Route
- Illegale Ware
- Überschrittene Schiffskapazität
- Identischer Start und identisches Ziel
- Route mit mehreren Stopps
- Route über mehrere Systeme und Gateways
- Beschädigte LocalStorage- und IndexedDB-Daten
- Fehlgeschlagener oder abgebrochener API-Aufruf

### Abnahmekriterien

- Die Tests laufen lokal mit einem dokumentierten Befehl.
- Jeder Push auf `test` führt die Prüfungen automatisch aus.
- Ein fehlerhafter Test verhindert das Zusammenführen nach `main`.

## Phase 5: JavaScript in Module aufteilen

**Priorität:** Mittel

### Zielstruktur

```text
src/
  app.js
  data/
    api.js
    cache.js
    normalize.js
    validate.js
  trading/
    calculator.js
    trading-view.js
  routes/
    optimizer.js
    route-map.js
    cargo.js
  shopping/
    shopping-view.js
  vehicles/
    vehicle-view.js
  shared/
    formatting.js
    dom.js
```

### Vorgehen

- Zuerst reine Rechen- und Formatierungsfunktionen herauslösen.
- Danach Cache und API-Zugriff trennen.
- Anschließend Trading und Routenplanung aufteilen.
- Shopping, Komponenten und Fahrzeuge zuletzt migrieren.
- Pro Schritt Verhalten mit Tests absichern.
- Keine vollständige Neuschreibung in einem einzigen Commit durchführen.

### Abnahmekriterien

- `script.js` ist nicht mehr die zentrale Datei für sämtliche Bereiche.
- Module besitzen klar abgegrenzte Verantwortlichkeiten.
- Berechnung und DOM-Darstellung sind voneinander getrennt.
- Alle bisherigen Benutzerwege funktionieren unverändert.

## Phase 6: Datenmenge und Ladezeit reduzieren

**Priorität:** Mittel

### Aktueller Stand

| Datei | Ungefähre Größe |
| --- | ---: |
| `shopping-prices.js` | 1,47 MB |
| `shopping-items.js` | 675 KB |
| `data.js` | 576 KB |
| `script.js` | 80 KB |

### Aufgaben

- Shopping-Daten erst beim Öffnen von Shopping oder Komponenten laden.
- Schiffs- und Fahrzeugdaten verzögert laden.
- Statische Datendateien nach Bereichen oder Kategorien aufteilen.
- JSON-Daten statt ausführbarer JavaScript-Datendateien prüfen.
- Gzip oder Brotli für das Hosting aktivieren.
- Nicht benötigte Rohdaten nicht mit der Web-App ausliefern.
- Wiederholte Felder und lange Terminalnamen beim Build normalisieren.
- Ladezeit und übertragene Datenmenge vor und nach der Änderung messen.

### Abnahmekriterien

- Trading ist ohne Laden der vollständigen Shopping-Daten bedienbar.
- Der erste Seitenaufruf überträgt deutlich weniger Daten.
- Lazy Loading erzeugt keine leeren oder flackernden Ansichten.

## Phase 7: Repository und Dokumentation vervollständigen

**Priorität:** Mittel

### Aufgaben

- `.gitignore` ergänzen.
- Lizenz festlegen und als Datei hinzufügen.
- Entwicklungs- und Testanleitung dokumentieren.
- Erzeugung der lokalen Datendateien beschreiben.
- Verwendete UEX-API-Version dokumentieren.
- Unterstützte Star-Citizen-Version oder Patchstand anzeigen.
- Branch-Ablauf für `test`, Missionsentwicklung und `main` dokumentieren.
- Veröffentlichungscheckliste ergänzen.
- Datenquellen und Grenzen der Systemkarte erläutern.

### Abnahmekriterien

- Ein neuer Entwickler kann die App lokal starten und testen.
- Datenaktualisierung und Veröffentlichung sind reproduzierbar.
- Die README verweist auf diesen Verbesserungsplan.

# Teil B: Weiterführende Empfehlungen

Diese Punkte beginnen erst, wenn die kritischen Phasen abgeschlossen und durch
Tests abgesichert sind.

## Handel und Wirtschaft

- Budgetfeld mit automatisch maximal kaufbarer SCU
- Filter `Nur vollständig verfügbare Routen`
- Preisalter direkt pro Route anzeigen
- Risikoaufschlag für illegale Waren
- Favorisierte Waren, Stationen und Routen
- Vergleich mehrerer Schiffe für dieselbe Route
- Gewinn pro Minute statt nur Gesamtgewinn
- Import und Export des Frachtplans als JSON oder CSV

## Routenplanung

- Echte Standortkoordinaten aus einer belastbaren Datenquelle
- Quantum-Distanzen zwischen Planeten, Stationen und Lagrange-Punkten
- Vollständiges Jump-Point-Netz
- Geschätzte Reisezeit anhand des gewählten Quantum Drives
- Atmosphären-, Lande-, Lade- und Entladezeiten
- Optimierung nach Gewinn pro Minute
- Automatisch optimierte Rundreisen
- Manuelles Sperren oder Bevorzugen einzelner Stopps
- Warnung bei unsicheren oder nur geschätzten Kartendaten

## Bedienung

- Favoriten
- Zuletzt verwendete Auswahl
- Direkte Verknüpfung zwischen Trading-Ergebnis und Frachtplan
- Teilen einer Route über eine kompakte URL oder JSON-Datei
- Druck- und mobile Kompaktansicht
- Optionale englische Oberfläche

## Daten

- Automatisierter täglicher Daten-Build über GitHub Actions
- Datenvergleich vor Veröffentlichung
- Änderungsbericht für neue und entfernte Items
- Anzeige des verwendeten Star-Citizen-Patches
- Getrennte Aktualisierungszeiten für Handel, Items, Fahrzeuge und Missionen

# Meilensteine

## M1: Verlässlicher Handelsrechner

Enthält Phase 1 und die zugehörigen Unit-Tests.

**Ergebnis:** Angezeigte Gewinne berücksichtigen Bestand, Nachfrage und Status.

## M2: Stabiler Datenbetrieb

Enthält Phase 2 und Phase 3.

**Ergebnis:** Die App startet sofort und bleibt bei API-Fehlern bedienbar.

## M3: Wartbare Anwendung

Enthält Phase 4, Phase 5 und die technische Dokumentation aus Phase 7.

**Ergebnis:** Änderungen können getestet und in klaren Modulen umgesetzt werden.

## M4: Schnellere und genauere Planung

Enthält Phase 6 sowie ausgewählte Empfehlungen zu echten Distanzen und
Reisezeiten.

**Ergebnis:** Schnellere Ladezeit und belastbarere Routenentscheidungen.

# Definition of Done

Eine Phase gilt erst als abgeschlossen, wenn:

- alle Aufgaben umgesetzt oder bewusst begründet verschoben wurden;
- die Abnahmekriterien erfüllt sind;
- passende automatisierte Tests vorhanden sind;
- Desktop- und Mobilansicht geprüft wurden;
- keine neuen Browserfehler auftreten;
- Dokumentation und Datenformat aktualisiert wurden;
- der Testbranch sauber ist;
- die Änderung vor dem Merge nach `main` als Spieler durchgetestet wurde.

# Empfohlene Reihenfolge

1. Handelsmenge, Gewinn und Marge korrigieren.
2. Sofortigen App-Start und Hintergrundupdate umsetzen.
3. API-Validierung und Cache-Versionierung ergänzen.
4. Tests und GitHub Actions einführen.
5. JavaScript schrittweise modularisieren.
6. Datenmenge und Ladezeit reduzieren.
7. Repository und Dokumentation vervollständigen.
8. Echte Distanzen, Reisezeiten und Gewinn pro Minute ergänzen.

Der erste Implementierungsschritt sollte Phase 1 sein. Solange die normale
Handelsübersicht Bestand und Nachfrage nicht konsequent begrenzt, kann eine
optisch beste Route wirtschaftlich unrealistisch sein.
