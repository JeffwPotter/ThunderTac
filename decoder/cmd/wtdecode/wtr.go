// wtr.go — writes our own session file (.wtr) from the decoded replay.
//
// This file is ours (not part of the upstream snapshot). It mirrors the loop of
// writeACMIWithContext but emits structured data in local map coordinates
// instead of Tacview text. Format description: docs/wtr-format.md.
package main

import (
	"archive/zip"
	"bytes"
	"encoding/binary"
	"encoding/json"
	"flag"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/maxsupermanhd/wrpl-inspector/v3/wrpl"
	packetecs2 "github.com/maxsupermanhd/wrpl-inspector/v3/wrpl/packet/parser/ecs2"
	packetkill "github.com/maxsupermanhd/wrpl-inspector/v3/wrpl/packet/parser/kill"
	"github.com/maxsupermanhd/wrpl-inspector/v3/wrpl/packet/parser/projectiles"
	packetslot "github.com/maxsupermanhd/wrpl-inspector/v3/wrpl/packet/parser/slot"
)

const (
	wtrSchemaVersion  = 1
	wtrDecoderVersion = "0.8.0"
	wtrSnapshotOrigin = "wrpl-acmi dev @ 9ed43b9f108b062b408b1d4d0c2a62d46b00bfe4 (2026-11-02), AGPL-3.0"
)

var (
	wtrPath        = flag.String("wtr", "", "write our session file (.wtr) to this path; skips ACMI output unless -out is also given")
	wtrStrict      = flag.Bool("strict", false, "with -wtr: exit with an error when a self-check fails or the replay version is unverified")
	wtrCheckReport = flag.String("check-report", "", "with -wtr: also write the self-check report as JSON to this path")
)

// wtrVerifiedVersions lists replay format versions this decoder has been
// checked against with golden replays. Add a version only after the self-checks
// pass on real matches of that version.
var wtrVerifiedVersions = map[int32]string{
	101404: "verified 2026-11-11 on four Air RB server replays",
}

type wtrColumn struct {
	Name   string `json:"name"`
	Type   string `json:"type"` // u32 | f32 | u8
	Offset int64  `json:"offset"`
	Count  int    `json:"count"`
}

type wtrUnit struct {
	ID         int         `json:"id"`
	Kind       string      `json:"kind"` // aircraft | missile | countermeasure | bomb | ground
	Name       string      `json:"name"`
	Class      string      `json:"class,omitempty"`
	Player     *int        `json:"player,omitempty"` // player slot
	Team       int         `json:"team"`             // 1, 2, or 0 when unknown
	AI         bool        `json:"ai,omitempty"`
	Parent     *int        `json:"parent,omitempty"`
	ReplayUID  uint64      `json:"replayUid"`
	TStart     uint32      `json:"tStart"`
	TEnd       uint32      `json:"tEnd"`
	Destroyed  bool        `json:"destroyed,omitempty"`
	EndReason  string      `json:"endReason,omitempty"` // "ground": track ended where the aircraft hit the terrain
	Estimated  bool        `json:"estimated,omitempty"`
	Static     bool        `json:"static,omitempty"`
	Samples    int         `json:"samples"`
	Columns    []wtrColumn `json:"columns"`
	Missile    *wtrMissile `json:"missile,omitempty"`
	CM         *wtrCM      `json:"countermeasure,omitempty"`
	BombNoPath bool        `json:"bombReleasePointOnly,omitempty"`
}

type wtrMissile struct {
	Model              string         `json:"model,omitempty"`
	Family             string         `json:"family,omitempty"`
	InternalName       string         `json:"internalName,omitempty"`
	ModelConfidence    string         `json:"modelConfidence,omitempty"`
	Guidance           string         `json:"guidance,omitempty"` // ARH | SARH | IR | ...
	GuidanceConfidence string         `json:"guidanceConfidence,omitempty"`
	SurfaceLaunched    bool           `json:"surfaceLaunched,omitempty"`
	Spec               map[string]any `json:"spec,omitempty"` // figures from the local game install
}

type wtrCM struct {
	Type       string `json:"type"` // Flare | Chaff
	Confidence string `json:"confidence,omitempty"`
}

type wtrPlayer struct {
	Slot    int            `json:"slot"`
	Name    string         `json:"name"`
	Clan    string         `json:"clan,omitempty"`
	Title   string         `json:"title,omitempty"`
	Team    int            `json:"team"`
	UserID  uint64         `json:"userId,omitempty"`
	Units   []int          `json:"units"`
	Results map[string]any `json:"results,omitempty"`
}

type wtrEvent struct {
	T          uint32   `json:"t"`
	Type       string   `json:"type"` // kill | launch | countermeasure | message
	Killer     *int     `json:"killer,omitempty"`
	Victim     *int     `json:"victim,omitempty"`
	KillerSlot *int     `json:"killerPlayer,omitempty"`
	Weapon     string   `json:"weapon,omitempty"`
	TeamKill   bool     `json:"teamKill,omitempty"`
	Unit       *int     `json:"unit,omitempty"`
	Parent     *int     `json:"parent,omitempty"`
	Units      []int    `json:"units,omitempty"`
	Text       string   `json:"text,omitempty"`
	KillerAlt  *float64 `json:"killerAltM,omitempty"`
	VictimAlt  *float64 `json:"victimAltM,omitempty"`
	Range      *float64 `json:"rangeM,omitempty"`  // killer aircraft to victim at the moment of the kill
	Missile    *int     `json:"missile,omitempty"` // for kills: the killer's missile that reached the victim
	MissDist   *int     `json:"missDistanceM,omitempty"`
}

type wtrStateChange struct {
	T    uint32            `json:"t"`
	Unit int               `json:"unit"`
	Set  map[string]string `json:"set"`
}

