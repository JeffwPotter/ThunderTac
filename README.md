# War Thunder Replay Viewer

A private, offline, Tacview-style debrief tool for War Thunder server replays.
Scope and plan live in the claude.ai Project ("War Thunder Replay Viewer").

## For testers (Windows 10/11)
1. Download the latest zip from the repo's **Releases** page (or from whoever sent it to you) and extract it to a folder you can write to, such as `C:\WarThunderViewer`. Not into `Program Files`.
2. Double-click `Open Viewer.bat`. The viewer opens in its own window. If Windows SmartScreen warns about an unknown program, choose More info, then Run anyway (the programs are not signed).
3. **Add a match:** click **+ Add match** and paste a session ID or replay link from warthunder.com (the number in the replay page address, or the 16-letter/number ID). It downloads, converts and opens the match. Or put a downloaded replay (`.wrpl` or its `.zip`) through `tools\convert.bat`.
4. **Optional, once per game update:** run `tools\update-game-data.bat` to read your own War Thunder install (names, missiles, radars, terrain). It asks for the game folder if it cannot find it. Takes a few minutes and about 800 MB of temporary space.
5. Debrief and Library work on any converted match; Library gets better with more matches.
6. **Optional: your own flight data.** Display tab → Game telemetry → tick "Record my flight data while I play" and keep the viewer open while you play. Afterwards your aircraft in the replay shows real IAS, AoA, G, throttle and fuel. Details: `docs/live-telemetry.md`.
7. Put your in-game name in **Me** and your wingman's in **Wingman** (top bar).

**If something goes wrong** send the author:
- what you clicked and what happened (a screenshot helps), and
- the file `%LocalAppData%\WTReplayViewer\viewer.log` (paste `%LocalAppData%` into File Explorer's address bar).

`bin\wtviewer-console.exe` is the same program with a text window; run it from a Command Prompt to see messages live. `bin\wtviewer.exe -browser` opens the viewer in Edge instead of its own window.

Nothing is uploaded anywhere. "+ Add match" only downloads the public replay files from War Thunder's replay server.

## Game data catalogue (names, missiles, radars, mission areas) and terrain
`assets\catalog\` holds four small files read from your own game install.
They ship filled in; after a game update run `tools\update-game-data.bat`
to rebuild them, then convert replays again.

`assets\terrain\` holds one terrain file (`.wtt`) per map. Run
`tools\update-terrain.bat` once to build them for **every** map from your
install (it is also part of `update-game-data.bat`), then convert replays again.

## Debrief and Library
In the viewer, **Debrief** analyses the open match (your mistakes, shots,
defence, deaths, engagements); **Library** works across all matches (trends,
Pk calculator, heatmaps, compare with the best). How the numbers are worked
out: `docs\analysis.md`.

## Viewer (3D and 2D map)
Double-click `Open Viewer.bat`. The viewer opens in its own window (Windows'
built-in Edge WebView2; no black window). Closing the window quits. It lists
every match in `sessions\`. Details and keys: `viewer\README.md`.
`tools\make-shortcut.bat` puts a shortcut with the icon on your Desktop. If the
window does not appear, run `bin\wtviewer-console.exe` to see messages (or read
`%LocalAppData%\WTReplayViewer\viewer.log`); `bin\wtviewer.exe -browser`
opens it in Edge/your browser instead.

## What is here (v0.9.0, 2026-11-12)

| Folder | What |
|---|---|
| `decoder/` | Our own replay decoder (Go). Reads a server replay's pieces and writes a `.wtr` session file. Self-contained: all dependencies are in `decoder/vendor/`, nothing is downloaded when building. |
| `docs/wtr-format.md` | The `.wtr` session file format. |
| `docs/patch-day.md` | What to do when a game update changes the replay format. |
| `golden/` | Expected self-check reports for the reference matches. |
| `tools/` | `convert.bat` (convert one replay), `update-game-data.bat`, `update-terrain.bat`, `verify-golden.ps1` (regression check). |
| `bin/wtdecode.exe` | The built decoder for Windows. |
| `bin/wtviewer.exe` | The viewer (own window). `wtviewer-console.exe` is the same program with a console for troubleshooting. |
| `assets/decoder-tables/` | Missile, bomb, radar and loadout tables made from your install; the decoder uses them in place of its built-in copies. `docs/decoder-tables.md`. |
| `bin/wtassets.exe` | Reads game data from the local War Thunder install: `unpack`, `catalog`, `tables`, `terrain` (see the scripts in `tools/`). |
| `assets/terrain/` | Terrain height files (`.wtt`), one per map. Format and findings: `docs/terrain-notes.md`. |
| `tools/prototypes/terrain/` | Python prototypes that proved terrain extraction. |

## Adding a match by session ID (v0.8.0)

In the viewer, click **+ Add match** and paste the session ID: either the long
number on the match's replay page (`warthunder.com/en/tournament/replay/<number>`),
the 16-character ID, or the link itself. The viewer downloads the replay pieces
from War Thunder's replay server (`wt-game-replays.warthunder.com`, no sign-in),
converts them and opens the match. Pieces are kept in `sessions\_downloads\<id>\`;
an interrupted download continues where it stopped.
Without the viewer: `tools\fetch.bat <session ID>`.

## Converting a replay

Drag the downloaded replay `.zip` (or a folder holding all its `.wrpl` pieces)
onto `tools\convert.bat`. The session file appears in `sessions\`, named after
the zip or folder. The decoder prints its self-checks; every line should say PASS.

Command line:

    bin\wtdecode.exe -in <replay.zip or folder> -wtr sessions\<name>.wtr

Useful flags: `-check-report <file.json>` saves the self-check report;
`-strict` makes any failed check or unverified game version an error.

## Building the decoder

Needs Go 1.24 or newer. From `decoder\`:

    go build -mod=vendor -o ..\bin\wtdecode.exe .\cmd\wtdecode

## Licence

`decoder/` started as a one-time copy of community code and is AGPL-3.0
(see `decoder/LICENSE` and `decoder/SNAPSHOT.md`). That is fine for private use.
If this tool is ever shared, the decoder must be published under the AGPL or rewritten.
`decoder/oodle/` is translated from `ooz` (GPL-3.0), which is compatible with that.
