//go:build !windows

package main

// runNative is only available on Windows; other systems use the browser.
func runNative(url string) bool { return false }
