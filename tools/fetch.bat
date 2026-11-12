@echo off
rem Downloads a match from the War Thunder replay server and converts it.
rem Usage: fetch.bat <session ID or replay page link>   (or run it and paste the ID)
setlocal
set "ROOT=%~dp0.."
set "ID=%~1"
if "%ID%"=="" set /p "ID=Paste the session ID or replay link and press Enter: "
"%ROOT%\bin\wtviewer.exe" -fetch "%ID%"
echo.
pause
