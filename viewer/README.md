# Viewer

The replay viewer app. It reads only our own files: converted matches
(`sessions\*.wtr`) and terrain (`assets\terrain\*.wtt`).

## Use
Double-click `Open Viewer.bat` in the project folder. The viewer opens in its
own window (Edge WebView2, built into Windows 10/11). Close the window to quit.
Nothing is sent anywhere except when you use "+ Add match"; the program otherwise
only answers this PC. The icon and DPI setting are linked in from
`server/rsrc_windows_amd64.syso`, made by `tools/mksyso` from `res/app.ico` and
`res/app.manifest` (the usual tool could not be downloaded here, so it is our own).

## Parts
- `server/` — `wtviewer`, a small Go program (standard library plus the vendored
  go-webview2 in `server/third_party/`; no decoder
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

## Desktop window
Since v0.8.1 `wtviewer.exe` shows the viewer in its own window (Edge WebView2,
built into Windows 10/11) instead of Tauri, which could not be built here.
`-browser` opens Edge/the default browser instead.

## Mouse (3D view)
- **Left-drag**: rotate around the ground point in the middle of the screen.
- **Right-drag** (or Ctrl + left-drag): move the view. Doing this while following
  a unit stops following.
- **Wheel**: zoom toward the mouse pointer, all the way down to about 30 m above
  the ground. The camera never goes below the terrain.
- **Click**: select · **Shift-click**: measure · **Double-click** a unit: follow it;
  double-click the ground: centre the view there.
- 2D map: drag to move, wheel to zoom at the pointer.

## Keys
Space play/pause · ←/→ 5 s (Shift: 30 s) · , . slower/faster · F follow ·
T top-down · H home · M select and follow me · 2 / 3 switch between 2D map and 3D · Esc clear selection / close a page

## Pages
- **Debrief** (top bar): report card with the biggest mistakes, shot
  scorecards, missiles fired at you with the notch meter, deaths, engagements,
  threats and position. Pick any player in the match. "Watch" jumps into the replay.
- **Library** (top bar): every match in `sessions\`, trends, Pk calculator,
  heatmaps, comparison with each match's top scorer and players in your aircraft.
