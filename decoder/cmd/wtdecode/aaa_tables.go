// OURS (v0.8.0). Game-data tables regenerated from the local War Thunder
// install (wtassets tables) replace the built-in copies.
//
// The built-in tables (data/*.json) were generated from game version
// 2.59.0.74. When <program folder>/../assets/decoder-tables/<name>.json exists
// (or the folder named by WTDECODE_TABLES), it is used instead, so new
// missiles, bombs, radars and aircraft loadouts are recognised after a game
// update without rebuilding the decoder. A table that cannot be read keeps
// the built-in copy.
//
// The file name starts with "aaa_" so this init runs before any other file's
// init in the package (Go runs them in file-name order).
package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sort"
)

// tablesUsed lists the tables taken from the local game install (for the report).
var tablesUsed []string
var tablesDirUsed string

func init() {
	dir := os.Getenv("WTDECODE_TABLES")
	if dir == "" {
		if exe, err := os.Executable(); err == nil {
			dir = filepath.Join(filepath.Dir(filepath.Dir(exe)), "assets", "decoder-tables")
		}
	}
	if dir == "" {
		return
	}
	for name, target := range map[string]*[]byte{
		"aam_models.json":          &embeddedAAMModelsJSON,
		"agm_models.json":          &embeddedAGMModelsJSON,
		"bomb_models.json":         &embeddedBombModelsJSON,
		"missile_carriers.json":    &embeddedMissileCarriersJSON,
		"countermeasure_ammo.json": &countermeasureAmmoJSON,
		"radar_modes.json":         &radarModeCatalogData,
	} {
		raw, err := os.ReadFile(filepath.Join(dir, name))
		if err != nil || len(raw) == 0 || !json.Valid(raw) {
			continue
		}
		*target = raw
		tablesUsed = append(tablesUsed, name)
	}
	if len(tablesUsed) > 0 {
		sort.Strings(tablesUsed)
		tablesDirUsed = dir
	}
}
