@echo off
rem Builds terrain (.wtt) for every map from your own game install into assets\terrain.
rem Run after a game update that changes maps. Optional: drag the War Thunder folder onto this file.
setlocal
set "ROOT=%~dp0.."
set "GAME=%~1"
if "%GAME%"=="" set "GAME=G:\SteamLibrary\steamapps\common\War Thunder"
if not exist "%GAME%\levels" (
  echo Could not find the game in "%GAME%".
  set /p "GAME=Type the War Thunder folder and press Enter: "
)
echo Building terrain for every map from "%GAME%\levels" (a few minutes)...
"%ROOT%\bin\wtassets.exe" terrain -game "%GAME%" -out "%ROOT%\assets\terrain"
if errorlevel 1 goto fail
echo.
echo Done. Convert replays again so ground checks and heights above ground use the new terrain.
pause
exit /b 0
:fail
echo.
echo FAILED. See the message above.
pause
exit /b 1
