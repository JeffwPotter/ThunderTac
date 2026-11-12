#!/bin/sh
# Builds the viewer: bundles the pages into server/webdist, then compiles wtviewer.
# Needs: esbuild (any recent version) and Go 1.24+. No downloads.
set -e
cd "$(dirname "$0")"
ESBUILD=${ESBUILD:-esbuild}
"$ESBUILD" web/src/main.ts --bundle --format=iife --target=es2020 --minify \
  --alias:three=./web/vendor/three/three.module.js --outfile=server/webdist/app.js --log-level=warning
cp web/index.html web/style.css server/webdist/
( cd server && GOTOOLCHAIN=local GOFLAGS=-mod=mod GOPROXY=off go build -o ../../bin/wtviewer ./ \
  && GOTOOLCHAIN=local GOFLAGS=-mod=mod GOPROXY=off GOOS=windows GOARCH=amd64 go build -trimpath -o ../../bin/wtviewer.exe ./ )
echo built
