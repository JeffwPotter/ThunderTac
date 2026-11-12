@echo off
rem Drag a replay .zip (or a folder of .wrpl pieces) onto this file.
setlocal
if "%~1"=="" (
  echo Drag a replay .zip or a folder of .wrpl pieces onto this file.
  pause
  exit /b 1
)
set "ROOT=%~dp0.."
if not exist "%ROOT%\sessions" mkdir "%ROOT%\sessions"
"%ROOT%\bin\wtdecode.exe" -in "%~1" -wtr "%ROOT%\sessions\%~n1.wtr" -check-report "%ROOT%\sessions\%~n1.checks.json"
echo.
if errorlevel 1 (echo Conversion FAILED. See the message above.) else (echo Done. Session file: sessions\%~n1.wtr)
pause
