@echo off
setlocal
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js and npm are required for development.
  echo Download Node.js from https://nodejs.org/
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing the development engine for the first run...
  call npm install
  if errorlevel 1 exit /b 1
)
call npm start
