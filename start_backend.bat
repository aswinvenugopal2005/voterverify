@echo off
title Voter Verification System - FastAPI Backend
echo ==============================================================
echo STARTING VOTER VERIFICATION SYSTEM BACKEND (FastAPI + SQLite)
echo ==============================================================
cd /d "%~dp0backend"
if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found. Please create it first.
    pause
    exit /b 1
)
call venv\Scripts\activate.bat
echo Starting FastAPI Uvicorn Server on http://127.0.0.1:8000 ...
echo API Swagger Docs available at: http://127.0.0.1:8000/docs
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
