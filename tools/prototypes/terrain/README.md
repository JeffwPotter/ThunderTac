# Terrain prototypes (Python)

Working prototypes used on 2026-11-11 to prove terrain extraction; see `docs/terrain-notes.md`.
They ran in Claude's Linux workspace and contain its paths (`/home/claude/...`, an `ooz` binary for
Kraken decompression). They are kept as a reference for the Go implementation, not as tools to run on Windows.

- `lts4.py` — reads the LTS4 collision mesh from a level `.bin`, returns terrain vertices.
- `hm2.py` — decodes an HM2 heightmap (single- and multi-chunk).
- `terrain_check.py` — builds 1024×1024 grids and checks them against aircraft tracks in `.wtr` files.
- `plot_terrain.py` — relief picture with tracks. `wtr_read.py` — minimal `.wtr` reader.
