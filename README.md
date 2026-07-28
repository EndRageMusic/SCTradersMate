# TradersMate

Kleines eigenstaendiges Web-Tool fuer Star-Citizen-Handelsrouten.

## Starten

Oeffne `index.html` direkt im Browser.

## Bedienung

Eine ausführliche Erklärung für Handel, Routenplaner, Shopping, Komponenten, Schiffe und Bodenfahrzeuge findest du in der [Bedienungsanleitung](ANLEITUNG.md).

Die Anleitung steht außerdem als [PDF-Version](output/pdf/TradersMate-Bedienungsanleitung.pdf) bereit.

Die Daten liegen lokal in `data.js` und wurden aus der UEX Corp API 2.0 erzeugt. Enthalten sind sichtbare Waren, Commodity-/Admin-Terminals und die zugehoerigen Commodity-Preiszeilen. Preise in Star Citizen aendern sich schnell; pruefe groessere Ladungen vor dem Vollkauf kurz im Terminal oder in UEX.

Der Handel beruecksichtigt gemeldeten Bestand, Nachfrage, SCU-Menge und ein
optionales Budget. Unbekannte Mengen werden deutlich gekennzeichnet. Die
Frachtliste kann als JSON oder CSV exportiert werden. Beim Oeffnen erscheint
sofort der lokale Stand; das Tagesupdate laeuft im Hintergrund und kann ueber
`Aktualisieren` erneut gestartet werden.

## Tests

Die Handelsrechnung besitzt automatisierte Tests. GitHub Actions fuehrt bei
Pushes auf `main` und `test` zusaetzlich Syntaxpruefungen aus.

## Weiterentwicklung

Die priorisierten fachlichen Korrekturen, technischen Arbeiten und spaeteren
Funktionserweiterungen stehen im
[SCTradersMate Verbesserungsplan](SCTradersMate-Verbesserungsplan.md).
