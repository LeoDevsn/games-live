@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js 24 nao foi localizado. Instale https://nodejs.org/
  pause
  exit /b 1
)
node launch.mjs
if errorlevel 1 pause
