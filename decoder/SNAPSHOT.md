# Where this code came from

This folder is a **one-time copy** of the community project `wrpl-acmi`
(https://github.com/3794432/wrpl-acmi, branch `dev`,
commit `9ed43b9f108b062b408b1d4d0c2a62d46b00bfe4`, 2 Nov 2026), itself a fork of
`maxsupermanhd/wrpl-inspector`. Licence: AGPL-3.0 (`LICENSE`).

It is **not** kept in sync with upstream. From this point it is ours to maintain.
The Go module path is unchanged (`github.com/maxsupermanhd/wrpl-inspector/v3`);
it is only a name and nothing is fetched from it. Dependencies are in `vendor/`.

## Removed from the copy
- `inspector/`, `cmd/inspector` (GUI), `cmd/terrain-*`, `internal/terrainbundle`,
  `internal/terrainruntime` (Tacview terrain installer), fonts, images.
- `cmd/acmi` was renamed `cmd/wtdecode`. Upstream docs are kept in `upstream-docs/` for reference.

## Our changes (search for `OURS` in the code)
| File | Change |
|---|---|
| `cmd/wtdecode/wtr.go` | New. Writes the `.wtr` session file and runs the self-checks. |
| `cmd/wtdecode/wtr_input.go` | New. Accepts the downloaded replay `.zip` directly. |
| `cmd/wtdecode/main.go` | `-wtr`, `-strict`, `-check-report` flags; calls `writeWTR`; zip input. |
| `wrpl/packet/parser/ecs2/ecs2.go` | A game-object record that cannot be read is skipped and counted instead of discarding the whole packet. Without this, the Northern India reference match lost every player-to-aircraft link. |
| `wrpl/packet/parser/groundmeta/groundmeta.go` | Reports skipped records as an error after applying the readable ones. |
| `wrpl/blk_dict.go` | New. Reads dictionary-compressed game data blocks (BLK type 5), which most game data uses. |
| `cmd/wtassets/` | New. `wtassets unpack` extracts the game's data archives from a local install. |
| `go.mod` | Go 1.24; `golang.org/x/sys` taken from its GitHub mirror; vendored. |

## Embedded data tables that will age
`cmd/wtdecode/data/*.json` (missile, bomb and radar catalogues) and
`data/ecshashes.json` were generated from game files of late 2026. New aircraft,
missiles or radars added by later game updates will show as unidentified until
these tables are regenerated from the local game install (planned: asset pipeline).

- `cmd/wtdecode/wtr_extra.go` (ours, v0.3.0): terrain lookup, ending aircraft tracks at ground impact, the `underground` self-check, name clean-up, and `launches.json` (launch conditions and inferred missile outcomes).
- v0.5.0 (ours): `cmd/wtassets/catalog.go` (catalogue from the unpacked game data); in `wtr_extra.go` the catalogue reader, `map.json` (airfields from the snapshot's airfield code, areas from the catalogue), derived track columns, `stats.json`.
- v0.7.0 (ours): `oodle/` — Oodle Leviathan decompressor, a Go translation of part of `ooz` by Powzix (https://github.com/powzix/ooz, **GPL-3.0**; compatible with this folder's AGPL-3.0). `cmd/wtassets/terrain.go` — `wtassets terrain`, builds `.wtt` terrain for every map (level-file layouts from DagorEngine, BSD-3-Clause).
