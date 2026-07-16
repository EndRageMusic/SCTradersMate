# TradersMate - Bedienungsanleitung

Diese Anleitung beschreibt alle Bereiche von TradersMate. Die angezeigten Preise und Verfügbarkeiten stammen aus den lokalen UEX-Daten. Beim ersten Öffnen eines Tages versucht TradersMate, die Daten einmal zu aktualisieren.

## Allgemeine Bedienung

Nach dem Öffnen wählst du einen der sieben Arbeitsbereiche. Über die Navigationsleiste kannst du jederzeit direkt zu einem anderen Tab wechseln. Mit **Wechseln** kommst du zurück zur großen Bereichsauswahl.

Die Statuszeile am unteren Rand zeigt die Anzahl der geladenen Terminals, Waren und Shop-Items sowie den Stand der Daten an.

## Tab Handel

Im Tab **Handel** findest du Verkaufsziele für eine Ware, die du an einer ausgewählten Startstation einkaufst.

1. Wähle das **System**, zum Beispiel Stanton, Nyx oder Pyro.
2. Wähle das **Untersystem**, zum Beispiel ArcCorp oder Crusader.
3. Wähle die **Startstation**. Angezeigt werden nur Stationen mit vor Ort kaufbaren Handelswaren; Mining Facilities sind ausgeschlossen.
4. Wähle das **Material**, das du an der Startstation kaufen möchtest.
5. Trage unter **SCU-Menge** die geplante Frachtmenge ein.

Die Ergebnisliste zeigt passende Verkaufsstellen. Dabei gilt:

- **Einkauf**: Preis, den du für die gewählte SCU-Menge bezahlst.
- **Verkauf**: Betrag, den die Zielstation für die gewählte SCU-Menge zahlt.
- **Gewinn**: Verkauf abzüglich Einkauf.
- **Marge**: Gewinn im Verhältnis zum Einkaufspreis.
- Grüne Werte sind positiv, rote Werte sind negativ.
- Hinweise zeigen beispielsweise Auto-Load, Loading Dock oder verfügbare SCU an.

Klicke eine Ergebniszeile an, um den Datensatz oberhalb der Tabelle als ausgewählte Route anzuzeigen.

- **Fracht merken** übernimmt die Ware in die Frachtliste des Routenplaners.
- **Auf Karte** öffnet den Routenplaner mit der gewählten Start- und Zielstation.

## Tab Routenplaner

Der **Routenplaner** öffnet sich immer leer. Er verbindet Stationen auf einer schematischen 2D-Karte und zeigt Handelsmöglichkeiten an den Stopps.

### Route erstellen

1. Nutze bei Bedarf den **Systemfilter**, um die Stationslisten einzugrenzen.
2. Wähle dein **Schiff**. Daneben werden belegte, maximale und freie SCU angezeigt.
3. Wähle **Start** und **Ziel**.
4. Mit dem Pfeil zwischen den Feldern kannst du Start und Ziel tauschen.
5. Mit **Route leeren** entfernst du die gesamte Planung.

Die Karte ist schematisch. Sie zeigt Systeme und Stoppreihenfolge, aber keine exakten Entfernungen oder Flugzeiten.

### Zwischenstopps

Wähle unter **Zwischenstopp** eine Station und klicke **Stopp hinzufügen**. Du kannst mehrere Stopps anlegen und einzelne Stopps wieder entfernen. Stopps im gleichen System werden bei der automatischen Planung zuerst berücksichtigt.

### Abladen und mitnehmen

Für jeden Stopp werden zwei Bereiche angezeigt:

- **Abladen** zeigt gespeicherte Fracht, die an diesem Stopp verkauft werden kann, einschließlich Verkaufspreis und Gewinn.
- **Mitnehmen** zeigt profitable Waren, die an diesem Stopp gekauft und an einem späteren Routenpunkt verkauft werden können.

Bei **Mitnehmen** trägst du die gewünschte SCU-Menge ein und übernimmst sie in die Frachtliste. Überschreitet die gesamte Ladung die Kapazität des ausgewählten Schiffs, zeigt TradersMate eine Warnung und verhindert das Überladen.

### Gekaufte Waren

Die Frachtliste enthält gemerkte oder unterwegs aufgenommene Waren. Du kannst:

- SCU-Menge und tatsächlichen Einkaufspreis anpassen,
- den besten Abladeort und den möglichen Gewinn prüfen,
- mit **Karte** eine einzelne Ware in die Route übernehmen,
- einzelne Frachtposten entfernen,
- mit **Alle Stops planen** eine Route für die gesamte Fracht erzeugen,
- mit **Liste leeren** alle gespeicherten Waren löschen.

## Tab Shopping

Im Tab **Shopping** suchst du persönliche Ausrüstung und andere Shop-Items. Handelswaren und Schiffskomponenten werden hier bewusst nicht angezeigt.

