// wtassets — OURS. Reads data out of a local War Thunder install.
//
//	wtassets unpack -game <War Thunder folder> -out <folder> [-archives aces,gui,...] [-match substring]
//	wtassets catalog -data <unpacked folder> -out <folder>
//	wtassets terrain -game <War Thunder folder> -out <folder> [-match substring]
//	wtassets tables -data <unpacked folder> -out <folder>
//
// Unpacks the game's vromfs archives; data blocks (.blk) are written as JSON.
package main

import (
	"flag"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/maxsupermanhd/wrpl-inspector/v3/wrpl"
	"github.com/maxsupermanhd/wrpl-inspector/v3/wtcontent"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Fprintln(os.Stderr, "usage: wtassets unpack -game <folder> -out <folder>\n       wtassets catalog -data <unpacked folder> -out <folder>\n       wtassets terrain -game <folder> -out <folder>")
		os.Exit(2)
	}
	switch os.Args[1] {
	case "unpack":
		if err := unpack(os.Args[2:]); err != nil {
			fmt.Fprintln(os.Stderr, "error:", err)
			os.Exit(1)
		}
	case "catalog":
		if err := catalog(os.Args[2:]); err != nil {
			fmt.Fprintln(os.Stderr, "error:", err)
			os.Exit(1)
		}
	case "tables":
		if err := tablesCmd(os.Args[2:]); err != nil {
			fmt.Fprintln(os.Stderr, "error:", err)
			os.Exit(1)
		}
	case "objects-debug":
		if err := objectsDebug(os.Args[2:]); err != nil {
			fmt.Fprintln(os.Stderr, "error:", err)
			os.Exit(1)
		}
	case "terrain":
		if err := terrainCmd(os.Args[2:]); err != nil {
			fmt.Fprintln(os.Stderr, "error:", err)
			os.Exit(1)
		}
	default:
		fmt.Fprintln(os.Stderr, "unknown command", os.Args[1])
		os.Exit(2)
	}
}

func unpack(args []string) error {
	fs := flag.NewFlagSet("unpack", flag.ExitOnError)
	game := fs.String("game", "", "War Thunder install folder")
	out := fs.String("out", "", "output folder")
	archives := fs.String("archives", "aces,mis,gui,char,game,lang", "archive names (without .vromfs.bin)")
	match := fs.String("match", "", "only write entries whose path contains this text (lower case)")
	raw := fs.Bool("raw", false, "also write the undecoded .blk bytes")
	_ = fs.Parse(args)
	if *game == "" || *out == "" {
		return fmt.Errorf("-game and -out are required")
	}
	for _, name := range strings.Split(*archives, ",") {
		name = strings.TrimSpace(name)
		if name == "" {
			continue
		}
		path := filepath.Join(*game, name+".vromfs.bin")
		data, err := os.ReadFile(path)
		if err != nil {
			fmt.Fprintf(os.Stderr, "skip %s: %v\n", name, err)
			continue
		}
		vrom, err := wtcontent.ReadVROMFS(data)
		if err != nil {
			return fmt.Errorf("%s: %w", path, err)
		}
		var nameMap []string
		var dict []byte
		for entry, content := range vrom.Files {
			if strings.HasSuffix(entry, "nm") && strings.Contains(entry, "?") {
				if nm, err := wrpl.ParseNameMap(content); err == nil {
					nameMap = nm
				}
			}
			if strings.HasSuffix(entry, ".dict") {
				dict = content
			}
		}
		names := make([]string, 0, len(vrom.Files))
		for entry := range vrom.Files {
			names = append(names, entry)
		}
		sort.Strings(names)
		written, blkOK, blkFail := 0, 0, 0
		failKinds := map[string]int{}
		for _, entry := range names {
			content := vrom.Files[entry]
			clean := filepath.Clean("/" + strings.ReplaceAll(entry, "\\", "/"))
			if strings.ContainsAny(entry, "?\xff") || clean == "/" {
				continue
			}
			if *match != "" && !strings.Contains(strings.ToLower(clean), *match) {
				continue
			}
			target := filepath.Join(*out, name, clean)
			if err := os.MkdirAll(filepath.Dir(target), 0755); err != nil {
				return err
			}
			if strings.HasSuffix(strings.ToLower(entry), ".blk") {
				parsed, err := wrpl.ParseBlkAnyOrdered(content, nameMap, dict) // key order kept (v0.8.0)
				if err != nil {
					blkFail++
					reason := err.Error()
					if len(reason) > 60 {
						reason = reason[:60]
					}
					failKinds[reason]++
					if err := os.WriteFile(target, content, 0644); err != nil {
						return err
					}
					continue
				}
				blkOK++
				js, err := parsed.MarshalJSON()
				if err != nil {
					return fmt.Errorf("%s: %w", entry, err)
				}
				if err := os.WriteFile(target+".json", js, 0644); err != nil {
					return err
				}
				if *raw {
					_ = os.WriteFile(target, content, 0644)
				}
				written++
				continue
			}
			if err := os.WriteFile(target, content, 0644); err != nil {
				return err
			}
			written++
		}
		fmt.Printf("%s: %d entries, %d written, blk decoded %d, blk failed %d %v\n", name, len(names), written, blkOK, blkFail, failKinds)
	}
	return nil
}

func jsonSafe(v any) any {
	switch x := v.(type) {
	case map[string]any:
		out := map[string]any{}
		for k, val := range x {
			out[k] = jsonSafe(val)
		}
		return out
	case []any:
		out := make([]any, len(x))
		for i, val := range x {
			out[i] = jsonSafe(val)
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
