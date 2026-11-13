@echo off
rem Drag a replay .zip (or a folder of .wrpl pieces) onto this file.
rem The match goes to the matches folder the viewer uses, which is kept outside
rem the program folder so updates never lose it:
rem   %LocalAppData%\WTReplayViewer\sessions
setlocal
if "%~1"=="" (
  echo Drag a replay .zip or a folder of .wrpl pieces onto this file.
  pause
  exit /b 1
)
set "ROOT=%~dp0.."
set "LIB=%LocalAppData%\WTReplayViewer\sessions"
if not exist "%LIB%" mkdir "%LIB%"
"%ROOT%\bin\wtdecode.exe" -in "%~1" -wtr "%LIB%\%~n1.wtr" -check-report "%LIB%\%~n1.checks.json"
echo.
if errorlevel 1 (echo Conversion FAILED. See the message above.) else (echo Done. Match saved to %LIB%\%~n1.wtr)
pause
