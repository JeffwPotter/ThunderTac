# Viewer

The replay viewer app. It reads only our own files: converted matches
(`sessions\*.wtr`) and terrain (`assets\terrain\*.wtt`).

## Use
Double-click `Open Viewer.bat` in the project folder. A black window appears
(the viewer program) and the viewer opens in its own window. Close the black
window to quit. Nothing is sent anywhere; the program only answers this PC.

## Parts
- `server/` — `wtviewer`, a small Go program (standard library only, no decoder
  code). It has the pages built in, hands the window the matches and terrain
  from the project folder, and analyses matches for the Debrief and Library
  pages (`analysis.go`, `envelope.go`, `library.go`; rules in `docs/analysis.md`).
  The analysis is saved next to each match as `<id>.analysis.json` and
  `<id>.library.json`.
- `web/` — the pages: TypeScript source in `web/src`, the 3D library three.js
  r170 (MIT licence) copied into `web/vendor/three`.
  - `data.ts` — reads a match; position of every unit at a time
  - `scene.ts` — the 3D view
  - `main.ts` — panels, timeline, keyboard
  - `lines.ts` — wide lines and roll-showing ribbons (WebGL lines are 1 px)
  - `envelope.ts` — missile fly-out estimate (same model as `server/envelope.go`)
  - `debrief.ts` — Debrief page; `library.ts` — Library page; `pk.ts` — Pk from similar shots; `charts.ts` — charts
- `build.sh` — bundles the pages with esbuild and compiles `bin/wtviewer.exe`.

## Not yet a packaged desktop app
The plan names Tauri as the app shell. This build uses a local program plus a
Microsoft Edge "app window" instead, because it needs nothing installed on the
PC and can be built entirely by Claude. The pages are the same either way;
wrapping them in Tauri later changes the window, not the viewer.

## Keys
Space play/pause · ←/→ 5 s (Shift: 30 s) · , . slower/faster · F follow ·
T top-down · H home · M select and follow me · 2 / 3 switch between 2D map and 3D · Esc clear selection / close a page

## Pages
- **Debrief** (top bar): report card with the biggest mistakes, shot
  scorecards, missiles fired at you with the notch meter, deaths, engagements,
  threats and position. Pick any player in the match. "Watch" jumps into the replay.
- **Library** (top bar): every match in `sessions\`, trends, Pk calculator,
  heatmaps, comparison with each match's top scorer and players in your aircraft.
