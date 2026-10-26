@echo off
cd /d "%~dp0"
title Bakong watcher - keep this window open
where node >nul 2>nul || (echo Node.js is not installed. Install it from https://nodejs.org then run this again. & pause & exit /b 1)
:loop
node tools\bakong-watcher.mjs
echo Watcher stopped. Restarting in 5 seconds... (close this window to stop)
timeout /t 5 >nul
goto loop
