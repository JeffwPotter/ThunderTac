package main

import (
	"os"
	"path/filepath"
	"testing"
)

// Matches in the program folder are copied once; a match deleted from the
// library afterwards is not brought back; existing library files are kept.
func TestImportOldSessions(t *testing.T) {
	src, lib := t.TempDir(), filepath.Join(t.TempDir(), "lib")
	write := func(p, s string) {
		os.MkdirAll(filepath.Dir(p), 0o755)
		if err := os.WriteFile(p, []byte(s), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	write(filepath.Join(src, "a.wtr"), "A")
	write(filepath.Join(src, "a.checks.json"), "{}")
	write(filepath.Join(src, "notes.txt"), "x")
	write(filepath.Join(src, "live", "1_f15.wtlive.json"), "{}")
	write(filepath.Join(lib, "b.wtr"), "B")
	write(filepath.Join(src, "b.wtr"), "old B")
	n, err := importOldSessions(src, lib)
	if err != nil || n != 1 {
		t.Fatalf("first import: %d, %v", n, err)
	}
	for _, f := range []string{"a.wtr", "a.checks.json", "live/1_f15.wtlive.json"} {
		if _, err := os.Stat(filepath.Join(lib, f)); err != nil {
			t.Errorf("%s not copied", f)
		}
	}
	if _, err := os.Stat(filepath.Join(lib, "notes.txt")); err == nil {
		t.Error("notes.txt should not be copied")
	}
	if b, _ := os.ReadFile(filepath.Join(lib, "b.wtr")); string(b) != "B" {
		t.Error("library copy of b.wtr was overwritten")
	}
	os.Remove(filepath.Join(lib, "a.wtr"))
	if n, _ := importOldSessions(src, lib); n != 0 {
		t.Errorf("deleted match brought back (%d)", n)
	}
}