1. Gib einen Namen, einen Bereich oder eine Kategorie in das Suchfeld ein.
2. Grenze die Ergebnisse bei Bedarf über **Kategorie** ein.
3. In der Ergebnisliste siehst du Item, Bereich, Kategorie und die Shops mit Preis.

Pro Item werden zunächst bis zu sechs Shops angezeigt. Über **+ weitere** blendest du zusätzliche Kaufstellen ein. Items ohne bekannte Verkaufsstelle werden nicht in der Tabelle angezeigt. Wenn deine Suche nur solche Items findet, meldet TradersMate, dass sie aktuell nicht zum Verkauf stehen.

Magazine für persönliche Waffen findest du in der Kategorie **Munition**. Fuel Nozzles werden unter dieser Bezeichnung statt als Docking Collars geführt.

## Tab Komponenten

Der Tab **Komponenten** enthält Schiffskomponenten und Schiffswaffen, die aus dem allgemeinen Shopping-Bereich herausgetrennt wurden.

1. Suche nach Komponentenname, Waffenname, Kategorie, Grade oder Class.
2. Wähle eine Kategorie, um die Liste einzugrenzen.
3. Vergleiche **Grade**, **Class**, Shop und Preis.

Schiffswaffen sind unter anderem in Cannons, Scatterguns, Gatlings und Repeaters aufgeteilt. Über **+ weitere** kannst du zusätzliche Händler für dasselbe Bauteil anzeigen.

## Tab Schiffe

Im Tab **Schiffe** findest du Schiffe mit bekannten Ingame-Kaufstellen.

1. Suche nach Schiffsname oder Hersteller.
2. Nutze den **Herstellerfilter**, um die Auswahl einzugrenzen.
3. Vergleiche Frachtkapazität, Crew und Kaufstellen.

Die Kaufstellen werden mit dem jeweiligen aUEC-Preis angezeigt. Die Schiffsauswahl im Routenplaner ist davon getrennt: Dort werden fliegbare Schiffe mit mehr als 0 SCU berücksichtigt, damit die Frachtkapazität berechnet werden kann.

## Tab Bodenfahrzeuge

Der Tab **Bodenfahrzeuge** funktioniert ähnlich wie der Schiffs-Tab.

1. Suche nach Fahrzeugname oder Hersteller.
2. Grenze die Liste über den **Herstellerfilter** ein.
3. Vergleiche Fracht, Crew, Kaufstellen und Preise.

Angezeigt werden Bodenfahrzeuge, für die in den geladenen Daten eine Ingame-Kaufstelle vorhanden ist.

## Tab Missionen

Der Tab **Missionen** zeigt freigegebene Aufträge aus der aktuellen Star-Citizen-Wiki-API. Technische Platzhalter und unfertige Datensätze werden ausgeblendet.

1. Suche nach Titel, Beschreibung oder Missionsgeber.
2. Grenze die Liste nach **System**, **Missionsgeber**, **Tätigkeit**, **Legalität** oder **Mindest-Rang** ein.
3. Wähle unter **Belohnung** nur Missionen mit Blueprint-Chance, wenn du gezielt nach Bauplänen suchst.
4. Klicke eine Mission an, um die vollständige Detailansicht oberhalb der Tabelle zu öffnen.

Die Detailansicht zeigt, soweit im Spieldatensatz vorhanden, Auszahlung, Mindest-Rang, Rufgewinn, Zeitlimit, Fracht, Gegenstandsbelohnungen, Blueprint-Pool und weitere Voraussetzungen. Einige Missionen verwenden variable Orte oder Auszahlungen; diese Werte können deshalb als Platzhalter oder ohne festen Betrag erscheinen.

Unter **Mindest-Rang** kannst du einen konkreten Rufrang oder **Kein Mindestrang** auswählen. Die Rangnamen stammen direkt aus den Spieldaten und können je nach Missionsgeber unterschiedlich sein.

Die Missionsliste wird einmal pro Tag zusammen mit den Handelsdaten aktualisiert. Erweiterte Details werden beim Anklicken der jeweiligen Mission nachgeladen.

## Hinweise zu Preisen und Daten

- UEX-Daten können sich schneller ändern als der lokale Tagesstand.
- Prüfe vor einem sehr großen Einkauf den Preis und Bestand noch einmal am Terminal.
- Eine berechnete Marge garantiert nicht, dass die Zielstation deine vollständige Ladung sofort abnimmt.
- Wenn die Tagesaktualisierung nicht erreichbar ist, verwendet TradersMate den letzten lokal verfügbaren Datensatz.
- Missionsdaten stammen aus der community-gepflegten Star-Citizen-Wiki-API und können von den tatsächlich angebotenen Aufträgen im Spiel abweichen.
