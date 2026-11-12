module github.com/maxsupermanhd/wrpl-inspector/v3

go 1.24.0

toolchain go1.24.7

require (
	github.com/davecgh/go-spew v1.1.1
	github.com/klauspost/compress v1.18.3
	github.com/pierrec/lz4/v4 v4.1.25
	github.com/rs/zerolog v1.34.0
)

require (
	github.com/mattn/go-colorable v0.1.14 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	golang.org/x/sys v0.40.0 // indirect
)

replace golang.org/x/sys => github.com/golang/sys v0.40.0
