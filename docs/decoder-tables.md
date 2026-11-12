# Decoder game-data tables

The decoder (`wtdecode`) identifies missiles, bombs, radars and countermeasures
from tables built into the program. Those tables were made from game version
2.59.0.74. When the game adds new weapons or aircraft, the built-in copies do not
know them and the match shows them as unidentified.

Since v0.8.0 the tables can be regenerated from your own game install.

## How it works
1. `tools\update-game-data.bat` unpacks the game data, then runs
   `wtassets tables`, which writes six files into `assets\decoder-tables\`.
2. When `wtdecode` starts it looks for `assets\decoder-tables\` two folders up from
   its own exe (or the folder in the `WTDECODE_TABLES` environment variable).
   Any file found there replaces the built-in copy (`cmd/wtdecode/aaa_tables.go`).
   A file that is missing or is not valid JSON keeps the built-in copy.
3. Each converted match records which tables were used in its manifest
   (`decoder.localTables`), and `wtdecode` prints the same list.

| File | What it holds |
|---|---|
| `aam_models.json`, `agm_models.json` | air-to-air and air-to-ground missile models |
| `missile_carriers.json` | which aircraft carry which missiles (loadouts) |
| `bomb_models.json` | bombs and rockets |
| `countermeasure_ammo.json` | flares and chaff |
| `radar_modes.json` | radar modes and scan patterns |

## How it was checked
`wtassets tables` is a Go translation of the snapshot's Python generators
(`decoder/tools/...`). Run on the same datamine checkout the snapshot used
(f7952e42...), it produces files byte-identical to the built-in tables, so the
translation is exact. With `-datamine` it reads a datamine checkout; without it, an
unpacked install. The golden replays decode to the same results with the new tables.

## Not regenerated
These stay as built in, and may go out of date:
- SAM and ground-threat tables
- airfield geometry for maps added after the snapshot
- the hand-reviewed missile lists (`reviewed_missile_models.json`; guidance and model reviews)
- the ECS component hash table (`data/ecshashes.json`)

If a new map or a new SAM is not recognised, that is the cause. The viewer's own
catalogue (`assets\catalog`, from `wtassets catalog`) still gives correct names and
figures for everything it covers.

## After a game update
Run `tools\update-game-data.bat`, then convert the replays again. Matches converted
earlier keep the tables they were made with.
