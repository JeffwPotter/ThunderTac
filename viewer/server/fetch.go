// Fetching a match by session ID (v0.8.0).
//
// War Thunder keeps a server replay of every match as numbered pieces:
//
//	https://wt-game-replays.warthunder.com/<id as 16 hex digits>/0000.wrpl, 0001.wrpl, ...
//
// The pieces are plain downloads (no sign-in). The replay page on
// warthunder.com shows the same ID in decimal
// (warthunder.com/en/tournament/replay/<decimal>); both forms are accepted.
// Pieces are saved to <sessions>/_downloads/<id>/, then bin\wtdecode.exe
// converts them to <sessions>/<id>.wtr.
package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"
)

var replayHost = func() string {
	if h := os.Getenv("WTRV_REPLAY_HOST"); h != "" { // for testing only
		return strings.TrimRight(h, "/")
	}
	return "https://wt-game-replays.warthunder.com"
}()

var (
	reHex16 = regexp.MustCompile(`(?i)^[0-9a-f]{16}$`)
	reHexIn = regexp.MustCompile(`(?i)\b([0-9a-f]{16})\b`)
	reDecIn = regexp.MustCompile(`\b([0-9]{10,20})\b`)
)

// parseSessionID accepts the hex ID (as in the replay file address or the
// game), the decimal ID (as on the warthunder.com replay page), or a pasted
// link containing either. It returns the 16-digit lower-case hex form.
func parseSessionID(s string) (string, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return "", errors.New("no session ID given")
	}
	if reHex16.MatchString(s) {
		return strings.ToLower(s), nil
	}
	if strings.Contains(s, "wt-game-replays") || strings.Contains(s, ".wrpl") {
		if m := reHexIn.FindStringSubmatch(s); m != nil {
			return strings.ToLower(m[1]), nil
		}
	}
	if m := reDecIn.FindStringSubmatch(s); m != nil && len(m[1]) != 16 {
		v, err := strconv.ParseUint(m[1], 10, 64)
		if err == nil {
			return fmt.Sprintf("%016x", v), nil
		}
	}
	if m := reHexIn.FindStringSubmatch(s); m != nil {
		return strings.ToLower(m[1]), nil
	}
	return "", fmt.Errorf("%q does not look like a session ID (16 hex digits, or the long number from the replay page)", s)
}

type fetchStatus struct {
	ID      string `json:"id"`
	State   string `json:"state"` // downloading, converting, done, failed
	Pieces  int    `json:"pieces"`
	Bytes   int64  `json:"bytes"`
	Message string `json:"message,omitempty"`
	Started string `json:"started"`
}

type fetcher struct {
	sessDir, decoder string
	mu               sync.Mutex
	jobs             map[string]*fetchStatus
	client           *http.Client
}

func newFetcher(sessDir, decoder string) *fetcher {
	return &fetcher{sessDir: sessDir, decoder: decoder, jobs: map[string]*fetchStatus{},
		client: &http.Client{Timeout: 5 * time.Minute}}
}

func (f *fetcher) status(id string) *fetchStatus {
	f.mu.Lock()
	defer f.mu.Unlock()
	if j, ok := f.jobs[id]; ok {
		c := *j
		return &c
	}
	return nil
}

func (f *fetcher) update(id string, fn func(*fetchStatus)) {
	f.mu.Lock()
	defer f.mu.Unlock()
	if j, ok := f.jobs[id]; ok {
		fn(j)
	}
}

// start begins fetching id in the background unless it is already running.
func (f *fetcher) start(id string) *fetchStatus {
	f.mu.Lock()
	if j, ok := f.jobs[id]; ok && (j.State == "downloading" || j.State == "converting") {
		c := *j
		f.mu.Unlock()
		return &c
	}
	j := &fetchStatus{ID: id, State: "downloading", Started: time.Now().Format(time.RFC3339)}
	f.jobs[id] = j
	c := *j
	f.mu.Unlock()
	go func() {
		err := f.run(context.Background(), id, func(pieces int, bytes int64) {
			f.update(id, func(s *fetchStatus) { s.Pieces, s.Bytes = pieces, bytes })
		}, func(state string) {
			f.update(id, func(s *fetchStatus) { s.State = state })
		})
		f.update(id, func(s *fetchStatus) {
			if err != nil {
				s.State, s.Message = "failed", err.Error()
			} else {
				s.State = "done"
			}
		})
	}()
	return &c
}

