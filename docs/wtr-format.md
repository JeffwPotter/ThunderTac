# The `.wtr` session file (schema 1)

One `.wtr` file holds one match, converted from a War Thunder server replay by
`wtdecode`. It is our own format: the viewer and the statistics engine read only
this, never the original replay. A session converted today stays readable
after game updates.

A `.wtr` is an ordinary **ZIP archive** with these entries:

| Entry | Content |
|---|---|
| `manifest.json` | What the file is, where it came from, the self-check results |
| `players.json` | Players, teams, their aircraft, their row from the results table |
| `units.json` | Every object with a track: aircraft, missiles, countermeasures, bombs, ground units |
| `tracks.bin` | The numeric track data, referenced from `units.json` |
| `events.json` | Kills, launches, countermeasure releases, messages |
| `states.json` | Radar and target-designation changes over time |
| `launches.json` | One record per missile launch: launch conditions and outcome (decoder 0.3.0 and later) |
| `map.json` | Airfields and mission areas for this match (decoder 0.5.0 and later) |
| `stats.json` | Per-player totals for the match (decoder 0.5.0 and later) |
| `results.json` | The match results table as recorded by the server |

## Conventions
- **Time** `t`: milliseconds on the replay clock (the same clock for every entry).
- **Position**: metres on the map. `x` = east, `y` = altitude, `z` = north.
- **Angles**: degrees. `heading` clockwise from north (+z); `pitch` positive nose-up; `roll` positive right wing down.
- **Unit id**: the unit's index in `units.json`. All references (`parent`, `killer`, `victim`, `target1`…) use it.
- **Player**: referred to by `slot` (0–255), as in `players.json`.
- **Team**: 1 or 2; 0 when unknown.

## manifest.json
```
format: "wtr", schema: 1, created
decoder:  { name, version, snapshot }
source:   { sessionId, replayVersion, server, shards[], shardFiles[], complete }
match:    { level, mission, battleType, environment, visibility, difficulty,
            startTimeUnix, startTimeUtc, tFirstMs, tLastMs, timePlayedS, status }
coords:   { units, axes, angle }          // the conventions above, in words
counts:   { aircraft, missile, countermeasure, bomb, ground }
selfChecks: [ { id, name, status: pass|warn|fail|skipped, value, expected, hint? } ]
```

## players.json
Array of `{ slot, name, clan?, title?, team, userId, units[], results{} }`.
`units` lists the player's aircraft units in time order. A player has more than
one when they land, rearm and take off again; each flight is its own unit.
`results` is the player's row from the results table (kills, teamKills, deaths,
assists, score, missileEvades, …).

## units.json
Array of:
```
id, kind: aircraft | missile | countermeasure | bomb | ground
name            display name ("F/A-18E", "AIM-120D", "Chaff")
class?          internal game name ("fa_18e_block_2")
player?         player slot (aircraft flown by a player)
ai?             true for AI aircraft
team
parent?         unit that launched or released this one
replayUid       the id used inside the replay (for debugging)
tStart, tEnd    lifetime on the replay clock
destroyed?      true when the unit ended by being destroyed
endReason?      "ground" when an aircraft track was ended where it went into the terrain (needs the map's terrain file)
estimated?      true when the path was computed, not recorded (most countermeasures, many bombs)
static?         ground objects that never move
samples         number of track samples
columns[]       { name, type: u32 | f32 | u8, offset, count }  → into tracks.bin
missile?        { model, family, internalName, modelConfidence, guidance: ARH|SARH|IR…, guidanceConfidence, surfaceLaunched,
                  spec? }   spec = figures from the local game install: maxG, machMax, rangeMaxM, burnS, lifeS, seekerLockRangeM, …
countermeasure? { type: Flare | Chaff }
bombReleasePointOnly?  true when only the release point is known
```

### Track columns (in `tracks.bin`)
All values little-endian; every column starts on a 4-byte boundary, so it can be
viewed directly as a typed array. `offset` is in bytes from the start of `tracks.bin`.

