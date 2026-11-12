// wtviewer — the War Thunder Replay Viewer app.
//
// A small local program: it serves the viewer's pages (built into this
// program) and the converted matches (.wtr) and terrain (.wtt) from the
// project folder to a window on this computer only. Nothing leaves the PC.
//
// Standard library only. This program does not contain or link the replay
// decoder; it only reads our own .wtr / .wtt files.
package main

import (
	"archive/zip"
	"embed"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"sort"
	"strings"
)

const version = "0.8.0"

//go:embed webdist
var webFS embed.FS

var safeName = regexp.MustCompile(`^[A-Za-z0-9._-]+$`)

var sessionEntries = map[string]string{
	"manifest.json": "application/json",
	"players.json":  "application/json",
	"units.json":    "application/json",
	"events.json":   "application/json",
	"states.json":   "application/json",
	"launches.json": "application/json",
	"map.json":      "application/json",
	"stats.json":    "application/json",
	"results.json":  "application/json",
	"tracks.bin":    "application/octet-stream",
}
var terrainEntries = map[string]string{
	"terrain.json": "application/json",
	"height.u16":   "application/octet-stream",
}

type sessionInfo struct {
	ID       string         `json:"id"`
	File     string         `json:"file"`
	Level    string         `json:"level"`
	Mission  string         `json:"mission"`
	StartUTC string         `json:"startTimeUtc"`
	PlayedS  float64        `json:"timePlayedS"`
	Counts   map[string]int `json:"counts"`
	Terrain  bool           `json:"terrain"`
	Checks   map[string]int `json:"checks"`
}

func main() {
	exe, _ := os.Executable()
	root := filepath.Dir(filepath.Dir(exe))
	sessDir := flag.String("sessions", filepath.Join(root, "sessions"), "folder with converted matches (.wtr)")
	terrDir := flag.String("terrain", filepath.Join(root, "assets", "terrain"), "folder with terrain files (.wtt)")
	catDir := flag.String("catalog", filepath.Join(root, "assets", "catalog"), "folder with catalogue files from the game install")
	port := flag.Int("port", 0, "port to use (0 = pick a free one)")
	noOpen := flag.Bool("no-open", false, "do not open a window")
	dev := flag.String("dev", "", "serve the pages from this folder instead of the built-in copy")
	decName := "wtdecode"
	if runtime.GOOS == "windows" {
		decName += ".exe"
	}
	decoder := flag.String("decoder", filepath.Join(root, "bin", decName), "replay decoder used for fetched matches")
	fetchID := flag.String("fetch", "", "download and convert the match with this session ID, then exit")
	flag.Parse()
	if *fetchID != "" {
		os.Exit(fetchCLI(*sessDir, *decoder, *fetchID))
	}
	fetcher := newFetcher(*sessDir, *decoder)

	mux := http.NewServeMux()

	mux.HandleFunc("/api/sessions", func(w http.ResponseWriter, r *http.Request) {
		list := listSessions(*sessDir, *terrDir)
		writeJSON(w, map[string]any{"version": version, "sessionsFolder": *sessDir, "sessions": list})
	})
	// POST /api/fetch?id=<session ID or link> starts a download; GET /api/fetch/<hex id> reports progress.
	mux.HandleFunc("/api/fetch", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "use POST", http.StatusMethodNotAllowed)
			return
		}
		id, err := parseSessionID(r.URL.Query().Get("id"))
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		writeJSON(w, fetcher.start(id))
	})
	mux.HandleFunc("/api/fetch/", func(w http.ResponseWriter, r *http.Request) {
		id := strings.TrimPrefix(r.URL.Path, "/api/fetch/")
		st := fetcher.status(id)
		if st == nil {
			http.NotFound(w, r)
			return
		}
		writeJSON(w, st)
	})
	mux.HandleFunc("/api/session/", func(w http.ResponseWriter, r *http.Request) {
		parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/session/"), "/")
		if len(parts) != 2 || !safeName.MatchString(parts[0]) {
			http.NotFound(w, r)
			return
		}
		ct, ok := sessionEntries[parts[1]]
		if !ok {
			http.NotFound(w, r)
			return
		}
		serveZipEntry(w, r, filepath.Join(*sessDir, parts[0]+".wtr"), parts[1], ct)
	})
	mux.HandleFunc("/api/terrain/", func(w http.ResponseWriter, r *http.Request) {
		parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/terrain/"), "/")
		if len(parts) != 2 || !safeName.MatchString(parts[0]) {
			http.NotFound(w, r)
			return
		}
		ct, ok := terrainEntries[parts[1]]
		if !ok {
			http.NotFound(w, r)
			return
		}
		serveZipEntry(w, r, filepath.Join(*terrDir, parts[0]+".wtt"), parts[1], ct)
	})

	st := &store{sessDir: *sessDir, terrDir: *terrDir, catDir: *catDir}
	mux.HandleFunc("/api/analysis/", func(w http.ResponseWriter, r *http.Request) {
		id := strings.TrimPrefix(r.URL.Path, "/api/analysis/")
		if !safeName.MatchString(id) {
			http.NotFound(w, r)
			return
		}
		ana, _, err := st.build(id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "no-store")
		_, _ = w.Write(ana)
	})
	mux.HandleFunc("/api/library", func(w http.ResponseWriter, r *http.Request) {
		list := st.library()
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "no-store")
		_, _ = w.Write([]byte(`{"version":"` + version + `","matches":[`))
		for i, b := range list {
			if i > 0 {
				_, _ = w.Write([]byte(","))
			}
			_, _ = w.Write(b)
		}
		_, _ = w.Write([]byte("]}"))
	})
	mux.HandleFunc("/api/catalog/", func(w http.ResponseWriter, r *http.Request) {
		name := strings.TrimPrefix(r.URL.Path, "/api/catalog/")
		if name != "radars.json" && name != "weapons.json" && name != "vehicles.json" {
			http.NotFound(w, r)
			return
		}
		raw, err := os.ReadFile(filepath.Join(*catDir, name))
		if err != nil {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "no-store")
		_, _ = w.Write(raw)
	})

	var pages http.Handler
	if *dev != "" {
		pages = http.FileServer(http.Dir(*dev))
	} else {
		sub, err := fs.Sub(webFS, "webdist")
		if err != nil {
			log.Fatal(err)
		}
		pages = http.FileServer(http.FS(sub))
	}
	mux.Handle("/", noCache(pages))

	// This computer only.
	ln, err := net.Listen("tcp", fmt.Sprintf("127.0.0.1:%d", *port))
	if err != nil {
		log.Fatalf("could not start: %v", err)
	}
	url := fmt.Sprintf("http://127.0.0.1:%d/", ln.Addr().(*net.TCPAddr).Port)

	fmt.Println("War Thunder Replay Viewer", version)
	fmt.Println()
	fmt.Println("  Matches folder :", *sessDir)
	fmt.Println("  Terrain folder :", *terrDir)
	fmt.Println("  Viewer address :", url)
	fmt.Println()
	fmt.Println("The viewer opens in its own window. Keep this window open while you")
	fmt.Println("use it; close this window to quit.")
	if !*noOpen {
		openWindow(url)
	}
	log.Fatal(http.Serve(ln, mux))
}

