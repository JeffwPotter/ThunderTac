package main

import (
	"fmt"
	"math"
	"math/rand"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"sync"
	"testing"
	"time"
)

// fakeLog makes a 10 Hz "game" recording of unit u as the game would report it,
// with a clock error of skewMs and some noise.
func fakeLog(u *wUnit, t0, skewMs float64, rng *rand.Rand) *liveLog {
	l := &liveLog{Schema: 1, Aircraft: u.Class}
	for t := u.TStart; t <= u.TEnd; t += 100 {
		a, b := u.pos(t-500), u.pos(t+500) // centred difference, as smooth as the game's own figures
		v := b.sub(a)
		unix := t + t0 - skewMs
		l.Samples = append(l.Samples, liveSample{T: unix, AltM: u.pos(t)[1] + rng.NormFloat64()*3,
			VyMs: v[1] + rng.NormFloat64()*2, TASKmh: v.norm()*3.6 + rng.NormFloat64()*8})
	}
	l.StartMs, l.EndMs = l.Samples[0].T, l.Samples[len(l.Samples)-1].T
	return l
}

func TestOwnshipAlignment(t *testing.T) {
	dir := os.Getenv("WTRV_SESSIONS")
	if dir == "" {
		t.Skip("set WTRV_SESSIONS")
	}
	files, _ := filepath.Glob(filepath.Join(dir, "*.wtr"))
	rng := rand.New(rand.NewSource(1))
	tested := 0
	for _, f := range files {
		s, err := loadWTR(f)
		if err != nil {
			t.Fatal(err)
		}
		t0 := s.Manifest.Match.StartUnix * 1000
		for _, u := range s.Units {
			if u.Kind != "aircraft" || u.AI || u.n() < 400 || tested >= 12 {
				continue
			}
			skew := float64(rng.Intn(60000) - 30000) // clocks up to ±30 s apart
			l := fakeLog(u, t0, skew, rng)
			of := matchOwnship(s, []*liveLog{l}, []string{"fake"}, "")
			if len(of.Lives) != 1 {
				t.Errorf("%s unit %d (%s): not matched: %v", filepath.Base(f), u.ID, u.Class, of.Tried)
				continue
			}
			lv := of.Lives[0]
			if lv.Unit != u.ID {
				t.Errorf("unit %d matched to %d", u.ID, lv.Unit)
			}
			if math.Abs(lv.OffsetMs-skew) > 120 {
				t.Errorf("unit %d: offset %v, true %v", u.ID, lv.OffsetMs, skew)
			}
			t.Logf("unit %3d %-22s skew %6.0f found %6.0f  r=%.3f  alt rmse %.1f m  overlap %.0f s", u.ID, u.Class, skew, lv.OffsetMs, lv.Correlation, lv.RMSEAltM, lv.OverlapS)
			tested++
			// the same log must not match an aircraft of another type
			l2 := *l
			l2.Aircraft = "no_such_plane"
			if of2 := matchOwnship(s, []*liveLog{&l2}, []string{"x"}, ""); len(of2.Lives) != 0 {
				t.Errorf("matched a wrong type")
			}
		}
	}
	if tested == 0 {
		t.Skip("no long enough tracks")
	}
}

func TestRecorderAgainstFakeGame(t *testing.T) {
	flying := true
	var mu sync.Mutex
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		f := flying
		mu.Unlock()
		switch r.URL.Path {
		case "/state":
			fmt.Fprintf(w, `{"valid": %v, "H, m": 5000, "TAS, km/h": 900, "IAS, km/h": 700, "M": 0.8, "AoA, deg": 4.5, "Ny": 1.2, "Vy, m/s": 3, "throttle 1, %%": 100, "Mfuel, kg": 3000, "Mfuel0, kg": 6000}`, f)
		case "/indicators":
			fmt.Fprintf(w, `{"valid": %v, "type": "f_15c_golden_eagle", "compass": 90}`, f)
		}
	}))
	defer srv.Close()
	old := liveBase
	liveBase = srv.URL
	defer func() { liveBase = old }()
	dir := t.TempDir()
	lr := newLiveRecorder(dir)
	lr.setOn(true)
	time.Sleep(2500 * time.Millisecond) // first poll after 2 s idle, then 10 Hz
	time.Sleep(12 * time.Second)
	if st := lr.status(); st["recording"] != true {
		t.Fatalf("not recording: %v", st)
	}
	mu.Lock()
	flying = false // back to the hangar
	mu.Unlock()
	time.Sleep(liveEndAfter + 2500*time.Millisecond)
	lr.setOn(false)
	logs, names := readLiveLogs(dir)
	if len(logs) != 1 {
		t.Fatalf("want 1 flight, got %d %v", len(logs), names)
	}
	l := logs[0]
	if !l.Done || l.Aircraft != "f_15c_golden_eagle" || l.Samples[0].AoA != 4.5 || l.Samples[0].Throttle != 100 {
		t.Errorf("bad log: done=%v type=%s first=%+v", l.Done, l.Aircraft, l.Samples[0])
	}
	rate := float64(len(l.Samples)) / ((l.EndMs - l.StartMs) / 1000)
	t.Logf("%s: %d samples, %.1f per second, keys %v", names[0], len(l.Samples), rate, l.Keys)
	if rate < 7 {
		t.Errorf("sample rate too low: %.1f/s", rate)
	}
}
