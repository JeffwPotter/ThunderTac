//go:build windows

package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"

	webview2 "github.com/jchv/go-webview2"
)

func init() {
	// WebView2 must be created and run on the main OS thread.
	runtime.LockOSThread()
	// The exe is built as a windowed program (no black console), so messages go
	// to a log file instead: %LocalAppData%\WTReplayViewer\viewer.log
	dir := filepath.Join(os.Getenv("LocalAppData"), "WTReplayViewer")
	if os.MkdirAll(dir, 0o755) == nil {
		if f, err := os.OpenFile(filepath.Join(dir, "viewer.log"), os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o644); err == nil {
			log.SetOutput(f)
			os.Stdout, os.Stderr = f, f
		}
	}
}

// runNative shows the viewer in its own window (Microsoft Edge WebView2, which
// ships with Windows 10/11). It blocks until the window is closed and then
// returns true. It returns false if the window could not be created (for
// example the WebView2 runtime is missing) so the caller can fall back to an
// Edge/browser window.
func runNative(url string) (shown bool) {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("native window failed:", r)
			shown = false
		}
	}()
	data := filepath.Join(os.Getenv("LocalAppData"), "WTReplayViewer", "webview")
	_ = os.MkdirAll(data, 0o755)
	w := webview2.NewWithOptions(webview2.WebViewOptions{
		DataPath:  data,
		AutoFocus: true,
		WindowOptions: webview2.WindowOptions{
			Title:  "War Thunder Replay Viewer " + version,
			Width:  1600,
			Height: 950,
			IconId: 1, // icon group id written by tools/mksyso
			Center: true,
		},
	})
	if w == nil {
		return false
	}
	defer w.Destroy()
	w.Navigate(url)
	w.Run()
	return true
}
