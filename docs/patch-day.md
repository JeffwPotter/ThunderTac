# Patch day: when a game update changes the replay format

Sessions already converted to `.wtr` are not affected. Only new replays are.

## 1. Find out whether anything broke
1. Play one match on the new version and download its server replay.
2. Convert it. Read the self-checks.
   - The first check will say WARN "version not verified". That alone is expected.
   - If **every other check passes**, the format did not change in a way that matters.
     Add the new version number to `wtrVerifiedVersions` in `decoder/cmd/wtdecode/wtr.go`,
     rebuild, and save the check report into `golden/`.
3. Run `tools\verify-golden.ps1` to confirm the old reference matches still decode identically.

## 2. If a check fails
Each failed check prints "where to look", naming the parser that reads that data.

| Failed check | Usual cause | Where |
|---|---|---|
| Replay will not open at all | Header layout or compression changed | `decoder/wrpl/header.go`, `wrplRead.go`, `server_directory.go` |
| Results table | Results block moved or changed | `decoder/wrpl/blk.go` |
| Players have no vehicle | Player slots or object construction changed | `wrpl/packet/parser/slot`, `wrpl/packet/parser/ecs2` |
| Shoot-downs ≠ deaths | Kill message changed | `wrpl/packet/parser/kill` (message 0xF058) |
| Aircraft rate / heading vs course | Aircraft state record changed | `wrpl/packet/parser/fm` (packet type 2) |
| Missiles start at launcher / missile kills | Missile sync or launch records changed | `wrpl/packet/parser/projectiles` (message 0xF11A) |
| Radar state | Sensor block changed, or new radars missing from the catalogue | `wrpl/packet/parser/fm`, `cmd/wtdecode/data/radar_modes.json` |
| Game-object records skipped | New component types | `data/ecshashes.json`, `wrpl/packet/parser/ecs2/Parsers.go` |

History, as a guide to what changes look like: for version 101404 the packet stream
switched from zlib to zstd, and object construction records gained one extra byte.

## 3. After fixing
- All self-checks pass on the new match.
- `tools\verify-golden.ps1` passes for every older reference match.
- Add the new match's check report to `golden/`, and keep its replay zip with the others.

## Game data after an update
Run `tools\update-game-data.bat`. It reads your game install and rebuilds `assets\catalog\` (vehicle names, missile figures, radar scan patterns, mission areas). New aircraft, missiles and radars then get correct names and data without any code change. The decoder's own built-in tables (missile identification, airfield geometry) are from November 2026 and are only a fallback for names; airfield geometry for maps added later needs the snapshot's airfield catalogue regenerated.