type wtrCheck struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Status   string `json:"status"` // pass | warn | fail | skipped
	Value    string `json:"value"`
	Expected string `json:"expected"`
	Hint     string `json:"hint,omitempty"`
}

type wtrInput struct {
	header     wrpl.WRPLHeader
	directory  *wrpl.ReplayDirectoryInfo
	results    []byte
	tracks     []*track
	slot       *packetslot.PacketSlotParser
	names      map[string]string
	kills      []packetkill.KillEntry
	timeline   []timelineEvent
	cm         countermeasureExport
	radarLocks *radarLockExport
	radarModes *radarModeExport
	ecs        *packetecs2.PacketECSParser
	airfields  []airfieldMarker
}

type wtrBin struct {
	buf bytes.Buffer
}

func (b *wtrBin) align() {
	for b.buf.Len()%4 != 0 {
		b.buf.WriteByte(0)
	}
}

func (b *wtrBin) u32(name string, v []uint32) wtrColumn {
	b.align()
	c := wtrColumn{Name: name, Type: "u32", Offset: int64(b.buf.Len()), Count: len(v)}
	_ = binary.Write(&b.buf, binary.LittleEndian, v)
	return c
}

func (b *wtrBin) f32(name string, v []float32) wtrColumn {
	b.align()
	c := wtrColumn{Name: name, Type: "f32", Offset: int64(b.buf.Len()), Count: len(v)}
	_ = binary.Write(&b.buf, binary.LittleEndian, v)
	return c
}

func (b *wtrBin) u8(name string, v []uint8) wtrColumn {
	b.align()
	c := wtrColumn{Name: name, Type: "u8", Offset: int64(b.buf.Len()), Count: len(v)}
	b.buf.Write(v)
	return c
}

func wtrTeam(coalition string) int {
	switch coalition {
	case "Blue":
		return 1
	case "Red":
		return 2
	}
	return 0
}

func wtrHeaderString(b []byte) string { return string(bytes.Trim(b, "\x00")) }

// wtrLiveSamples returns the samples that belong to the unit's lifetime.
func wtrLiveSamples(tr *track) ([]acmiSample, uint32, bool) {
	s := tr.samples
	if len(s) == 0 {
		return nil, 0, false
	}
	switch {
	case tr.key.missile:
		end, ok := missileTrackEnd(tr)
		if !ok || s[0].t > end {
			return nil, 0, false
		}
		n := sort.Search(len(s), func(i int) bool { return s[i].t > end })
		return s[:n], end, tr.hasEnd
	case tr.key.decoy:
		end, ok := decoyTrackEnd(tr)
		if !ok || s[0].t > end {
			return nil, 0, false
		}
		n := sort.Search(len(s), func(i int) bool { return s[i].t > end })
		return s[:n], end, false
	case tr.key.bomb:
		end, ok := bombTrackEnd(tr)
		if !ok || s[0].t > end {
			return nil, 0, false
		}
		n := sort.Search(len(s), func(i int) bool { return s[i].t > end })
		return s[:n], end, false
	}
	if tr.hasEnd {
		n := sort.Search(len(s), func(i int) bool { return s[i].t > tr.end })
		if n == 0 {
			return nil, 0, false
		}
		return s[:n], tr.end, !tr.retired
	}
	return s, s[len(s)-1].t, false
}

func wtrNaN() float32 { return float32(math.NaN()) }

// splitACMIProps splits "A=1,B=x\,y" on unescaped commas.
func splitACMIProps(line string) []string {
	var out []string
	var cur strings.Builder
	esc := false
	for _, r := range line {
		switch {
		case esc:
			cur.WriteRune(r)
			esc = false
		case r == '\\':
			esc = true
		case r == ',':
			out = append(out, cur.String())
			cur.Reset()
		default:
			cur.WriteRune(r)
		}
	}
	out = append(out, cur.String())
	return out
}

