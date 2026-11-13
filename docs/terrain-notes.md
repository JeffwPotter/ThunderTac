# Terrain from the game files — findings and format notes

_2026-11-11, updated 2026-11-12 (v0.7.0: `wtassets terrain` builds terrain for every map).
Tested on the four reference maps with the game install at
`G:\SteamLibrary\steamapps\common\War Thunder` (files dated 11 Nov 2026)._

## Building terrain for every map (v0.7.0)
`tools\update-terrain.bat` (also part of `tools\update-game-data.bat`) runs

    bin\wtassets.exe terrain -game "<War Thunder folder>" -out assets\terrain

It reads every `levels\*.bin`, writes one `.wtt` per map and prints one line per
level (`skipped: …` for level files without terrain, e.g. hangars). No other
program is needed: the Oodle decompressor is our own Go code (`decoder/oodle`).
Map corners and water level come from `levels/<level>.blk` inside `aces.vromfs.bin`.

Per level: the HM2 heightmap if one covers at least 90% of the map; otherwise the
LTS4 collision mesh, whose **triangles** are rasterised at every 128 m cell
centre (highest surface where triangles overlap). Cells no triangle covers take
the value of the nearest covered cell and are then smoothed (counted in
`emptyCellsFilled`). On island maps the mesh often covers only the middle of the
map (Honolulu 25%, Midway 2%); continuing its edge keeps the open sea at seabed
depth. (An earlier version averaged towards the interior and raised the open sea
above the water line - phantom land.)

Every level is built at least twice and written only when two builds are
identical (up to six tries). Reason: the development PC (Intel i9-13900K) makes
occasional calculation errors - single-threaded `xz` gave a different result on
2 of 14 runs of the same file - which showed up as random Oodle decode failures.
Two identical builds rule out a silently wrong file.

Checked on the four reference maps: Grand Canyon identical to the earlier file;
the three mesh maps within 3–5 m RMS of the earlier interpolated grids (the
differences are where interpolation guessed a different triangle layout than the
real mesh). Aircraft-track checks unchanged (parked aircraft 2.6–14.6 m above
ground; the few samples more than 20 m below are crash impacts). Whole run for
four levels: about 1.5 s.

**Full install, 2026-11-12:** 162 level files, **161 written**, 1 skipped
(`avn_mediterranean_port`, a naval map with neither HM2 nor LTS4). 12 maps use
HM2 (most `air_*` maps; `air_archipelago` at 64 m cells), the rest LTS4. About
3 minutes with two builds per level on the PC's Linux side; Grand Canyon and
Pyrenees needed a third build. Hangar and test-range levels are built too (harmless).

## Result
Terrain heights can be read from the local game install for all four reference
maps. Checked against the decoded aircraft tracks:

| Map (level file) | Where the heights come from | Parked aircraft sit above terrain by (median) | Player-aircraft samples more than 20 m underground |
|---|---|---|---|
| Spain (`spain.bin`) | LTS4 collision mesh, 411,347 points | 14.6 m | 0 |
| Northern India (`avg_northern_india.bin`) | LTS4 collision mesh, 525,878 points | 4.6 m | 0 |
| Mysterious Valley (`air_mysterious_valley.bin`) | LTS4 collision mesh, 670,396 points | 2.6 m | 0 |
| Grand Canyon (`air_grand_canyon.bin`) | HM2 heightmap, 4096 × 4096 at 32 m | 5.5 m | 0 |

The only samples found underground belong to AI aircraft in the last ~18 s of
their track: wrecks that keep falling after being shot down. That is a decoder
to-do (AI aircraft tracks are not ended at destruction), not a terrain error.
Airfields on air maps are separate objects placed by the mission, which is why
parked aircraft sit a few metres (Spain: ~15 m) above the bare terrain.

There is **no ready-made map picture** for air maps in the game files; the game
draws its air map from the terrain. Our relief rendering is therefore the map.

