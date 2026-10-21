@echo off
cd /d "%~dp0"
if not exist package.json (
  echo ERROR: package.json not found next to this file. Extract the whole zip first.
  pause & exit /b 1
)
if not exist .env.local if exist .env.example copy .env.example .env.local >nul & echo Created .env.local - fill in your Supabase keys, then run again for real data.
call npm install
start "" http://localhost:3000
call npm run dev
pause