func writeWTR(path string, in wtrInput) ([]wtrCheck, map[string]int, error) {
	ids := acmiObjectIDs(in.tracks)
	if in.radarLocks != nil {
		in.radarLocks.prepare(in.tracks, ids)
	}
	if in.radarModes != nil {
		in.radarModes.prepare(in.tracks, ids)
	}

	bin := &wtrBin{}
	counts := map[string]int{}
	units := make([]wtrUnit, 0, len(in.tracks))
	unitOf := map[trackKey]int{}
	unitByACMI := map[string]int{}
	live := map[int][]acmiSample{}
	full := map[int][]acmiSample{} // uncut samples, for interpolation right at a unit's end
	terrain := wtrLoadTerrain(wtrHeaderString(in.header.Raw_Level[:]))
	cat := wtrLoadCatalog()
	mapData := wtrBuildMap(in, cat, terrain)
	groundEnds := 0

	// first pass: assign ids to tracks that have a lifetime
	for _, tr := range in.tracks {
		if tr == nil {
			continue
		}
		samples, _, _ := wtrLiveSamples(tr)
		if len(samples) == 0 {
			continue
		}
		id := len(unitOf)
		unitOf[tr.key] = id
		unitByACMI[ids[tr.key]] = id
	}

	for _, tr := range in.tracks {
		if tr == nil {
			continue
		}
		id, ok := unitOf[tr.key]
		if !ok {
			continue
		}
		samples, end, destroyed := wtrLiveSamples(tr)
		endReason := ""
		if trackListKind(tr) == "air" {
			if n, cut := wtrGroundCut(samples, terrain); cut {
				samples, end, destroyed, endReason = samples[:n], samples[n-1].t, true, "ground"
				groundEnds++
			}
		}
		live[id] = samples
		full[id] = tr.samples
		if endReason == "ground" {
			full[id] = samples
		}
		u := wtrUnit{
			ID:        id,
			Kind:      trackListKind(tr),
			Name:      wtrCleanName(trackName(tr, in.slot, in.names)),
			EndReason: endReason,
			Team:      wtrTeam(trackCoalition(tr, in.slot)),
			ReplayUID: tr.key.id,
			TStart:    samples[0].t,
			TEnd:      end,
			Destroyed: destroyed,
			Estimated: tr.estimated,
			Static:    tr.groundStatic,
			Samples:   len(samples),
		}
		if u.Kind == "air" {
			u.Kind = "aircraft"
		}
		if tr.entity != nil {
			if cn, ok := packetecs2.GetObjectData[string](&tr.entity.Data, "unit__className"); ok {
				u.Class = strings.TrimSpace(cn)
			}
			if pid, ok := packetecs2.GetObjectData[int32](&tr.entity.Data, "unit__playerId"); ok && pid >= 0 && int(pid) < len(in.slot.Players) && in.slot.Players[pid] != nil {
				p := int(pid)
				u.Player = &p
			}
		}
		if u.Kind == "aircraft" && u.Player == nil {
			u.AI = true
		}
		if tr.parent != nil {
			if pid, ok := unitOf[tr.parent.key]; ok {
				u.Parent = &pid
			}
		}
		n := len(samples)
		t := make([]uint32, n)
		x := make([]float32, n)
		y := make([]float32, n)
		z := make([]float32, n)
		for i, s := range samples {
			t[i], x[i], y[i], z[i] = s.t, float32(s.x), float32(s.y), float32(s.z)
		}
		u.Columns = append(u.Columns, bin.u32("t", t), bin.f32("x", x), bin.f32("y", y), bin.f32("z", z))
		switch u.Kind {
		case "aircraft":
			hd := make([]float32, n)
			pt := make([]float32, n)
			rl := make([]float32, n)
			for i, s := range samples {
				hd[i], pt[i], rl[i] = float32(s.yaw), float32(s.pitch), float32(s.roll)
			}
			u.Columns = append(u.Columns, bin.f32("heading", hd), bin.f32("pitch", pt), bin.f32("roll", rl))
			dv := wtrDerive(samples, terrain)
			u.Columns = append(u.Columns, bin.f32("speed", dv.speed), bin.f32("mach", dv.mach), bin.f32("g", dv.g), bin.f32("climb", dv.climb), bin.f32("agl", dv.agl))
			if cat != nil && u.Class != "" {
				if n := cat.vehicles[strings.ToLower(u.Class)]; n != "" {
					u.Name = n
				}
			}
		case "missile":
			m := &wtrMissile{SurfaceLaunched: tr.surfaceLaunch != nil}
			if tr.missileModel != nil {
				m.Model, m.Family, m.InternalName, m.ModelConfidence = tr.missileModel.Model, tr.missileModel.Family, tr.missileModel.InternalName, tr.missileModel.Confidence
			}
			if tr.missileGuidance != nil {
				m.Guidance, m.GuidanceConfidence = tr.missileGuidance.Type, tr.missileGuidance.Confidence
			}
			if cat != nil && m.InternalName != "" {
				if spec, ok := cat.missiles[strings.ToLower(m.InternalName)]; ok {
					m.Spec = spec
					if n, _ := spec["name"].(string); n != "" && (m.Model == "" || strings.Contains(u.Name, "unk")) {
						u.Name = n
					}
					if g, _ := spec["guidance"].(string); g != "" && m.Guidance == "" {
						m.Guidance, m.GuidanceConfidence = g, "catalogue"
					}
				}
			}
			u.Missile = m
			dv := wtrDerive(samples, nil)
			u.Columns = append(u.Columns, bin.f32("speed", dv.speed), bin.f32("mach", dv.mach), bin.f32("g", dv.g))
			mode := make([]uint8, n)
			kind := make([]uint8, n)
			rng := make([]float32, n)
			los := [3][]float32{make([]float32, n), make([]float32, n), make([]float32, n)}
			tgt := [3][]float32{make([]float32, n), make([]float32, n), make([]float32, n)}
			for i, s := range samples {
				rng[i] = wtrNaN()
				for k := 0; k < 3; k++ {
					los[k][i], tgt[k][i] = wtrNaN(), wtrNaN()
				}
				st, ok := missileSeekerStateForSample(s)
				if !ok {
					continue
				}
				switch st.Kind {
				case projectiles.SeekerKindRadar:
					kind[i] = 1
				case projectiles.SeekerKindUnknown:
					kind[i] = 3
				default:
					kind[i] = 2
				}
				switch st.Mode {
				case projectiles.SeekerModeSearch:
					mode[i] = 1
				case projectiles.SeekerModeTrack:
					mode[i] = 2
				}
				if st.HasRange {
					rng[i] = float32(st.RangeMeters)
				}
				if st.HasLineOfSight {
					for k := 0; k < 3; k++ {
						los[k][i] = st.LineOfSight[k]
					}
				}
				if st.HasTargetEstimate {
					for k := 0; k < 3; k++ {
						tgt[k][i] = st.TargetEstimate[k]
					}
				}
			}
			u.Columns = append(u.Columns,
				bin.u8("seekerMode", mode), bin.u8("seekerKind", kind), bin.f32("seekerRange", rng),
				bin.f32("losX", los[0]), bin.f32("losY", los[1]), bin.f32("losZ", los[2]),
				bin.f32("targetEstX", tgt[0]), bin.f32("targetEstY", tgt[1]), bin.f32("targetEstZ", tgt[2]))
		case "countermeasure":
			u.CM = &wtrCM{Type: countermeasureKind(tr.countermeasure)}
		case "bomb":
			u.BombNoPath = tr.bombPositionOnly
			u.Estimated = u.Estimated || tr.bombEstimate != nil
		}
		units = append(units, u)
	}

	// players
	var results map[string]any
	if len(in.results) > 0 {
		if parsed, err := wrpl.ParseBlk(in.results); err == nil {
			results = parsed
		}
	}
	resultByUser := map[uint64]map[string]any{}
	if results != nil {
		if list, ok := results["player"].([]any); ok {
			for _, raw := range list {
				if m, ok := raw.(map[string]any); ok {
					if s, ok := m["userId"].(string); ok {
						if uid, err := strconv.ParseUint(s, 10, 64); err == nil {
							resultByUser[uid] = m
						}
					}
				}
			}
		}
	}
	players := []wtrPlayer{}
	playerTeam := map[int]int{}
	for i, p := range in.slot.Players {
		if p == nil || (p.Uid.Name == "" && p.Uid.Player_id == 0) {
			continue
		}
		name := p.Uid.Name
		if p.RealNick != "" {
			name = p.RealNick
		}
		wp := wtrPlayer{Slot: i, Name: name, Clan: p.ClanTag, Title: p.Title, Team: int(p.Team), UserID: uint64(p.Uid.Player_id), Units: []int{}}
		if r, ok := resultByUser[wp.UserID]; ok {
			wp.Results = map[string]any{}
			for k, v := range r {
				if k == "name" || k == "userId" || k == "clanTag" {
					continue
				}
				wp.Results[k] = v
			}
		}
		for _, u := range units {
			if u.Player != nil && *u.Player == i && u.Kind == "aircraft" {
				wp.Units = append(wp.Units, u.ID)
			}
		}
		playerTeam[i] = wp.Team
		players = append(players, wp)
	}

	// radar / sensor state changes
	states := []wtrStateChange{}
	addState := func(t uint32, unit int, props []string) {
		if len(props) == 0 {
			return
		}
		set := map[string]string{}
		for _, p := range props {
			k, v, ok := strings.Cut(p, "=")
			if !ok {
				continue
			}
			if strings.HasPrefix(k, "LockedTarget") && !strings.HasPrefix(k, "LockedTargetMode") && !strings.HasPrefix(k, "LockedTargetRange") &&
				!strings.HasPrefix(k, "LockedTargetAzimuth") && !strings.HasPrefix(k, "LockedTargetElevation") {
				if v != "" {
					if target, ok := unitByACMI[v]; ok {
						v = strconv.Itoa(target)
					} else {
						v = ""
					}
				}
			}
			set[wtrStateKey(k)] = v
		}
		if len(set) > 0 {
			states = append(states, wtrStateChange{T: t, Unit: unit, Set: set})
		}
	}
	if in.radarLocks != nil {
		for key, byTime := range in.radarLocks.events {
			if unit, ok := unitOf[key]; ok {
				for t, ev := range byTime {
					addState(t, unit, ev.props)
				}
			}
		}
		for _, extra := range in.radarLocks.extra {
			parts := splitACMIProps(extra.line)
			if unit, ok := unitByACMI[parts[0]]; ok {
				addState(extra.t, unit, parts[1:])
			}
		}
	}
	if in.radarModes != nil {
		for key, byTime := range in.radarModes.events {
			if unit, ok := unitOf[key]; ok {
				for t, props := range byTime {
					addState(t, unit, props)
				}
			}
		}
		for _, extra := range in.radarModes.extra {
			parts := splitACMIProps(extra.line)
			if unit, ok := unitByACMI[parts[0]]; ok {
				addState(extra.t, unit, parts[1:])
			}
		}
	}
	sort.SliceStable(states, func(i, j int) bool {
		if states[i].T != states[j].T {
			return states[i].T < states[j].T
		}
		return states[i].Unit < states[j].Unit
	})

	// events
	events := []wtrEvent{}
	index := newKillTimelineIndex(in.tracks)
	missilesByParent := map[int][]int{}
	for _, u := range units {
		if u.Kind == "missile" && u.Parent != nil {
			missilesByParent[*u.Parent] = append(missilesByParent[*u.Parent], u.ID)
		}
	}
	for _, kill := range in.kills {
		ev := wtrEvent{T: kill.CurrentTime, Type: "kill", Weapon: strings.TrimSpace(kill.PlayerWeapon)}
		if kill.HasKillerPID && kill.KillerPid < 256 {
			s := int(kill.KillerPid)
			ev.KillerSlot = &s
		}
		var killerUnit, victimUnit *wtrUnit
		if kill.HasKillerUID && kill.KillerUid != 0x7ff {
			if tr := index.exactKiller(kill); tr != nil {
				if id, ok := unitOf[tr.key]; ok {
					ev.Killer = &id
					killerUnit = &units[id]
				}
			}
		}
		if kill.HasVictimUID && kill.VictimUid != 0x7ff {
			if tr := index.exactVictim(kill); tr != nil {
				if id, ok := unitOf[tr.key]; ok {
					ev.Victim = &id
					victimUnit = &units[id]
				}
			}
		}
		if killerUnit != nil && victimUnit != nil && killerUnit.Team != 0 && killerUnit.Team == victimUnit.Team && killerUnit.ID != victimUnit.ID {
			ev.TeamKill = true
		}
		if victimUnit != nil {
			if vp, ok := wtrInterpolate(full[victimUnit.ID], kill.CurrentTime); ok {
				ev.VictimAlt = wtrRound(vp[1], 0)
				if killerUnit != nil && killerUnit.Kind == "aircraft" {
					if kp, ok := wtrInterpolate(full[killerUnit.ID], kill.CurrentTime); ok {
						ev.KillerAlt = wtrRound(kp[1], 0)
						ev.Range = wtrRound(math.Sqrt((kp[0]-vp[0])*(kp[0]-vp[0])+(kp[1]-vp[1])*(kp[1]-vp[1])+(kp[2]-vp[2])*(kp[2]-vp[2])), 0)
					}
				}
			}
		}
		// link the kill to the killer's missile that reached the victim
		if killerUnit != nil && victimUnit != nil {
			best, bestID := math.Inf(1), -1
			for _, mid := range missilesByParent[killerUnit.ID] {
				for _, s := range live[mid] {
					if absDiffU32(s.t, kill.CurrentTime) > 4000 {
						continue
					}
					vp, ok := wtrInterpolate(full[victimUnit.ID], s.t)
					if !ok {
						continue
					}
					d := math.Sqrt((s.x-vp[0])*(s.x-vp[0]) + (s.y-vp[1])*(s.y-vp[1]) + (s.z-vp[2])*(s.z-vp[2]))
					if d < best {
						best, bestID = d, mid
					}
				}
			}
			if bestID >= 0 && best < 150 {
				d := int(math.Round(best))
				ev.Missile, ev.MissDist = &bestID, &d
			}
		}
		events = append(events, ev)
	}
	for _, u := range units {
		switch u.Kind {
		case "missile", "bomb":
			id := u.ID
			events = append(events, wtrEvent{T: u.TStart, Type: "launch", Unit: &id, Parent: u.Parent})
		case "countermeasure":
			id := u.ID
			events = append(events, wtrEvent{T: u.TStart, Type: "countermeasure", Unit: &id, Parent: u.Parent})
		}
	}
	for _, te := range in.timeline {
		ev := wtrEvent{T: te.t, Type: "message", Text: te.text}
		for _, key := range te.keys {
			if id, ok := unitOf[key]; ok {
				ev.Units = append(ev.Units, id)
			}
		}
		if strings.HasPrefix(te.text, "Killed ") {
			continue // already represented by structured kill events
		}
		events = append(events, ev)
	}
	sort.SliceStable(events, func(i, j int) bool { return events[i].T < events[j].T })

	checks := wtrSelfChecks(in, units, players, events, states, live, results)
	checks = append(checks, wtrUndergroundCheck(units, live, terrain))
	launches := wtrBuildLaunches(units, events, states, live, full, mapData)
	stats := wtrBuildStats(units, players, launches, live, mapData)
	counts["groundImpacts"] = groundEnds

	// manifest
	var tFirst, tLast uint32
	first := true
	for _, u := range units {
		counts[u.Kind]++
		if u.Kind != "aircraft" {
			continue
		}
		if first || u.TStart < tFirst {
			tFirst = u.TStart
		}
		if first || u.TEnd > tLast {
			tLast = u.TEnd
		}
		first = false
	}
	source := map[string]any{
		"sessionId":     in.header.SessionHEX(),
		"replayVersion": in.header.Version,
		"server":        in.header.IsServer(),
	}
	if in.directory != nil {
		parts := make([]int, len(in.directory.PartNumbers))
		for i, p := range in.directory.PartNumbers {
			parts[i] = int(p)
		}
		files := make([]string, len(in.directory.Paths))
		for i, p := range in.directory.Paths {
			files[i] = filepath.Base(p)
		}
		source["shards"] = parts
		source["shardFiles"] = files
		source["complete"] = !in.directory.Incomplete
		if in.directory.CompletenessNote != "" {
			source["completenessNote"] = in.directory.CompletenessNote
		}
	}
	match := map[string]any{
		"level":         wtrHeaderString(in.header.Raw_Level[:]),
		"mission":       wtrHeaderString(in.header.Raw_LevelSettings[:]),
		"battleType":    wtrHeaderString(in.header.Raw_BattleType[:]),
		"environment":   wtrHeaderString(in.header.Raw_Environment[:]),
		"visibility":    wtrHeaderString(in.header.Raw_Visibility[:]),
		"difficulty":    in.header.Difficulty,
		"startTimeUnix": in.header.StartTime,
		"startTimeUtc":  time.Unix(int64(in.header.StartTime), 0).UTC().Format(time.RFC3339),
		"tFirstMs":      tFirst,
		"tLastMs":       tLast,
	}
	if results != nil {
		if v, ok := results["timePlayed"]; ok {
			match["timePlayedS"] = v
		}
		if v, ok := results["status"]; ok {
			match["status"] = v
		}
	}
	manifest := map[string]any{
		"format":  "wtr",
		"schema":  wtrSchemaVersion,
		"created": time.Now().UTC().Format(time.RFC3339),
		"decoder": map[string]any{"name": "wtdecode", "version": wtrDecoderVersion, "snapshot": wtrSnapshotOrigin, "localTables": tablesUsed},
		"source":  source,
		"match":   match,
		"coords": map[string]string{
			"units": "metres; time in milliseconds of replay clock",
			"axes":  "x = map east, y = altitude, z = map north",
			"angle": "degrees; heading clockwise from +z (north); pitch positive nose up; roll positive right wing down",
		},
		"counts":     counts,
		"selfChecks": checks,
		"files":      []string{"manifest.json", "players.json", "units.json", "events.json", "states.json", "launches.json", "map.json", "stats.json", "results.json", "tracks.bin"},
	}

	if dir := filepath.Dir(path); dir != "." && dir != "" {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return checks, counts, err
		}
	}
	f, err := os.Create(path)
	if err != nil {
		return checks, counts, err
	}
	zw := zip.NewWriter(f)
	writeJSON := func(name string, v any) error {
		w, err := zw.Create(name)
		if err != nil {
			return err
		}
		enc := json.NewEncoder(w)
		enc.SetEscapeHTML(false)
		return enc.Encode(v)
	}
	steps := []struct {
		name string
		v    any
	}{
		{"manifest.json", manifest}, {"players.json", players}, {"units.json", units},
		{"events.json", events}, {"states.json", states}, {"launches.json", launches}, {"map.json", mapData}, {"stats.json", stats}, {"results.json", wtrJSONSafe(results)},
	}
	for _, s := range steps {
		if err := writeJSON(s.name, s.v); err != nil {
			zw.Close()
			f.Close()
			return checks, counts, fmt.Errorf("writing %s: %w", s.name, err)
		}
	}
	bw, err := zw.Create("tracks.bin")
	if err == nil {
		_, err = bw.Write(bin.buf.Bytes())
	}
	if err != nil {
		zw.Close()
		f.Close()
		return checks, counts, err
	}
	if err := zw.Close(); err != nil {
		f.Close()
		return checks, counts, err
	}
	return checks, counts, f.Close()
}

