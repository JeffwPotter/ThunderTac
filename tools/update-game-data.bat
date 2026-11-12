@echo off
rem Refreshes names, missile and radar data, decoder tables, mission areas and map terrain from your own game install.
rem Run after a game update. Optional: drag the War Thunder folder onto this file.
setlocal
set "ROOT=%~dp0.."
set "GAME=%~1"
if "%GAME%"=="" set "GAME=G:\SteamLibrary\steamapps\common\War Thunder"
if not exist "%GAME%\aces.vromfs.bin" (
  echo Could not find the game in "%GAME%".
  set /p "GAME=Type the War Thunder folder and press Enter: "
)
echo Reading game files from "%GAME%" (this takes a minute and uses about 800 MB in gamedata\)...
"%ROOT%\bin\wtassets.exe" unpack -game "%GAME%" -out "%ROOT%\gamedata" -archives aces,mis,lang
if errorlevel 1 goto fail
"%ROOT%\bin\wtassets.exe" catalog -data "%ROOT%\gamedata" -out "%ROOT%\assets\catalog"
if errorlevel 1 goto fail
echo Refreshing the decoder's missile, bomb, radar and loadout tables...
"%ROOT%\bin\wtassets.exe" tables -data "%ROOT%\gamedata" -out "%ROOT%\assets\decoder-tables"
if errorlevel 1 goto fail
echo Building terrain for every map...
"%ROOT%\bin\wtassets.exe" terrain -game "%GAME%" -out "%ROOT%\assets\terrain"
if errorlevel 1 goto fail
echo.
echo Done. Convert replays again to pick up the new data.
pause
exit /b 0
:fail
echo.
echo FAILED. See the message above.
pause
exit /b 1
