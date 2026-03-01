@echo off
title Inkstone Engine
echo.
echo  ===============================
echo   INKSTONE ENGINE - Starting...
echo  ===============================
echo.

:: Check Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Python is not installed or not in PATH.
    echo  Download it from https://www.python.org/downloads/
    echo  Make sure to check "Add Python to PATH" during install.
    echo.
    pause
    exit /b
)

:: Install Flask if needed
pip show flask >nul 2>&1
if errorlevel 1 (
    echo  Installing Flask...
    pip install flask
    echo.
)

echo  Starting editor at http://localhost:5000
echo  Open that URL in your browser.
echo  Press Ctrl+C here to stop the server.
echo.

:: Launch and open browser
start http://localhost:5000
python app.py

pause