| Kind | Columns |
|---|---|
| all | `t` (u32), `x`, `y`, `z` (f32) |
| aircraft | + `heading`, `pitch`, `roll` (f32). About 4 samples per second. From decoder 0.5.0 also the derived columns `speed` (m/s), `mach`, `g`, `climb` (m/s), `agl` (metres above terrain; NaN without a terrain file) |
| missile | + `seekerMode` (u8: 0 none/unknown, 1 search, 2 track), `seekerKind` (u8: 0 none, 1 radar, 2 infrared, 3 unknown), `seekerRange` (f32, metres), `losX/Y/Z` (f32, seeker line-of-sight unit vector), `targetEstX/Y/Z` (f32, seeker's target estimate). About 24 samples per second. Missing values are NaN. From decoder 0.5.0 also derived `speed`, `mach`, `g` |
| countermeasure, bomb, ground | position only |

Derived columns are computed from position and time (the replay stores none of them): speed and climb by difference over the neighbouring samples, G from the change in velocity over ±2 samples plus gravity, Mach with the standard atmosphere. They are noisy in the first and last second of a track.

## events.json
Array sorted by `t`. `type` is one of:
- `kill`: `killer?`, `victim?` (unit ids), `killerPlayer?` (slot), `weapon` (internal name), `teamKill?`,
  `missile?` (the killer's missile unit that reached the victim) and `missDistanceM?` (closest recorded approach);
  from decoder 0.5.0 also `victimAltM?`, `killerAltM?` and `rangeM?` (killer aircraft to victim at that moment).
  A kill with no `victim` refers to an object that has no track (for example a destroyed missile or a scenery object).
- `launch`: `unit` (the missile or bomb), `parent?`.
- `countermeasure`: `unit`, `parent?`.
- `message`: `text`, `units[]` — chat, joins, damage reports, radar designation notes.

## states.json
Array sorted by `t` of `{ t, unit, set: { key: value } }`. Each entry changes
some values for one aircraft; a value stays in force until changed again.
All values are strings; an empty string clears the value.

| Key | Meaning |
|---|---|
| `radarOn` | `1` / `0` |
| `radarState` | `off`, `scan`, `track`, `unknown` |
| `radarSensor` | Radar model, e.g. `AN/APG-63` |
| `radarPattern` | Game's scan pattern id, e.g. `twsMedium`, `radarSearchManual`, `hmdTrack`, `track` |
| `radarLabel` | Short display label, e.g. `TWS MED` |
| `radarTransceiver`, `radarSignal`, `radarSlot`, `radarStateSource` | Supporting detail |
| `antennaAzimuth`, `antennaElevation` | Antenna pointing relative to the aircraft, degrees (right and up positive) |
| `designating` | `1` while at least one target is designated |
| `target1` … `target8` | Unit ids of designated targets. A designation is not proof of a hard lock |
| `targetRange`, `targetAzimuth`, `targetElevation` | Geometry to `target1` |

## launches.json
Array sorted by `t`, one entry per missile. Added by decoder 0.3.0; older files do not have it, and readers must treat it as optional.
```
t, missile (unit id), model, guidance?
shooter? (unit id), shooterPlayer? (slot)
shooterSpeedMs, shooterAltM, shooterHeadingDeg, shooterPitchDeg
target? (unit id), targetPlayer? (slot)
targetSource    how the target was identified: kill | seeker | designation
rangeM, targetSpeedMs, targetAltM
aspectDeg        0 = target flying straight at the shooter, 180 = flying away
offBoresightDeg  angle between the shooter's nose and the target
closureMs        closing speed at launch
outcome          kill | close | miss | unknown
reason?          target_down | decoyed | out_of_energy | no_lock | lost_lock | no_target_identified
confidence       high | medium | low
missDistanceM?, tClosest?   closest recorded approach to the target
flightTimeS, endSpeedMs, seekerTrackSamples
shooterMach?, targetMach?                    (0.5.0)
shooterInsideMap?, targetInsideMap?          (0.5.0; needs the terrain file)
```
**Only `kill` is recorded by the game.** Everything else is inferred:
- **Target**: the kill's victim; otherwise the aircraft the seeker's target estimate sat on (within 250 m for at least 5 samples); otherwise the shooter's designated radar target at launch.
- `close`: passed within 25 m of the target but no kill was recorded for this missile.
- `target_down`: the target was destroyed by something else before the missile arrived.
- `decoyed`: while tracking, the seeker's target estimate left the target and sat within 200 m of a flare or chaff released by that target.
- `out_of_energy`: at closest approach the missile was slower than 1.15 × the target, or it ended below 250 m/s, and never came within 150 m.
- `no_lock` / `lost_lock`: the seeker never tracked the target / tracked it and then mostly tracked something else.
Thresholds live in `decoder/cmd/wtdecode/wtr_extra.go` and have not been checked against in-game outcomes.

## map.json (0.5.0)
```
mapExtent?  { x0, z0, x1, z1, source }   the level's map square (same as the terrain file)
airfields[] { name, team, x, y, z, headingDeg, lengthM, widthM, ends[[x,z],[x,z]], confidence, missionFile }
areas[]     { name, type: Sphere|Box|Cylinder, x, y, z, sizeX, sizeY, sizeZ, rotationDeg?, role, missionFile }
note?
```
- **Airfields** come from the decoder's built-in mission catalogue, and the variant used in the match is confirmed by the airfield radar units present in the replay. `lengthM` 0 means only the position is known.
- **Areas** come from `assets\catalog\mission_areas.json` (built from the local game install): the areas of the match's own mission file and of the airfield template files in use. `sizeX` of a Sphere is its diameter. `role`: `missionBorder`, `airfieldArea`, `reloadArea`, `airSpawn`, `zone`.
- **What the game treats as "the battle area" is not established.** On the reference matches neither `mission_border` (about half of all flying is outside it) nor the airfield-area circles (about 10 % outside) behaves like a boundary. Inside/outside values therefore use `mapExtent`, the full map square.

## stats.json (0.5.0)
Array, one per player: `slot, flights, flightTimeS, distanceKm, maxAltM, meanAltM, maxSpeedMs, maxMach, maxG, missilesFired, missileKills, missilesFiredAtPlayer, countermeasuresReleased, timeOutsideMapS?`.

## Self-check added in 0.3.0
`underground` — no aircraft sample more than 50 m below the terrain. Skipped when the map has no terrain file.

## Not in schema 1 (planned)
- Terrain and map image (will be separate asset files, shared between sessions of the same map).
- Ground-battle specifics.

## Files next to a `.wtr` (written by the viewer, not part of the format)
`<id>.analysis.json`, `<id>.library.json` (analysis caches) and
`<id>.ownship.json` (own-ship telemetry matched from `sessions\live\*.wtlive.json`,
see `docs/live-telemetry.md`). All are rebuilt automatically when stale and can be
deleted at any time. The viewer never changes the `.wtr` itself.