// run downloads every piece, then converts. progress and state may be nil.
func (f *fetcher) run(ctx context.Context, id string, progress func(int, int64), state func(string)) error {
	dir := filepath.Join(f.sessDir, "_downloads", id)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	var total int64
	pieces := 0
	for i := 0; i < 500; i++ {
		name := fmt.Sprintf("%04d.wrpl", i)
		path := filepath.Join(dir, name)
		if fi, err := os.Stat(path); err == nil && fi.Size() > 0 {
			pieces++
			total += fi.Size()
			if progress != nil {
				progress(pieces, total)
			}
			continue // already downloaded earlier
		}
		n, missing, err := f.download(ctx, replayHost+"/"+id+"/"+name, path)
		if missing {
			break // no more pieces
		}
		if err != nil {
			return fmt.Errorf("piece %s: %w", name, err)
		}
		pieces++
		total += n
		if progress != nil {
			progress(pieces, total)
		}
	}
	if pieces == 0 {
		return errors.New("the replay server has no pieces for this session (wrong ID, or the replay has expired)")
	}
	if state != nil {
		state("converting")
	}
	return f.convert(id, dir)
}

// download fetches one piece with up to four tries. missing is true when the
// server says the piece does not exist (404/403), which ends the list.
func (f *fetcher) download(ctx context.Context, url, path string) (int64, bool, error) {
	var last error
	for try := 0; try < 4; try++ {
		if try > 0 {
			time.Sleep(time.Duration(try*try) * time.Second)
		}
		req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
		if err != nil {
			return 0, false, err
		}
		req.Header.Set("User-Agent", "wt-replay-viewer (private, offline replay debrief)")
		resp, err := f.client.Do(req)
		if err != nil {
			last = err
			continue
		}
		if resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusForbidden {
			resp.Body.Close()
			return 0, true, nil
		}
		if resp.StatusCode != http.StatusOK {
			resp.Body.Close()
			last = fmt.Errorf("server answered %s", resp.Status)
			continue
		}
		tmp := path + ".part"
		out, err := os.Create(tmp)
		if err != nil {
			resp.Body.Close()
			return 0, false, err
		}
		n, err := io.Copy(out, resp.Body)
		resp.Body.Close()
		cerr := out.Close()
		if err == nil {
			err = cerr
		}
		if err == nil && resp.ContentLength > 0 && n != resp.ContentLength {
			err = fmt.Errorf("got %d of %d bytes", n, resp.ContentLength)
		}
		if err == nil && n == 0 {
			err = errors.New("empty file")
		}
		if err != nil {
			_ = os.Remove(tmp)
			last = err
			continue
		}
		if err := os.Rename(tmp, path); err != nil {
			return 0, false, err
		}
		return n, false, nil
	}
	return 0, false, last
}

func (f *fetcher) convert(id, dir string) error {
	if _, err := os.Stat(f.decoder); err != nil {
		return fmt.Errorf("decoder not found at %s", f.decoder)
	}
	wtr := filepath.Join(f.sessDir, id+".wtr")
	cmd := exec.Command(f.decoder, "-in", dir, "-wtr", wtr, "-check-report", filepath.Join(f.sessDir, id+".checks.json"))
	hideConsole(cmd)
	out, err := cmd.CombinedOutput()
	if err != nil {
		msg := strings.TrimSpace(string(out))
		if len(msg) > 600 {
			msg = "…" + msg[len(msg)-600:]
		}
		return fmt.Errorf("conversion failed: %v\n%s", err, msg)
	}
	if _, err := os.Stat(wtr); err != nil {
		return errors.New("conversion produced no match file")
	}
	return nil
}

// fetchCLI: wtviewer -fetch <id>, for tools\fetch.bat.
func fetchCLI(sessDir, decoder, arg string) int {
	id, err := parseSessionID(arg)
	if err != nil {
		fmt.Println(err)
		return 1
	}
	fmt.Println("Session", id)
	f := newFetcher(sessDir, decoder)
	err = f.run(context.Background(), id, func(p int, b int64) {
		fmt.Printf("\r  downloaded %d pieces, %.1f MB   ", p, float64(b)/1e6)
	}, func(s string) {
		fmt.Println()
		fmt.Println("  converting...")
	})
	fmt.Println()
	if err != nil {
		fmt.Println("FAILED:", err)
		return 1
	}
	fmt.Println("Done:", filepath.Join(sessDir, id+".wtr"))
	return 0
}