## What had to be worked out
The community notes describe an older layout ("LTdump"). Current level files
use a newer one, **LTS4**, which is not in those notes. Its layout was taken from
the engine source Gaijin publishes (DagorEngine, BSD-3-Clause):
`prog/gameLibs/landMesh/landRayTracerSoA4.cpp`, `prog/engine/daBVH/bvhIO.cpp`,
`prog/engine/heightMapLand/compressedHeightmap.cpp`.

## Where things are

### Map extent and water level
`aces.vromfs.bin` → `levels/<level>.blk`:
`mapCoord0` / `mapCoord1` = map corners in metres (`[-65536,-65536]`..`[65536,65536]`
for all four maps), `water_level`. The replay header names the level
(`levels/spain.bin`) and the mission (`gamedata/missions/...blk`, in `mis.vromfs.bin`).

Game data blocks (`.blk`) inside the `.vromfs.bin` archives are mostly type 5
(zstd with the archive's shared dictionary, the `*.dict` entry, plus the
archive's name map). `wtassets unpack` decodes them: 31,545 blocks, 0 failures.

### Level file
`levels/<level>.bin` starts with `DBLD3x64`. Two possible terrain sources:

**A. HM2 heightmap** — tag `HM2\0`; header starts 3 bytes after the tag start:
```
f32 cell, f32 hMin, f32 hScale, f32 ofsX, f32 ofsZ
i32 width  | version << 24
i32 height | mirror << 31
i32[4] exclude box
i32 chunkSz              (version 2 only)
```
`blockShift = chunkSz & 0xFF` (3 → 8×8 blocks), `hrbSub = 1 << ((chunkSz >> 8) & 0xF)`,
`chunkBytes = chunkSz & ~0xFFF`.
Then Dagor blocks, each `u32 (codec << 30 | length)` + payload; codec 2 = Oodle (raw stream, no size prefix), 1 = zstd.
The Oodle streams in level files are **Leviathan** (header `8c 0c`, decoder type 12), not Kraken.
- `chunkBytes == 0`: one block holding block-info + variance + range data.
- `chunkBytes != 0`: block 0 = block-info (`bw*bh*4` bytes) + range data
  (`sHierGridOffsets[log2(width/hrbSub)] * 16` bytes); then one block per
  `chunkBytes >> (2*blockShift)` blocks of variance.
- Per 8×8 block: `u16 min, u16 delta`; variance bytes are delta-coded within the block (running u8 sum).
  `raw = delta == 0 ? min : min + (v*delta + 127) / 255`; `height = hMin + raw * hScale / 65535`.
- Rows are z (south → north), columns x (west → east), origin at (`ofsX`, `ofsZ`). Verified by trying all four orientations.
- A level can hold a small HM2 (the 4 km tank area, 2 m cells: Northern India) or a whole-map one (Grand Canyon). Use the one whose `cell × width` covers the map.

**B. LTS4 collision mesh** — tag `LTS4`, then one Dagor block (`u32 codec<<30|length`; for Oodle a `u32` decompressed size first). Decompressed:
```
"LTS4", i32 version(1), i32 cellsX, i32 cellsY, f32 cellSize, f32[3] origin, f32[6] bbox
per cell (cellsX*cellsY):
  i32 hasGeometry
  if 1: f32[4] scale, f32[4] offset,  then a "dBLi" blob:
        i32 magic, u16 version, u8 vertStride(8), u8 leafSize(28), u32 treeBytes, u32 vertCount, f32[3] bmin, f32[3] bmax
        u32 ioFlags                      (blob version ≥ 2)
        vertCount × u64 vertices          x = bits 0–20, y = 21–41, z = 42–62
        tree stream: read one byte cc; 0 or 0xFF → leaf, skip 16 bytes; 0xFE/0xFD → leaf, skip 8;
                     otherwise internal node with cc children. Each leaf counts 28 and each internal
                     node 16 toward treeBytes; stop when the count reaches treeBytes.
        leafCount × u16 edge flags       (if ioFlags & 1)
```
World position of a vertex: `(raw / 32 − offset) / scale` per axis (vertex size 12 = plain float3, same transform).
Spain: 16×16 cells of 8192 m; the others 32×32 cells of 4096 m.

Triangles are in the tree leaves (DagorEngine `bvhIO.cpp`, `swBLASLeafDefs.hlsli`,
`dag_swBLAS_leaf.h` `expandQuadLeafTris`; BSD-3-Clause). A leaf body is W0..W3
(short leaves 0xFE/0xFD store W0, W1; W2 = flip flag for 0xFD else 0, W3 = 0;
0xFF leaves are empty):
```
W0: o1A = bits 0-12, o2A = bits 13-25 (signed 13-bit), o3A low 5 = bits 26-30, bit 31 leaf flag
W1: apex vertex index = bits 0-23, o3A high 8 = bits 24-31
W2: deltaB = bits 0-15, o1B = bits 16-28, flipA = bit 29, flipB = bit 30
W3: o2B = bits 0-12, o3B = bits 13-25
tri (a, a+o1A, a+o2A); if o3A != o2A: (a+o1A, a+o2A, a+o3A), first two swapped if flipA
if o1B != o2B: same for quad B with apex a+deltaB
```
Indices are within the cell's own vertex list.

## Oodle decompressor (`decoder/oodle`)
A Go translation of the Leviathan path of `ooz` by Powzix (GPL-3.0): the shared
entropy layer (stored, tANS, Huffman, RLE, recursive and multi-array blocks) and
the Leviathan match copier (literal modes 0–5, single and eight-stream commands).
Kraken and Mermaid match copiers are not translated (not used by level files).
Verified byte-for-byte against the reference decoder on 10 blocks from the four
level files (39 MB of output); 3,000 corrupted streams give errors, never a crash.
Reference test: `OODLE_TESTDATA=<folder of .raw/.size/.ref> go test ./oodle`.

**Licence:** because it is translated from GPL-3.0 code, a shared copy of the tool
must be under GPL-3.0 (or AGPL-3.0, like the rest of the decoder). No obligation for private use.

## Still to do
1. `avn_mediterranean_port` (naval) has no terrain; not needed for air.
2. ~~Ground battles: detailed tank-area HM2~~ done in v0.10.0 (schema 2, below).

## Terrain asset file (`.wtt`, schema 1)
A ZIP with `terrain.json` and `height.u16`.
`terrain.json`: `level`, `gridSize` (1024), `x0`,`z0`,`x1`,`z1` (map corners, metres), `cellM` (128),
`hMin`, `hMax`, `waterLevel`, `source`, `gameFilesDate`; from v0.7.0 also `emptyCellsFilled`,
`builtBy`, `builtAt`, and `note` when the map corners were not in the level `.blk`.
Maps are square; if the `.blk` corners are not, the larger side is used from `x0`,`z0`.
`height.u16`: `gridSize²` little-endian uint16, rows south → north, columns west → east;
`height = hMin + v * (hMax − hMin) / 65535`. Cell centres at `x0 + (col + 0.5) * cellM`.

### Schema 2 (v0.10.0): the tank battle area
When the level holds a fine HM2 (cell ≤ 8 m) besides the one used for the whole
map, the `.wtt` also carries `detail.u16` and `terrain.json` gains
`detail { w, h, x0, z0, cellM, hMin, hMax }` (and `schema: 2`). Samples sit at
`x0 + col*cellM`, `z0 + row*cellM` (corners, not cell centres), rows south →
north, at the HM2's own cell size (2 m on all three tank maps checked: 2048 × 2048,
4.1 km), subsampled only above 4096 × 4096. Ground vehicles' positions sit on it
to a median of 0.005 m. Readers that only know schema 1 ignore it. The decoder
uses it for shell arcs (`heightFine`); aircraft rules keep the 128 m grid.
