// library_dir.go — where converted matches live (v0.10.2).
//
// Matches are kept outside the program folder, in
// %LocalAppData%\WTReplayViewer\sessions, so they survive updates, also
// when an update is extracted to a new folder. On start the viewer copies in
// any match found in the program's own sessions folder (older installs, matches
// shipped with an update, tools\convert.bat output from before v0.10.2) that it
// has not taken in before. Nothing is deleted from the program folder.
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

// defaultLibraryDir is the matches folder; root/sessions on other systems
// (development, tests).
func defaultLibraryDir(root string) string {
	if runtime.GOOS == "windows" {
		if la := os.Getenv("LocalAppData"); la != "" {
			return filepath.Join(la, "WTReplayViewer", "sessions")
		}
	}
	return filepath.Join(root, "sessions")
}

// importOldSessions copies matches (and their sidecar files and own-ship
// recordings) from src into lib. Each file name is taken in once
// (lib/imported.json), so a match deleted from the library is not brought back.
func importOldSessions(src, lib string) (int, error) {
	if src == "" || lib == "" || sameDir(src, lib) {
		return 0, nil
	}
	if _, err := os.Stat(src); err != nil {
		return 0, nil
	}
	if err := os.MkdirAll(filepath.Join(lib, "live"), 0o755); err != nil {
		return 0, err
	}
	logPath := filepath.Join(lib, "imported.json")
	done := map[string]bool{}
	if raw, err := os.ReadFile(logPath); err == nil {
		_ = json.Unmarshal(raw, &done)
	}
	n := 0
	copyDir := func(from, to string, keep func(string) bool) {
		ents, err := os.ReadDir(from)
		if err != nil {
			return
		}
		for _, e := range ents {
			name := e.Name()
			if e.IsDir() || !keep(strings.ToLower(name)) {
				continue
			}
			key := strings.ToLower(filepath.Join(filepath.Base(to), name))
			if done[key] {
				continue
			}
			dst := filepath.Join(to, name)
			if _, err := os.Stat(dst); err != nil {
				if err := copyFile(filepath.Join(from, name), dst); err != nil {
					fmt.Fprintln(os.Stderr, "could not copy", name, "to the matches folder:", err)
					continue
				}
				if strings.HasSuffix(strings.ToLower(name), ".wtr") {
					n++
				}
			}
			done[key] = true
		}
	}
	copyDir(src, lib, func(n string) bool {
		return strings.HasSuffix(n, ".wtr") || strings.HasSuffix(n, ".checks.json") || strings.HasSuffix(n, ".ownship.json")
	})
	copyDir(filepath.Join(src, "live"), filepath.Join(lib, "live"), func(n string) bool { return strings.HasSuffix(n, ".wtlive.json") })
	if raw, err := json.MarshalIndent(done, "", " "); err == nil {
		_ = os.WriteFile(logPath, raw, 0o644)
	}
	return n, nil
}

func sameDir(a, b string) bool {
	x, err1 := filepath.Abs(a)
	y, err2 := filepath.Abs(b)
	return err1 == nil && err2 == nil && strings.EqualFold(filepath.Clean(x), filepath.Clean(y))
}

// copyFile copies via a temporary name, so a half-copied match never shows up.
func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	tmp := dst + ".tmp"
	out, err := os.Create(tmp)
	if err != nil {
		return err
	}
	if _, err := io.Copy(out, in); err != nil {
		out.Close()
		os.Remove(tmp)
		return err
	}
	if err := out.Close(); err != nil {
		os.Remove(tmp)
		return err
	}
	return os.Rename(tmp, dst)
}
