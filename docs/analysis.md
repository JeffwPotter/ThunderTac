# Match analysis — how the debrief and library work out their numbers

The viewer program (`wtviewer.exe`) analyses each match the first time it is
opened in the Debrief or Library page and saves the result next to the match
(`sessions\<id>.analysis.json`, `sessions\<id>.library.json`). Delete those
files to force a fresh analysis; they are rebuilt automatically when the match
file or the analysis rules change. Code: `viewer/server/analysis.go`,
`envelope.go`, `library.go` (ours, standard library only, no decoder code).

**Only kills are recorded by the game.** Everything else below is worked out
from positions, radar states and missile seeker states, and is an estimate.

## Missile fly-out ("launch envelope")
Point-mass model per missile, using the missile's own figures from the game
files (`assets\catalog\weapons.json`, from `wtassets catalog`): thrust and burn
time, mass before and after burn, calibre, drag factor `CxK`, top Mach,
guidance time. Drag = ½ρv²·A·CxK·r(M), standard atmosphere. r(M) is one shape
fitted to missile speeds recorded in the four reference replays.

Check against the recordings: for radar missiles, distance flown after
10–40 s is within about 3 % of the recorded flights (median).

- **Max range**: the target keeps flying as it is at launch.
- **No-escape range (NEZ)**: the target turns away at launch and runs at its speed.
- A hit needs the missile to reach the target before its guidance time runs
  out and while it is faster than 280 m/s and 1.1 × the target.
- Lofting missiles: drag is taken at a higher altitude for long shots (rough).

Check against outcomes (581 shots, four matches): 92 % of kills were inside
the estimated max range. Kill rate inside NEZ 39 %, between NEZ and 85 % of
max range 14 %, beyond that 9 %.

The same model runs in the browser (`viewer/web/src/envelope.ts`) for the
launch-zone rings and the Pk calculator. Keep the two identical.

## Shot grade (each missile fired)
Each factor is good / fair / poor; the shot gets its worst factor.

| Factor | Good | Fair | Poor |
|---|---|---|---|
| Range | inside NEZ | outside NEZ, inside 85 % of max range | beyond 85 % of max range |
| Multipath (radar missiles) | target above the missile's multipath height | target low at launch (some effect), or dropped low before arrival | target low enough for ≥ 50 % effect at launch |
| Notch at launch (radar missiles) | — | — | target beaming the shooter: speed toward/away within the radar's notch, radar looking down |
| Lock | lock held while needed | ARH fired without lock, or lock held < 80 % until the missile went active | SARH fired without lock, or SARH lock held < 80 % of the flight |
| Off-boresight (IR) | — | more than 45° off the nose | — |

- **Multipath**: radar missile seekers carry a `multipathEffect` table in the
  game files, e.g. `[0, 1, 60, 0]` for the AIM-120, PL-12 and R-77. Read as:
  full effect at 0 m above ground, none at 60 m. *The axis is our reading of
  the data (height above ground in metres).* Needs the map's terrain file.
- **Notch**: radars in the game files have `mainBeamNotchWidth` (40 m/s for
  most) and `mainBeamNotchMaxElevation` (3–4°). Read as: a target whose speed
  toward or away from the radar is within ±20 m/s is filtered out, but only
  while the radar looks down at it (target less than about 3.5° above the
  radar's horizon). *Half-width = width/2 is our reading.* The meter also shows
  a looser ±40 m/s band.

**After launch** (shown, not graded): lock held, the most you turned away from
the target (crank), your distance to the target when the missile went active
(first seeker "track" sample) and when it arrived, when you turned cold,
missile speed at the end.

## Pk from history
Among all recorded shots in the selected matches (every player), the 8–30
most similar shots with the same missile (or family, or guidance type when
there are too few) are taken; Pk = share that killed, with a 90 % (Wilson)
range. Similarity: range, aspect, both altitudes, both Mach numbers, and
whether the target was below 60 m. Shots whose target was destroyed by
something else, or whose target is unknown, are left out. Rough until there
are a few dozen matches.

## Missiles fired at you
- **Reaction**: first of a turn of more than 30°, a dive of more than 600 m, or
  a countermeasure, within 30 s of the launch. Poor if later than
  max(8 s, half the missile's flight time); fair if later than max(4 s, a quarter).
- **Notch meter**: your speed toward (−) or away from (+) the threat. The
  threat is the shooter's radar, and the missile itself once an active
  missile's seeker is tracking. Notch held = share of time inside ±20 m/s with
  the threat looking down, from 8 s before the seeker went active.
- **Seeker lost you**: the missile's seeker dropped from track.

## Deaths
Tags: no or late reaction, not notching, radar locked on someone else when
the killing missile was fired (target fixation), alone (no teammate within
15 km), outnumbered (3+ enemies within 20 km), slow (below Mach 0.7), lost a
lot of speed in the last 30 s, two or more missiles at you in the last minute,
crash, team kill.

## Engagements
One per enemy and stretch of time: shots between you and that enemy, kills
and deaths, with radar locks either way keeping it going; a gap of 60 s ends
it. Energy at the first shot = altitude + v²/2g.

## Threats and position
Every 2 s: enemies within 40 km, enemy radars designating you, missiles in the
air at you, enemies within 60 km with terrain line of sight (30 m margin,
needs terrain), altitude, nearest teammate and enemy. Altitude bands:
0–1, 1–3, 3–6, 6–9, 9+ km.

## Report card
Mistakes ranked by severity: deaths (4), team kills and badly out-of-envelope
or multipath shots (3), other poor shots and weak defences (2), shots at a
target already down, flying alone more than half the match (1).

## Known limits
- The replay has no cockpit data: "did you see it" is inferred from reactions.
- Targets of missiles without a kill come from the seeker or the radar
  designation and can be wrong (including friendly aircraft).
- Positions are about 4 per second; very short manoeuvres are blurred.
- Radar scan-centre offsets set by the pilot are not in the replay.