func noCache(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		h.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	_ = json.NewEncoder(w).Encode(v)
}

func serveZipEntry(w http.ResponseWriter, r *http.Request, zipPath, entry, contentType string) {
	zr, err := zip.OpenReader(zipPath)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer zr.Close()
	for _, f := range zr.File {
		if f.Name != entry {
			continue
		}
		rc, err := f.Open()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer rc.Close()
		w.Header().Set("Content-Type", contentType)
		w.Header().Set("Content-Length", fmt.Sprint(f.UncompressedSize64))
		w.Header().Set("Cache-Control", "no-store")
		_, _ = io.Copy(w, rc)
		return
	}
	http.NotFound(w, r)
}

func levelName(level string) string {
	b := filepath.Base(strings.ReplaceAll(level, "\\", "/"))
	return strings.TrimSuffix(b, filepath.Ext(b))
}

func listSessions(sessDir, terrDir string) []sessionInfo {
	out := []sessionInfo{}
	files, _ := filepath.Glob(filepath.Join(sessDir, "*.wtr"))
	for _, p := range files {
		id := strings.TrimSuffix(filepath.Base(p), ".wtr")
		if !safeName.MatchString(id) {
			continue
		}
		zr, err := zip.OpenReader(p)
		if err != nil {
			continue
		}
		var man struct {
			Match struct {
				Level    string  `json:"level"`
				Mission  string  `json:"mission"`
				StartUTC string  `json:"startTimeUtc"`
				PlayedS  float64 `json:"timePlayedS"`
			} `json:"match"`
			Counts     map[string]int `json:"counts"`
			SelfChecks []struct {
				Status string `json:"status"`
			} `json:"selfChecks"`
		}
		for _, f := range zr.File {
			if f.Name == "manifest.json" {
				if rc, err := f.Open(); err == nil {
					_ = json.NewDecoder(rc).Decode(&man)
					rc.Close()
				}
			}
		}
		zr.Close()
		info := sessionInfo{ID: id, File: filepath.Base(p), Level: levelName(man.Match.Level),
			Mission: man.Match.Mission, StartUTC: man.Match.StartUTC, PlayedS: man.Match.PlayedS,
			Counts: man.Counts, Checks: map[string]int{}}
		for _, c := range man.SelfChecks {
			info.Checks[c.Status]++
		}
		if _, err := os.Stat(filepath.Join(terrDir, info.Level+".wtt")); err == nil {
			info.Terrain = true
		}
		out = append(out, info)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].StartUTC > out[j].StartUTC })
	return out
}

// openWindow opens the viewer. On Windows it first tries Microsoft Edge in
// "app" mode, which gives a plain window without browser tabs or address bar;
// if that fails it uses the default browser.
func openWindow(url string) {
	switch runtime.GOOS {
	case "windows":
		for _, base := range []string{os.Getenv("ProgramFiles(x86)"), os.Getenv("ProgramFiles"), os.Getenv("LocalAppData")} {
			if base == "" {
				continue
			}
			edge := filepath.Join(base, "Microsoft", "Edge", "Application", "msedge.exe")
			if _, err := os.Stat(edge); err == nil {
				if exec.Command(edge, "--app="+url, "--window-size=1600,950").Start() == nil {
					return
				}
			}
		}
		_ = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	case "darwin":
		_ = exec.Command("open", url).Start()
	default:
		_ = exec.Command("xdg-open", url).Start()
	}
}