// wtrStateKey renames Tacview-flavoured property names to our own.
func wtrStateKey(k string) string {
	switch k {
	case "RadarMode":
		return "radarOn"
	case "WT_RadarMode":
		return "radarState"
	case "WT_RadarSensor":
		return "radarSensor"
	case "WT_RadarPattern":
		return "radarPattern"
	case "WT_RadarTransceiver":
		return "radarTransceiver"
	case "WT_RadarSignal":
		return "radarSignal"
	case "WT_RadarSlot":
		return "radarSlot"
	case "WT_RadarStateSource":
		return "radarStateSource"
	case "Label":
		return "radarLabel"
	case "RadarAzimuth":
		return "antennaAzimuth"
	case "RadarElevation":
		return "antennaElevation"
	case "LockedTargetMode":
		return "designating"
	case "LockedTargetRange":
		return "targetRange"
	case "LockedTargetAzimuth":
		return "targetAzimuth"
	case "LockedTargetElevation":
		return "targetElevation"
	case "LockedTarget":
		return "target1"
	}
	if strings.HasPrefix(k, "LockedTarget") {
		return "target" + strings.TrimPrefix(k, "LockedTarget")
	}
	return k
}

func wtrJSONSafe(v any) any {
	switch x := v.(type) {
	case map[string]any:
		out := map[string]any{}
		for k, val := range x {
			out[k] = wtrJSONSafe(val)
		}
		return out
	case []any:
		out := make([]any, len(x))
		for i, val := range x {
			out[i] = wtrJSONSafe(val)
		}
		return out
	case float64:
		if math.IsNaN(x) || math.IsInf(x, 0) {
			return nil
		}
	case float32:
		if math.IsNaN(float64(x)) || math.IsInf(float64(x), 0) {
			return nil
		}
	}
	return v
}

