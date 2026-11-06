@echo off
setlocal
cd /d "%~dp0"
set "WALKING_NODE=node"
if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" set "WALKING_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
"%WALKING_NODE%" scripts\build.mjs
if errorlevel 1 goto failed
start "" "http://127.0.0.1:4173"
"%WALKING_NODE%" scripts\serve.mjs
goto end
:failed
echo Build failed. Node.js 22 or later is required.
pause
:end
endlocal
