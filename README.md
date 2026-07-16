# TradersMate

Kleines eigenstaendiges Web-Tool fuer Star-Citizen-Handelsrouten.

## Starten

Oeffne `index.html` direkt im Browser.

## Bedienung

Eine ausführliche Erklärung für Handel, Routenplaner, Shopping, Komponenten, Schiffe, Bodenfahrzeuge und Missionen findest du in der [Bedienungsanleitung](ANLEITUNG.md).

Die Anleitung steht außerdem als [PDF-Version](output/pdf/TradersMate-Bedienungsanleitung.pdf) bereit.

Die Daten liegen lokal in `data.js` und wurden aus der UEX Corp API 2.0 erzeugt. Enthalten sind sichtbare Waren, Commodity-/Admin-Terminals und die zugehoerigen Commodity-Preiszeilen. Preise in Star Citizen aendern sich schnell; pruefe groessere Ladungen vor dem Vollkauf kurz im Terminal oder in UEX.

Missionsdaten werden einmal pro Tag aus der Star Citizen Wiki API geladen und im Browser zwischengespeichert. Erweiterte Angaben zu Blueprint-Pools, Ruf und Voraussetzungen werden beim Auswaehlen einer Mission nachgeladen.
