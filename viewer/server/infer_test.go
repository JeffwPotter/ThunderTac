package main

import (
	"os"
	"path/filepath"
	"testing"
)

// TestInferTarget hides the known target of every launch and checks how often
// inferTarget finds it (WTRV_SESSIONS = folder of matches).
func TestInferTarget(t *testing.T) {
	dir := os.Getenv("WTRV_SESSIONS")
	if dir == "" {
		t.Skip("set WTRV_SESSIONS")
	}
	files, _ := filepath.Glob(filepath.Join(dir, "*.wtr"))
	known, guessed, right, unknown, unkGuessed := 0, 0, 0, 0, 0
	for _, f := range files {
		s, err := loadWTR(f)
		if err != nil {
			t.Fatal(err)
		}
		for _, l := range s.Launches {
			if l.Shooter == nil || l.Missile < 0 {
				continue
			}
			g, _ := inferTarget(s, l.Missile, *l.Shooter, l.T)
			if l.Target == nil {
				unknown++
				if g >= 0 {
					unkGuessed++
				}
				continue
			}
			known++
			if g >= 0 {
				guessed++
				if g == *l.Target {
					right++
				}
			}
		}
	}
	acc := float64(right) / float64(max(1, guessed))
	t.Logf("known targets %d: guessed %d (%.0f%%), right %d (%.0f%% of guesses); unknown targets %d: guessed %d",
		known, guessed, 100*float64(guessed)/float64(max(1, known)), right, 100*acc, unknown, unkGuessed)
	if guessed > 20 && acc < 0.9 {
		t.Errorf("guesses right only %.0f%% of the time", 100*acc)
	}
}
