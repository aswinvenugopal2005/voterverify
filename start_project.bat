@echo off
title Launch Voter Verification System
echo =======================================================================
echo LAUNCHING VOTER VERIFICATION SYSTEM WITH REAL-TIME DUPLICATE DETECTION
echo =======================================================================
echo.
echo Launching Backend FastAPI Service in new window...
start "VVS Backend (FastAPI)" cmd /c "%~dp0start_backend.bat"

echo Waiting 3 seconds for backend to initialize...
timeout /t 3 /nobreak >nul

echo Launching Frontend React Service in new window...
start "VVS Frontend (React Vite)" cmd /c "%~dp0start_frontend.bat"

echo.
echo =======================================================================
echo SYSTEM READY!
echo Frontend Application : http://localhost:5173
echo Backend API Docs     : http://127.0.0.1:8000/docs
echo =======================================================================
echo.
pause
