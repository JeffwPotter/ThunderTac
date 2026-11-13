# CLAUDE.md — Project Context & Engineering Guide for ThunderTac

Architecture, conventions, physics invariants and build/test workflow for Claude
when working on this repository.

## 1. Project Purpose & Scope Boundaries

ThunderTac is a standalone tactical replay viewer and post-match debrief tool for
War Thunder Air Realistic Battles (Air RB) and, from v0.10.0, Ground Realistic
Battles (Ground RB; `docs/ground.md`), built for private use by the author
(in-game name `spurzz`) and his wingman. The author does not write code; he tests
and steers. Explain changes in plain language.

* **Primary combat focus (Fox-1 / Fox-2 / Fox-3 era):** radar SARH (Fox-1), active
  radar (Fox-3) and IR (Fox-2) jet engagements: BVR launch envelopes, SARH
  illumination, ARH datalink-to-active transitions, notch/crank geometry,
  chaff/flare effectiveness, radar multipath.
* **Local-first:** local `.wtr` session archives and the native Windows window
  (`viewer/server/window_windows.go`, Edge WebView2). Nothing is uploaded; the only
  network use is "+ Add match", which downloads public replay files from
  `wt-game-replays.warthunder.com` (`viewer/server/fetch.go`).
* **Out of scope:** WebRTC/WebSocket live multi-user playback rooms, unless asked.
* **Own-ship telemetry (v0.9.0):** `viewer/server/live.go` records the game's
  `localhost:8111` data while the viewer is open (opt-in setting) and matches each
  flight to the player's aircraft (`docs/live-telemetry.md`). Results live in a
  sidecar `<id>.ownship.json`; **never modify `.wtr` files from the viewer.**
* **Active tracks:**
  1. Fox-1/Fox-3 fly-out physics and lock/multipath grading
     (`viewer/server/envelope.go`, `viewer/web/src/envelope.ts`, `viewer/server/analysis.go`).
  2. First real test of the telemetry recorder (field names of `/state` and
     `/indicators` are not yet verified against a live game; each log stores the
     names it saw in `keys`).
  3. Ground battles (v0.10.0): tank attitude, gun direction, shots with computed
     shell arcs (`decoder/cmd/wtdecode/wtr_ground.go`), vehicle weapon catalogue
     (`decoder/cmd/wtassets/ground_catalog.go`), 2 m battle-area terrain, map
     objects (buildings/walls/rocks/trees from the level `RIGz` block and
     `riDesc.bin`; `decoder/cmd/wtassets/objects.go`). Next: forests from
     land-class density maps (maybe), then a ground debrief.
* **Tried and rejected (with data, v0.9.0; see `docs/analysis.md`):** extra
  turning drag against beaming targets; smoothing aircraft speeds.

## 2. Repository Architecture & Data Pipeline

| Component | Path | Responsibility |
| :--- | :--- | :--- |
| Replay decoder (`wtdecode`) | `decoder/` | Go module (path `github.com/maxsupermanhd/wrpl-inspector/v3`, Go 1.24, **AGPL-3.0**, one-time snapshot of wrpl-acmi; see `decoder/SNAPSHOT.md`). Reads `.wrpl` replay pieces (`decoder/wrpl/`), decodes BLK and packet streams, identifies weapons/radars from its tables (`docs/decoder-tables.md`), writes a `.wtr` archive. Dependencies vendored in `decoder/vendor/`. |
| Oodle decompressor | `decoder/oodle/` | Our Go translation of part of `ooz` (**GPL-3.0**), Leviathan only. Used for map level files. |
| Game data tool (`wtassets`) | `decoder/cmd/wtassets/` | `unpack` (game archives), `catalog` (`assets/catalog/`: vehicles, weapons, radars, mission areas), `tables` (`assets/decoder-tables/`), `terrain` (`assets/terrain/*.wtt`, `docs/terrain-notes.md`). |
| Session archive (`.wtr`) | `docs/wtr-format.md` | ZIP: `manifest.json`, `players.json`, `units.json`, `tracks.bin` (~4 Hz samples), `events.json`, `states.json`, `launches.json`, `map.json`, `stats.json`. |
| Viewer backend (`wtviewer`) | `viewer/server/` | Go HTTP server on 127.0.0.1 plus the WebView2 window (`window_windows.go`; vendored libraries in `third_party/`). Match list (`library.go`, `wtrfile.go`), fetcher (`fetch.go`), analysis (`analysis.go`, `envelope.go`), telemetry recorder and matching (`live.go`). Uses no decoder code. Files it writes next to a match: `<id>.analysis.json`, `<id>.library.json`, `<id>.ownship.json` (caches; safe to delete). |
| Viewer frontend | `viewer/web/` | TypeScript + Three.js, bundled by esbuild into `viewer/server/webdist/` (committed). 3D/2D view (`scene.ts`, `lines.ts`), playback (`main.ts`), charts (`charts.ts`), Debrief (`debrief.ts`), Library (`library.ts`), fly-out model (`envelope.ts`), Pk (`pk.ts`). |

## 3. Critical Code Invariants & Conventions

### A. Coordinates
* Game/replay space: x = East, y = Up (altitude MSL), z = North.
* Three.js: drawn at `(x, y, -z)` (`viewer/web/src/scene.ts`, top comment).
* When converting headings, radar azimuth cones or bearings between Go and the
  3D view, check that the z negation does not flip clockwise/counter-clockwise.

