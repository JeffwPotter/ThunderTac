@echo off
rem Puts a "War Thunder Replay Viewer" shortcut (with its icon) on your Desktop.
set "EXE=%~dp0..\bin\wtviewer.exe"
powershell -NoProfile -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Desktop')+'\War Thunder Replay Viewer.lnk'); $s.TargetPath=(Resolve-Path '%EXE%').Path; $s.WorkingDirectory=(Resolve-Path '%~dp0..').Path; $s.Save()"
echo Shortcut created on your Desktop.
pause
