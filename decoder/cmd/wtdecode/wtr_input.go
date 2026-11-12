// wtr_input.go — ours. Lets the decoder take the .zip a server replay was
// downloaded as, instead of requiring the pieces to be unpacked by hand.
package main

import (
	"archive/zip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

const wtrMaxZipPieceSize = 512 << 20

// wtrPrepareInput returns a directory of .wrpl pieces for a .zip input, and
// the input unchanged for anything else. cleanup removes the temporary copy.
func wtrPrepareInput(path string) (string, func(), error) {
	noop := func() {}
	if !strings.EqualFold(filepath.Ext(path), ".zip") {
		return path, noop, nil
	}
	zr, err := zip.OpenReader(path)
	if err != nil {
		return path, noop, fmt.Errorf("opening %q: %w", path, err)
	}
	defer zr.Close()
	dir, err := os.MkdirTemp("", "wtdecode-*")
	if err != nil {
		return path, noop, err
	}
	cleanup := func() { _ = os.RemoveAll(dir) }
	pieces := 0
	for _, f := range zr.File {
		// Only the file name is used, so an archive cannot write outside dir.
		name := filepath.Base(strings.ReplaceAll(f.Name, "\\", "/"))
		if f.FileInfo().IsDir() || !strings.EqualFold(filepath.Ext(name), ".wrpl") {
			continue
		}
		if f.UncompressedSize64 > wtrMaxZipPieceSize {
			cleanup()
			return path, noop, fmt.Errorf("%q in %q is larger than expected for a replay piece", f.Name, path)
		}
		src, err := f.Open()
		if err != nil {
			cleanup()
			return path, noop, err
		}
		dst, err := os.Create(filepath.Join(dir, name))
		if err == nil {
			_, err = io.Copy(dst, io.LimitReader(src, wtrMaxZipPieceSize))
			if cerr := dst.Close(); err == nil {
				err = cerr
			}
		}
		src.Close()
		if err != nil {
			cleanup()
			return path, noop, err
		}
		pieces++
	}
	if pieces == 0 {
		cleanup()
		return path, noop, fmt.Errorf("%q contains no .wrpl replay pieces", path)
	}
	return dir, cleanup, nil
}
