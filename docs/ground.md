# Ground battles (v0.10.0)

Ground Realistic Battles are decoded and shown alongside the air ones. Checked on
three Ground RB matches (Sinai, Eastern Europe, Soviet suburbs, replay version
101404); they are reference matches in `golden/`.

## What the replay records for a ground vehicle (about 24 times a second)
| Data | Where (`decoder/wrpl/packet/parser/movement/ground.go`) | How it was checked |
|---|---|---|
| Position | vehicle body record | sits on the 2 m terrain (median 0.005 m) |
| Hull heading | first 16-bit angle: `raw × 360/65536 + 90°` | matches direction of travel on 99% of moving samples |
| Hull pitch, roll | second and third 16-bit angles (roll sign flipped) | follow the terrain slope under the tank (correlation 0.85 / 0.87) |
| Gun bearing and elevation | 4-float block after the body: bearing = `90° − q0`, elevation = `q1` | at 146 of 147 kill shots the gun points within 3° of the victim |
| Every firing, per weapon | per-weapon block: time fired, time ready again, rounds left per ammo type | main-gun reloads 5.3–7.5 s, machine guns ~0.05 s; weapon index = entry in the vehicle's `commonWeapons` list |

Not recorded: shell flight, where a shell hit, penetration. Kills name the
killer, the victim and the shell (`120mm_m829a3`).

## Kills and deaths
Kill reports carry the victim's and killer's ground ID. The decoder used to look
them up only through the game-object manager, which keeps just the newest copy of
an object, so ground victims were lost. It now falls back to the ground ID
(`kill_attribution.go`). Decoded player deaths equal the results table exactly in
all three matches (63/63, 77/77, 51/51). The same fix names ground targets of
bombs and air-to-ground missiles in air battles, and the SAM sites that shoot
aircraft down.

## Weapons and shells (`assets/catalog/ground.json`)
`wtassets catalog` reads every vehicle's weapon list from the game install, in
the order the replay numbers it, with each shell's speed, mass, drag coefficient,
calibre and **ballistic calibre** (the dart's 25 mm, not the 120 mm bore, for
APFSDS; also APCR). Classes:
- **mg**: 14.7 mm and smaller (machine guns);
- **cannon**: larger (main guns, autocannon, grenade launchers). A gun that can
  also fire a gun-launched missile stays a cannon;
- **atgm**: launchers whose rounds are all missiles; **smoke**: smoke dischargers.

**Which shell was fired.** The record says which ammo slot's count dropped. Slots
follow the player's own loadout order, so the slot is mapped to a shell from that
player's kills (the kill names the shell), and the mapping holds for the same
player's later spawns in the same vehicle (no conflicts in 3 matches). Without a
kill, slot 0 is guessed as the fastest dart/AP round (right for about half,
within 100 m/s muzzle velocity for about 80%), labelled "guessed".

## Shell arcs (`decoder/cmd/wtdecode/wtr_ground.go`)
From the gun (2 m above the vehicle's position) along the recorded bearing and
elevation, at the shell's muzzle velocity; gravity and drag
(`0.5 ρ Cx A v² / m`, A from the ballistic calibre, ISA air density), 5 ms steps,
a point every 40 ms. The arc ends on the 2 m terrain, within 3.5 m of a vehicle
(10 m of an aircraft), or at the shell's maximum range or 8 s (3 s for machine guns).

Recorded gun elevation agrees with the line to the target to about ±0.3° (where
on the target the shell struck, gun height). At 1 km that is ±5 m, so for shots
that are known to have killed, the elevation is adjusted (at most 1.5°, stored as
`elevAdjDeg`) to put the arc on the victim: 106 of 135 kill-shot arcs then pass
within 5 m. The rest come from a few vehicles whose recorded elevation is off by
several degrees (HSTV-L, T-80UK); those are drawn as recorded. Other shots are
always drawn exactly as recorded. Buildings and trees are not in the terrain, so
an arc can pass through a house.

## Terrain (`docs/terrain-notes.md`)
Tank maps carry a 2 m heightmap of the 4 km battle area. `wtassets terrain` now
keeps it (terrain schema 2, `detail.u16`). The viewer draws it as its own mesh
with a 250 m grid; the whole map uses the battle area's height scale for colour.

## Viewer
- Tanks: hull (heading, pitch, roll) and a turret that turns to the recorded gun
  bearing; label with player and vehicle; ground track. Dead vehicles: a cross
  (with "Destroyed aircraft and vehicles" on).
- Shells: cannon arcs in the team colour (kill shots brighter, red flash on the
  hit), machine-gun rounds thinner and amber; a dot on each round in flight.
  Display tab, **Ground battles**: cannon arcs, machine-gun rounds, how long
  landed shells stay, gun lines.
- Selected tab for a vehicle: speed, hull heading and tilt, gun bearing
  (relative to the hull) and elevation, per weapon: shots, last shell, reload
  countdown or rate of fire, rounds left of that shell; last cannon shot result.
- Events tab: kills include ground vehicles, with the range.
- Ground maps open on the battle area from about 3 km; the camera can go down to
  a few metres above the ground.

## Not done yet
- A ground debrief (deaths: who, from where, angle, could you see them; hit rate;
  positions vs capture zones; heatmaps).
- Capture zones on the map; damage reports per hit.
- Anti-aircraft gun firings in air battles are not exported (air output unchanged).