func absDiffU32(a, b uint32) uint32 {
	if a > b {
		return a - b
	}
	return b - a
}

// wtrInterpolate returns the position at time t, only inside the track's span
// (with a 1 s tolerance at either end).
func wtrInterpolate(s []acmiSample, t uint32) ([3]float64, bool) {
	if len(s) == 0 {
		return [3]float64{}, false
	}
	i := sort.Search(len(s), func(i int) bool { return s[i].t >= t })
	if i == 0 {
		if s[0].t-t > 1000 {
			return [3]float64{}, false
		}
		return [3]float64{s[0].x, s[0].y, s[0].z}, true
	}
	if i == len(s) {
		last := s[len(s)-1]
		if t-last.t > 1000 {
			return [3]float64{}, false
		}
		return [3]float64{last.x, last.y, last.z}, true
	}
	a, b := s[i-1], s[i]
	f := 0.0
	if b.t > a.t {
		f = float64(t-a.t) / float64(b.t-a.t)
	}
	return [3]float64{a.x + (b.x-a.x)*f, a.y + (b.y-a.y)*f, a.z + (b.z-a.z)*f}, true
}

func wtrMedian(v []float64) float64 {
	if len(v) == 0 {
		return math.NaN()
	}
	sort.Float64s(v)
	return v[len(v)/2]
}