### B. Go and TypeScript fly-out model must stay identical
* `viewer/server/envelope.go` and `viewer/web/src/envelope.ts` both implement
  `atmosphere(h)`, the drag shape (`dragShape` / `SHAPE`), `motor(t)` (stage 0,
  optional stage 1, coast), `reaches(...)` and `envelope(...)` (dt = 0.1 s,
  binary search over 1–250 km to ≤ 100 m, at most 22 steps).
* Change both in the same commit and update `docs/analysis.md`.
* `viewer/server/envelope_parity_test.go` runs both on the same cases and fails
  if they differ (needs Node.js 22.18+; skipped without it). Run `go test ./...`
  in `viewer/server` after any change to either file.

### C. Game data is the source of truth
* Missile figures come from the user's own game install through
  `assets/catalog/weapons.json` (`physics`: `thrustN`, `burnS`, `massKg`,
  `massEndKg`, optional `thrust1N`/`burn1S`/`massEnd1Kg`, `cxK`, `caliberM`,
  `machMax`, `lifeS`, `guidanceTimeS`, `seekerRangeM`, `multipath`, `loft`).
* **Do not hardcode** values that the game files carry per missile or per radar
  (multipath heights, seeker ranges, notch widths). Multipath, for example, is
  `[0, 1, 60, 0]` for AIM-7M/AIM-120/R-77 but `27.5 m` or `0.5 m` for others.
  If outside sources disagree with the game files, tell the user rather than
  changing the code.

### C2. Ground battles (`docs/ground.md`)
* Hull heading = `raw16 × 360/65536 + 90°`; roll = −raw (checked against terrain
  slope); world gun bearing = `90° − q0`, elevation = `q1`. Verified on three
  Ground RB matches; the `ground_*` self-checks guard them.
* Weapon index in the replay = entry in the vehicle's `commonWeapons` list.
  **14.7 mm and smaller = machine gun; larger = cannon** (user's rule). A gun
  that can also fire a gun-launched missile stays a cannon.
* Shell drag uses the game's `ballisticCaliber` (dart diameter) when present.
* Shell arcs are computed, never recorded. Only kill shots may have their
  elevation adjusted (≤ 1.5°, stored as `elevAdjDeg`); never move other shots.
* `shots.json` is written only when the match has player ground vehicles: air
  battle output must stay unchanged (golden).

### D. Known replay data limits (`docs/analysis.md`)
1. ~4 Hz position sampling. Do not take unsmoothed two-point differences for
   G or turn rate.
2. Server replays name the target only on hits/kills. Miss targets are inferred
   (launch lock, seeker, trajectory).
3. No cockpit camera or manual radar tilt in replays. Pilot reaction is inferred
   (`reactTurnDeg = 30`, `reactDiveM = 600`, `reactWindowMs = 30000` in `analysis.go`).

### E. Constants to keep in step with `docs/analysis.md`
`nearKm = 40`, `losKm = 60`, `aloneKm = 20`, `notchHalfStrict = 20` m/s,
`notchHalfLoose = 40` m/s, `notchElevDefDeg = 3.5`° (all in `analysis.go`).

### F. Settings
Viewer settings persist in `localStorage` under `wtrv.settings`
(`viewer/web/src/main.ts`, type in `scene.ts`). Keys include `me`, `wingmen`
(comma-separated names), `pkScope` (`all` | `self` | `squad`). Add new keys with
defaults in `DEFAULTS`; never rename existing ones.

## 4. Build, Verify, Patch Day

* **Build everything offline:** Go 1.24 with `GOTOOLCHAIN=local GOPROXY=off`.
  Viewer: `viewer/build.sh` (needs esbuild; bundles `web/` into `server/webdist/`,
  then builds `bin/wtviewer`, `bin/wtviewer.exe` (windowed) and
  `bin/wtviewer-console.exe`). Decoder: `go build ./cmd/wtdecode ./cmd/wtassets`
  in `decoder/`.
* **Windows icon/manifest:** `viewer/server/rsrc_windows_amd64.syso`, regenerate with
  `viewer/tools/mksyso` from `viewer/res/`.
* **Viewer tests:** `go test ./...` in `viewer/server`. With
  `WTRV_SESSIONS=<folder of .wtr>` also: fly-out model vs recorded flights and
  outcome zones (`envelope_check_test.go`), telemetry matching on synthetic
  recordings (`live_test.go`), target guessing on known targets (`infer_test.go`).
  Bump `analysisVersion` in `analysis.go` whenever analysis output changes.
* **Golden regression check:** after touching `decoder/` or `.wtr` output, run
  `powershell -ExecutionPolicy Bypass -File tools/verify-golden.ps1` (compares to
  `golden/*.checks.json`).
* **Releases:** `.github/workflows/release.yml` (push a `v*` tag or run it from
  Actions) builds the Windows programs and attaches a zip to a GitHub Release.
* **Patch day:** `docs/patch-day.md`; `tools/update-game-data.bat` refreshes
  `assets/catalog/`, `assets/decoder-tables/` and terrain from the install.
* **Licence:** the decoder is AGPL-3.0 with a GPL-3.0 Oodle port. The repo is
  private; making it public requires AGPL for the whole.
