@echo off
rem Opens the folder where the viewer keeps your converted matches.
if not exist "%LocalAppData%\WTReplayViewer\sessions" mkdir "%LocalAppData%\WTReplayViewer\sessions"
start "" explorer "%LocalAppData%\WTReplayViewer\sessions"
