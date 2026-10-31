@echo off
title Voter Verification System - React Vite Frontend
echo ==============================================================
echo STARTING VOTER VERIFICATION SYSTEM FRONTEND (React + Vite)
echo ==============================================================
cd /d "%~dp0frontend"
echo Starting Vite Dev Server on http://localhost:5173 ...
npm run dev -- --host 127.0.0.1 --port 5173
pause
