@echo off
cd /d "%~dp0Faction-Wars-LIVE-0.4.0"
node scripts\launch-live.mjs
if errorlevel 1 pause
