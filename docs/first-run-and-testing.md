# First-run guide and testing plan (v0.9.1)

Nothing in this program has run on a real Windows PC with the real game yet.
Expect a few things to break. That is the point of tonight: **a failure with a
clear description is a good result.** Write down what you clicked and what you
saw, take a screenshot, and note the time.

## Part 1. First-time setup (about 10 minutes plus the game-data step)

1. **Extract** `wt-replay-viewer-v0.9.1-update.zip` over your existing install
   folder (`C:\Users\Jeff\War Thunder Replay Tacview\wt-replay-viewer`), allow
   overwrite. Your matches in `sessions\` are not touched.
2. **Refresh game data** (once per game update): run `tools\update-game-data.bat`.
   It asks for the War Thunder folder if it cannot find it. It takes a few
   minutes and uses about 800 MB temporarily. Wait for it to say it is done.
3. **Start the viewer**: double-click `Open Viewer.bat`. A window opens (not a
   browser tab). If SmartScreen warns, choose More info, then Run anyway.
4. **Set your names** in the top bar: **Me** = `spurzz`, **Wingman** = your
   friend's in-game name.
5. **Turn on the recorder**: Display tab, Game telemetry, tick **Record my
   flight data while I play**. Leave the viewer open while you play.
6. **Play a match** (Air RB, any jet with a radar or IR missiles is ideal).
   The top bar should show **Waiting for the game** in the hangar and
   **REC and your aircraft name** while you are flying. Fly at least a minute or two,
   use the radar and fire a missile if you can.
7. After the match, get its replay: **+ Add match**, paste the session ID or
   replay link from warthunder.com, click **Download and convert**. (The
   replay page appears on warthunder.com a few minutes after the match.)

If anything fails, the log is at `%LocalAppData%\WTReplayViewer\viewer.log`
(paste that into File Explorer's address bar). `bin\wtviewer-console.exe` shows
messages live in a text window.

## Part 2. Testing plan, in this order

Mark each line Pass / Fail / Odd. Stop and report at the first hard failure.

### A. Does it start? (2 min)
- [ ] `Open Viewer.bat` opens a window with the viewer (no blank white screen).
- [ ] Your existing matches are in the match list (top-left dropdown).
- [ ] Closing the window ends the program (check Task Manager: no `wtviewer.exe` left).

### B. Existing matches and the 3D controls (10 min)
Open one of your older matches first. This tests everything except the new
download and recorder.
- [ ] Press play. Aircraft and missiles move. Speed controls and the time slider work.
- [ ] **Left-drag** rotates around the middle of the screen. Does the speed feel right?
- [ ] **Wheel** zooms toward the mouse pointer, all the way down to near the ground.
- [ ] **Right-drag** (or Ctrl + left-drag) moves the view sideways.
- [ ] **Double-click an aircraft** follows it. **Right-drag** then stops following.
- [ ] **Double-click the ground** recentres there.
- [ ] You cannot get the camera under the terrain on hills.
- [ ] **Top** and **Home** buttons, and the 2D map mode, behave sensibly.
- [ ] Names of aircraft, players and missiles look right (not codes), and the
      terrain looks like the real map.
- Report: rotate and zoom "too fast", "too slow" or "fine".

### C. Debrief and Library (10 min)
- [ ] **Debrief** opens and lists your shots and the shots at you.
- [ ] Click a shot. The detail says what happened (hit, miss, defeated by notch,
      chaff, flare and so on). Does it match what you remember? Note any you
      disagree with and which match and time.
- [ ] For a radar missile (Fox-1 / Fox-3), look at lock and multipath wording.
- [ ] A shot marked "target guessed" really was aimed at that target?
- [ ] **Library** opens. The Pk estimate shows a number and a pool size. The
      **Shots from** selector (all / yours / squad) changes the pool.

### D. "+ Add match" with the real server (5 min)
- [ ] Paste a session ID of a recent match. It downloads, converts and opens.
- [ ] Try a bad ID. You get a readable error, not a crash.
- [ ] The new match appears in the list after a restart as well.

### E. Own-ship telemetry (the big unknown, 15 min plus a match)
The game's field names have never been checked against a live game, so this is
the most likely thing to need a fix.
- [ ] While in a match, open `http://127.0.0.1:8111` in Edge. Do you see the
      game's own page? (If not, the game's web server is off or blocked.)
- [ ] Top bar shows **REC and your aircraft**.
- [ ] After the match a file exists in `sessions\live\` named
      `<number>_<aircraft>.wtlive.json`, and it grows or is saved every 30 s.
- [ ] Add the match. Select your aircraft, **Selected** tab: you see rows
      "From your game" (IAS, AoA, G, throttle, fuel) and three charts.
- [ ] The numbers are believable (IAS near your gauge, G near what you pulled).
- [ ] The fit line shows a good fit (clock offset a few seconds or less).
- If it does not match, **send me the `.wtlive.json` file**. Its `keys` list
  shows the real field names and I will adjust the code.

### F. Rough edges to watch for
- Window does not remember its size, or opens off screen.
- Text too small on a high-DPI screen.
- A match takes more than a minute to convert or open.
- Anything that says "undefined", "NaN" or shows an empty chart.

## Part 3. What to send back
For each problem: which test (for example "E, no REC badge"), what you did, what
happened, a screenshot, and `viewer.log`. For recorder problems also the newest
file in `sessions\live\`. For disagreements with the Debrief: the match ID, the
time on the slider and what you think really happened.

## Known not-done (do not report as bugs)
- Telemetry does not feed the Debrief yet; it shows in the Selected tab only.
- Your wingman needs his own copy of the viewer to record his flights.
- The installer and release download have never been run.
- Ground battles are not supported.
- Pk gets better with more matches; a small pool gives a rough number.
