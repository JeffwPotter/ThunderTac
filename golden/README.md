# Reference matches ("golden replays")

Each `*.checks.json` is the expected self-check report for one reference match.
`tools\verify-golden.ps1` re-converts the replays and compares counts and check results.

The replay zips are not stored here; they live in the parent folder
(`War Thunder Replay Tacview\<session>.zip`). Grand Canyon's zip lacks piece 0005,
which was supplied separately as `0005.wrpl`; add it to that zip before verifying.

| Session | Map | Replay version | Notes |
|---|---|---|---|
| 2b315cb7002e4238 | Spain | 101404 | all checks pass |
| 2b315cb7002e4666 | Northern India | 101404 | 3 of 3,156 object records skipped (warning) |
| 2b315cb7002e6729 | Mysterious Valley | 101404 | all checks pass |
| 2b315cb7002e6b99 | Grand Canyon | 101404 | all checks pass (needs piece 0005) |
| 2b315cb70027d9f2 | Sinai (Ground RB) | 101404 | missile_kills warns (ground battle), 1 player without vehicle |
| 0be95b080017e6c6 | Eastern Europe (Ground RB) | 101404 | radar warns (4 of 9 aircraft) |
| 0be95b080017f745 | Soviet suburbs, snow (Ground RB) | 101404 | 1 player without vehicle |

2026-11-12 (v0.7.0): reports for Spain, Mysterious Valley and Grand Canyon regenerated. Terrain is now
built from the real collision-mesh triangles, and the ground-impact rule gained a second test (15 m
below the ground, then slowing below 30 m/s). Ground-impact counts are unchanged; three crashed
aircraft tracks end one or two samples earlier, so the underground check counts 3–11 fewer samples.

2026-11-12 (v0.10.0): three Ground RB reference matches added (zips may be named
without the leading 0 of the session ID; `verify-golden.ps1` finds both). They
need `assets\catalog\ground.json` and terrain schema 2 for their maps (run
`tools\update-game-data.bat`). Spain's `missile_kills` is now 24 of 24 (was 23):
kills are now also linked through the ground ID, which identifies a SAM site as
the killer of one more aircraft.
