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
guidance time. Drag = k·½ρv²·A·CxK·r(M), standard atmosphere. r(M) is one
shape and k = 1.4 one scale, fitted to missile flights recorded in the four
reference replays (k stands in for the drag of manoeuvring, which is not
simulated).

Two-stage (boost + sustain) motors: when the catalogue has a second stage
(`burn1S`, `thrust1N`, `massEnd1Kg`, read from `timeFire1` / `force1` /
`massEnd1` in the game file) the model burns stage 1 after stage 0, with the
mass falling from the stage-0 burnt-out mass to the stage-1 one. `timeFire1`
is read as the sustainer's burn duration (AIM-7M: 4.5 s boost, then 11 s
sustain). 192 of 442 missiles have one, among them AIM-7F/M/P, AIM-120A/B,
R-27ER, PL-12, Derby, AAM-4, Fakour-90. Before v0.8.2 the sustainer was
ignored, which made two-stage missiles fly about 18 % short (AIM-120 27 %)
while the drag shape compensated by making one-stage missiles fly 8 % long.

Check against the recordings (v0.8.2, 438 radar missiles, 1,417 samples):
distance flown after 10–40 s, median model/recorded 1.005 for one-stage and
1.001 for two-stage motors. `viewer/server/envelope_check_test.go` repeats
this (and the outcome check below) on any folder of matches:
`WTRV_SESSIONS=<folder> go test -run Check -v .` in `viewer/server`.

- **Max range**: the target keeps flying as it is at launch.
- **No-escape range (NEZ)**: the target turns away at launch and runs at its speed.
- A hit needs the missile to reach the target before its guidance time runs
  out and while it is faster than 280 m/s and 1.1 × the target.
- Lofting missiles: drag is taken at a higher altitude for long shots (rough).

Check against outcomes (441 graded shots, four matches, v0.8.2): 94 % of
kills were inside the estimated max range (92 % before v0.8.2). Kill rate
inside NEZ 41 % (was 39 %), between NEZ and 85 % of max range 16 % (14 %),
beyond that 10 % (9 %).

The same model runs in the browser (`viewer/web/src/envelope.ts`) for the
launch-zone rings and the Pk calculator. Keep the two identical:
`viewer/server/envelope_parity_test.go` runs both on the same cases and fails
if they differ (`go test` in `viewer/server`; needs Node.js 22.18+, skipped
without it).

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
(radar missiles) the multipath effect at the target's height, as a strength
from 0 to 1 taken from each missile's own table, so a shot at 48 m and one at
52 m count as alike.

**Whose shots:** everyone's by default. The Library Pk calculator has "Only
my shots" and "Me + wingman" (the player names in the top bar: Me, Wingman;
several wingmen separated by commas). The Debrief shot details show the same
shot against your own shots, and against yours and your wingman's, next to
everyone's, once there are 8 or more similar shots. Shots whose target was destroyed by
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
20 km), outnumbered (3+ enemies within 20 km), slow (below Mach 0.7), lost a
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
