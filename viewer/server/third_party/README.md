# third_party

One-time copies of libraries used by the native window on Windows. Nothing is
downloaded when building; `go.mod` points here with `replace` lines.

| Folder | Source | Licence | Used for |
|---|---|---|---|
| `go-webview2` | github.com/jchv/go-webview2 | MIT | Window with Microsoft Edge WebView2 (`window_windows.go`). Its `cmd/` examples were removed. |
| `go-winloader` | github.com/jchv/go-winloader | MIT | Loads the WebView2 loader DLL from memory (needed by go-webview2). |
| `x-sys` | golang.org/x/sys | BSD-3-Clause | Windows system calls. |

Local changes: the `go` line in each `go.mod` was raised to 1.24 so the code builds
with the same language version as the rest of the project. Nothing else was edited.
They are only compiled into the Windows build.
