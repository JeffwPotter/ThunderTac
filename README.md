# War Thunder Replay Viewer

A private, offline, Tacview-style debrief tool for War Thunder server replays.
Scope and plan live in the claude.ai Project ("War Thunder Replay Viewer").

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
Double-click `Open Viewer.bat`. A black window opens (the viewer program; keep
it open) and the viewer appears in its own window. It lists every match in
`sessions\`. Details and keys: `viewer\README.md`.

## What is here (v0.8.0, 2026-11-12)

| Folder | What |
|---|---|
| `decoder/` | Our own replay decoder (Go). Reads a server replay's pieces and writes a `.wtr` session file. Self-contained: all dependencies are in `decoder/vendor/`, nothing is downloaded when building. |
| `docs/wtr-format.md` | The `.wtr` session file format. |
| `docs/patch-day.md` | What to do when a game update changes the replay format. |
| `golden/` | Expected self-check reports for the reference matches. |
| `tools/` | `convert.bat` (convert one replay), `update-game-data.bat`, `update-terrain.bat`, `verify-golden.ps1` (regression check). |
| `bin/wtdecode.exe` | The built decoder for Windows. |
| `bin/wtassets.exe` | Reads game data from the local War Thunder install: `unpack`, `catalog`, `terrain` (see the scripts in `tools/`). |
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