// wtrSelfChecks compares independent parts of the decoded data. If the replay
// format changes, the check that fails points at the parser that broke.
func wtrSelfChecks(in wtrInput, units []wtrUnit, players []wtrPlayer, events []wtrEvent, states []wtrStateChange, live map[int][]acmiSample, results map[string]any) []wtrCheck {
	var checks []wtrCheck
	add := func(id, name, status, value, expected, hint string) {
		if status == "pass" {
			hint = ""
		}
		checks = append(checks, wtrCheck{ID: id, Name: name, Status: status, Value: value, Expected: expected, Hint: hint})
	}

	// 1. replay version
	if note, ok := wtrVerifiedVersions[in.header.Version]; ok {
		add("version", "Replay format version is one this decoder was verified on", "pass", fmt.Sprint(in.header.Version), note, "")
	} else {
		add("version", "Replay format version is one this decoder was verified on", "warn", fmt.Sprint(in.header.Version), "one of the verified versions",
			"New game version. Trust the output only if every other check passes; then add the version to wtrVerifiedVersions.")
	}

	// 2. shards
	if in.directory == nil {
		add("shards", "All replay pieces present", "skipped", "single file", "server replay directory", "")
	} else {
		missing := []string{}
		have := map[int]bool{}
		maxPart := 0
		for _, p := range in.directory.PartNumbers {
			have[int(p)] = true
			if int(p) > maxPart {
				maxPart = int(p)
			}
		}
		for i := 0; i <= maxPart; i++ {
			if !have[i] {
				missing = append(missing, strconv.Itoa(i))
			}
		}
		switch {
		case len(missing) > 0:
			add("shards", "All replay pieces present", "fail", "missing piece(s) "+strings.Join(missing, ", "), "pieces 0.."+strconv.Itoa(maxPart)+" all present", "Download the missing pieces again; each odd-numbered piece holds about 90 s of the match.")
		case in.directory.Incomplete:
			add("shards", "All replay pieces present", "fail", "last piece missing ("+in.directory.CompletenessNote+")", "replay ends with an end marker", "Download the final pieces again.")
		default:
			add("shards", "All replay pieces present", "pass", fmt.Sprintf("%d pieces", len(in.directory.PartNumbers)), "contiguous, with end marker", "")
		}
	}

	// 3. results table readable
	resultPlayers := 0
	deaths := 0
	if results != nil {
		if list, ok := results["player"].([]any); ok {
			resultPlayers = len(list)
			for _, raw := range list {
				if m, ok := raw.(map[string]any); ok {
					if d, ok := wtrNumber(m["deaths"]); ok && d > 0 {
						deaths += int(d)
					}
				}
			}
		}
	}
	if resultPlayers == 0 {
		add("results", "Results table decoded", "fail", "no players in results", "one row per player", "Results block (BLK) layout or its location in the last piece changed: wrpl/blk.go, wrpl/server_directory.go.")
	} else {
		add("results", "Results table decoded", "pass", fmt.Sprintf("%d players", resultPlayers), "one row per player", "")
	}

	// 4. every player in results has an aircraft
	withAircraft, humanPlayers := 0, 0
	for _, p := range players {
		if p.Results == nil {
			continue
		}
		humanPlayers++
		if len(p.Units) > 0 {
			withAircraft++
		}
	}
	status := "pass"
	if humanPlayers == 0 || withAircraft < humanPlayers {
		status = "warn"
		if humanPlayers == 0 || float64(withAircraft) < 0.8*float64(humanPlayers) {
			status = "fail"
		}
	}
	add("players_units", "Every player in the results has a decoded vehicle", status, fmt.Sprintf("%d of %d", withAircraft, humanPlayers), "all",
		"Player-to-unit linking broke: slot packets (wrpl/packet/parser/slot) or entity construction (wrpl/packet/parser/ecs2: uid, unit__playerId).")

	// 5. shoot-downs vs deaths
	playerDeaths := 0
	for _, ev := range events {
		if ev.Type == "kill" && ev.Victim != nil && units[*ev.Victim].Kind == "aircraft" && units[*ev.Victim].Player != nil {
			playerDeaths++
		}
	}
	status = "pass"
	if resultPlayers == 0 {
		status = "skipped"
	} else if playerDeaths != deaths {
		status = "warn"
		if math.Abs(float64(playerDeaths-deaths)) > 0.15*float64(max(deaths, 1)) {
			status = "fail"
		}
	}
	add("kills_vs_results", "Decoded player shoot-downs equal deaths in the results table", status, fmt.Sprintf("%d decoded, %d in results", playerDeaths, deaths), "equal",
		"Kill packets (wrpl/packet/parser/kill, message 0xF058) or unit lookup by uid changed. Also happens when a replay piece is missing.")

	// 6. aircraft sample rate
	var intervals []float64
	for _, u := range units {
		if u.Kind != "aircraft" || u.Player == nil {
			continue
		}
		s := live[u.ID]
		var d []float64
		for i := 1; i < len(s); i++ {
			d = append(d, float64(s[i].t-s[i-1].t))
		}
		if len(d) > 0 {
			intervals = append(intervals, wtrMedian(d))
		}
	}
	med := wtrMedian(intervals)
	status = "pass"
	if math.IsNaN(med) || med < 100 || med > 600 {
		status = "fail"
	}
	add("aircraft_rate", "Aircraft positions arrive at a steady rate", status, fmt.Sprintf("median %.0f ms between samples", med), "100–600 ms",
		"Aircraft state packets (packet type 2, wrpl/packet/parser/fm) are being skipped or mis-framed.")

	// 7. heading vs direction of travel
	var headingErr []float64
	for _, u := range units {
		if u.Kind != "aircraft" {
			continue
		}
		s := live[u.ID]
		for i := 1; i+1 < len(s); i += 5 {
			dt := float64(s[i+1].t-s[i-1].t) / 1000
			if dt <= 0 || dt > 0.8 {
				continue
			}
			dx, dz := s[i+1].x-s[i-1].x, s[i+1].z-s[i-1].z
			speed := math.Hypot(dx, dz) / dt
			if speed < 120 || speed > 1000 {
				continue
			}
			course := math.Atan2(dx, dz) * 180 / math.Pi
			diff := math.Mod(s[i].yaw-course+540, 360) - 180
			headingErr = append(headingErr, math.Abs(diff))
		}
	}
	med = wtrMedian(headingErr)
	status = "pass"
	if math.IsNaN(med) || med > 5 {
		status = "fail"
	}
	add("heading_vs_course", "Aircraft heading agrees with direction of travel", status, fmt.Sprintf("median difference %.1f° over %d samples", med, len(headingErr)), "under 5°",
		"Position or packed attitude fields moved inside the aircraft state record (wrpl/packet/parser/fm: PosX/PosY/PosZ, EulerBytes).")

	// 8. missile first sample near its launcher
	var launchDist []float64
	missiles := 0
	for _, u := range units {
		if u.Kind != "missile" {
			continue
		}
		missiles++
		if u.Parent == nil || units[*u.Parent].Kind != "aircraft" {
			continue
		}
		s := live[u.ID]
		pp, ok := wtrInterpolate(live[*u.Parent], s[0].t)
		if !ok {
			continue
		}
		launchDist = append(launchDist, math.Sqrt((s[0].x-pp[0])*(s[0].x-pp[0])+(s[0].y-pp[1])*(s[0].y-pp[1])+(s[0].z-pp[2])*(s[0].z-pp[2])))
	}
	med = wtrMedian(launchDist)
	switch {
	case missiles == 0:
		add("missile_launch", "Missiles start at their launching aircraft", "warn", "no missiles decoded", "median under 150 m", "No missile tracks: WeaponSync (message 0xF11A, wrpl/packet/parser/projectiles) may have changed, or no missiles were fired.")
	case math.IsNaN(med) || med > 150:
		add("missile_launch", "Missiles start at their launching aircraft", "fail", fmt.Sprintf("median %.0f m over %d missiles", med, len(launchDist)), "median under 150 m", "Missile positions (0xF11A) or launcher linking (rocket construction records) changed: wrpl/packet/parser/projectiles.")
	default:
		add("missile_launch", "Missiles start at their launching aircraft", "pass", fmt.Sprintf("median %.0f m over %d missiles", med, len(launchDist)), "median under 150 m", "")
	}

	// 9. missile kills end at the victim
	matched, total := 0, 0
	for _, ev := range events {
		if ev.Type != "kill" || ev.Killer == nil || ev.Victim == nil || units[*ev.Victim].Kind != "aircraft" {
			continue
		}
		hasMissile := false
		for _, u := range units {
			if u.Kind == "missile" && u.Parent != nil && *u.Parent == *ev.Killer && u.TStart <= ev.T && u.TEnd+4000 >= ev.T {
				hasMissile = true
				break
			}
		}
		if !hasMissile {
			continue
		}
		total++
		if ev.Missile != nil {
			matched++
		}
	}
	switch {
	case total == 0:
		add("missile_kills", "Missile kills line up with a missile reaching the victim", "skipped", "no candidate kills", "at least 60%", "")
	case float64(matched) < 0.6*float64(total):
		add("missile_kills", "Missile kills line up with a missile reaching the victim", "fail", fmt.Sprintf("%d of %d", matched, total), "at least 60%", "Missile tracks and aircraft tracks disagree in time or space: check time stamps and 0xF11A decoding.")
	default:
		add("missile_kills", "Missile kills line up with a missile reaching the victim", "pass", fmt.Sprintf("%d of %d", matched, total), "at least 60%", "")
	}

	// 10. radar state present
	radarUnits := map[int]bool{}
	for _, st := range states {
		if _, ok := st.Set["radarState"]; ok {
			radarUnits[st.Unit] = true
		}
	}
	aircraftPlayers, withRadar := 0, 0
	for _, u := range units {
		if u.Kind == "aircraft" && u.Player != nil {
			aircraftPlayers++
			if radarUnits[u.ID] {
				withRadar++
			}
		}
	}
	status = "pass"
	if aircraftPlayers > 0 && float64(withRadar) < 0.5*float64(aircraftPlayers) {
		status = "warn"
	}
	add("radar", "Radar state decoded for player aircraft", status, fmt.Sprintf("%d of %d player aircraft", withRadar, aircraftPlayers), "at least half (not every aircraft has a radar)",
		"Sensor block inside the aircraft state record changed (wrpl/packet/parser/fm: SensorsData), or the radar catalogue lacks these aircraft.")

	// 11. entity records we could not read
	if in.ecs != nil {
		total := in.ecs.ParsedConstructions + in.ecs.SkippedConstructions
		reasons := []string{}
		for reason, n := range in.ecs.SkipReasons {
			reasons = append(reasons, fmt.Sprintf("%d× %s", n, in.ecs.SkipExamples[reason]))
		}
		sort.Strings(reasons)
		if len(reasons) > 4 {
			reasons = append(reasons[:4], fmt.Sprintf("… and %d more kinds", len(reasons)-4))
		}
		status = "pass"
		hint := ""
		if in.ecs.SkippedConstructions > 0 {
			status = "warn"
			hint = "Unreadable records were skipped, not fatal. Usually a component type added by a newer game version: add it to data/ecshashes.json or a parser in wrpl/packet/parser/ecs2/Parsers.go. Kinds: " + strings.Join(reasons, " | ")
			if total > 0 && float64(in.ecs.SkippedConstructions) > 0.10*float64(total) {
				status = "fail"
			}
		}
		add("entity_records", "Game-object records read without skipping", status, fmt.Sprintf("%d read, %d skipped", in.ecs.ParsedConstructions, in.ecs.SkippedConstructions), "none skipped", hint)
	}

	return checks
}

