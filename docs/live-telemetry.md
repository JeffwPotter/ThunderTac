# Own-ship telemetry from the game (localhost:8111)

Server replays record every aircraft's position about 4 times a second, but
nothing from inside the cockpit. While you play, War Thunder also runs a small
web server on your PC (`http://127.0.0.1:8111`, the one used by map and gauge
apps) that reports your own aircraft's figures. The viewer can record those and
attach them to your aircraft in the replay.

## Use
1. In the viewer: Display tab → **Game telemetry** → tick **Record my flight data
   while I play**. The setting is remembered.
2. Keep the viewer open while you play. The top bar shows **● REC <aircraft>**
   while you are flying, **Waiting for the game** otherwise.
3. Each flight (spawn → back in the hangar) is saved in `sessions\live\` as
   `<time>_<aircraft>.wtlive.json` (saved every 30 s while flying, so little is
   lost if the PC crashes). Flights shorter than ~10 s are dropped.
4. After the match, add or convert the replay as usual. When you open it, the
   viewer matches your recorded flights to your aircraft automatically. Select
   your aircraft → **Selected** tab: IAS, AoA, measured G, throttle and fuel at
   the current moment, plus G, AoA and IAS charts for the whole flight, and how
   well the match fitted ("clock offset", "fit", "height error").

## What is recorded (about 10 per second)
From `/state`: IAS, TAS, Mach, altitude, climb rate (Vy), AoA, sideslip, G (Ny),
roll rate, throttle, fuel and full fuel. From `/indicators`: aircraft type,
compass, pitch, roll, stick and pedal positions. Each log also lists every field
name the game reported (`keys`), so names can be checked after the first real
flight. **The field names come from public descriptions of the game's web
server and have not yet been checked against a live game.** A field the game
does not report is recorded as 0.

## How the matching works (`viewer/server/live.go`)
- Candidates: aircraft in the replay of the same internal type (the replay's
  unit `class` is the name the game reports as `type`), preferring the player
  named in **Me**. Each recorded flight goes to at most one aircraft, so several
  lives in one match each get their own flight.
- Start guess from the clocks: recording time vs the match start time in the
  replay. Then a search of ±120 s (0.5 s steps, refined to 25 ms) for the
  shift that best lines up climb rate, speed and altitude (weights 0.45 / 0.35 /
  0.20, correlation). Accepted at a correlation of 0.7 or more over 15 s or more.
- Checked with synthetic recordings made from 12 real aircraft tracks (noise
  added, clocks up to ±30 s apart): right aircraft every time, including three
  F-15Es in one match; time error within ±0.09 s (`TestOwnshipAlignment`).
- The result is saved next to the match as `<id>.ownship.json`. The `.wtr` file
  is never changed: reconverting a replay keeps the recordings, which are
  matched again. The match is redone when the replay, the recordings or the
  **Me** name change.

## Not yet
- Telemetry is shown for your aircraft in the Selected tab; it does not yet feed
  the Debrief (e.g. real G and AoA during defence).
- Your wingman's flights would need his own recorder running and his log files
  copied into your `sessions\live\`; matching then works the same way (the
  aircraft type decides, **Me** only breaks ties).
