# Workout Tracker

Trainingstracker für einen festen 3er-Split (Rücken / Brust / Beine).
Reines Frontend: eine HTML-Datei, kein Backend, kein Login, keine Datenbank.

## Funktionen

- Drei Tage als Reiter, der zuletzt benutzte ist beim Öffnen vorausgewählt
- Pro Übung eine aufklappbare Karte mit Demo-Medium, Sätzen und Wiederholungsbereich
- **„Letztes Mal: 45 kg × 10"** über jedem Satz – ohne Klick sichtbar
- Eingabefelder starten mit den Werten vom letzten Training
- Verlauf pro Übung: letzte 10 Einheiten + Liniendiagramm des Arbeitsgewichts
- „Training beenden" schreibt die Einheit mit Datum in den Verlauf
- Plan im Browser bearbeitbar: umbenennen, hinzufügen, löschen, Sätze, `demoUrl`
- Export/Import aller Daten als JSON

## Wo liegen die Daten?

Ausschliesslich im `localStorage` des Browsers, unter diesen Schlüsseln:

| Schlüssel        | Inhalt                          |
|------------------|---------------------------------|
| `wt.plan.v1`     | Trainingsplan inkl. `demoUrl`   |
| `wt.history.v1`  | abgeschlossene Trainings        |
| `wt.drafts.v1`   | laufendes, noch offenes Training|
| `wt.ui.v1`       | zuletzt gewählter Tag           |

Nichts davon verlässt das Gerät. Es gibt keinen Server, der etwas speichert.

**Wichtig:** `localStorage` hängt am Origin. Die gehostete Seite und eine lokal
geöffnete Datei sind zwei getrennte Datenbestände. Und Browserdaten löschen
löscht auch den Trainingsverlauf – darum regelmässig über ⚙ → *JSON exportieren*
sichern. Die Exporte sind in `.gitignore` ausgeschlossen, damit sie nicht
versehentlich im öffentlichen Repo landen.

## Dateien

| Datei                  | Zweck                                            |
|------------------------|--------------------------------------------------|
| `index.html`           | die komplette App (HTML + CSS + JS in einer Datei)|
| `sw.js`                | Service Worker, damit die App offline startet     |
| `manifest.webmanifest` | für „Zum Startbildschirm hinzufügen"              |
| `icon.svg`             | App-Icon                                          |

## Lokal öffnen

`index.html` doppelklicken. Der Service Worker läuft dabei nicht (nur über
HTTPS), alles andere funktioniert.

Zum Testen mit Service Worker:

```bash
python -m http.server 8765
```

Dann `http://localhost:8765` aufrufen.

## Deployment (GitHub Pages)

1. Auf github.com ein neues, leeres Repository anlegen (z.B. `workout`, **Public**).
2. Im Ordner dieses Projekts:

```bash
git remote add origin https://github.com/DEIN-NAME/workout.git
git branch -M main
git push -u origin main
```

3. Im Repo: *Settings* → *Pages* → Source: *Deploy from a branch* → `main` / `(root)` → *Save*.
4. Nach ein bis zwei Minuten erreichbar unter `https://DEIN-NAME.github.io/workout/`.
5. Am Handy im Browser öffnen → Menü → *Zum Startbildschirm hinzufügen*.

## Demo-Animationen

Fertig vorbereitet: `plan-mit-demos.json` enthält den Plan mit Bildern zu allen
20 Übungen (frei lizenziert, von wger.de). Einlesen über ⚙ → *JSON importieren*.
Die Datei hat bewusst **kein** `history`-Feld – dadurch wird nur der Plan
ersetzt, gespeicherte Trainings bleiben erhalten.

Alternativ pro Übung im Plan-Editor (✎) das Feld `demoUrl` füllen – GIF, Bild oder Video.
Externe Adressen müssen `https://` sein, sonst blockiert der Browser sie auf der
gehosteten Seite. Einmal geladene Medien landen im Cache und funktionieren
danach auch offline.

Frei nutzbare Quellen:

- [wger.de](https://wger.de) – Open-Source-Trainingsdatenbank, frei lizenzierte Bilder
- [Wikimedia Commons](https://commons.wikimedia.org) – einzelne Übungsanimationen unter freier Lizenz
- Selbst im Gym filmen – passt exakt zu den eigenen Geräten

Fremde GIFs von kommerziellen Fitness-Seiten sind in der Regel urheberrechtlich
geschützt und gehören nicht in ein öffentliches Repo.