func wtrNumber(v any) (float64, bool) {
	switch x := v.(type) {
	case int:
		return float64(x), true
	case int32:
		return float64(x), true
	case int64:
		return float64(x), true
	case uint32:
		return float64(x), true
	case uint64:
		return float64(x), true
	case float32:
		return float64(x), true
	case float64:
		return x, true
	}
	return 0, false
}

func wtrPrintChecks(checks []wtrCheck) (failed, warned int) {
	if len(tablesUsed) > 0 {
		fmt.Printf("game-data tables from your install (%s): %d of 6\n", tablesDirUsed, len(tablesUsed))
	} else {
		fmt.Println("game-data tables: built-in copies (game version 2.59.0.74); run tools\\update-game-data.bat to refresh")
	}
	fmt.Println("self-checks:")
	for _, c := range checks {
		mark := map[string]string{"pass": "PASS", "warn": "WARN", "fail": "FAIL", "skipped": "SKIP"}[c.Status]
		fmt.Printf("  [%s] %s: %s (expected: %s)\n", mark, c.Name, c.Value, c.Expected)
		if c.Hint != "" {
			fmt.Printf("         where to look: %s\n", c.Hint)
		}
		switch c.Status {
		case "fail":
			failed++
		case "warn":
			warned++
		}
	}
	return
}
