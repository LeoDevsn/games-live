@echo off
cd /d "%~dp0"
node scripts\launch-live.mjs
if errorlevel 1 pause
