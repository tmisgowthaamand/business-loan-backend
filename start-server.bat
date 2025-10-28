@echo off
echo Starting Backend Server for Staff Management...
echo.
echo Killing any existing processes on port 5002...
netstat -ano | findstr :5002 > nul
if %errorlevel% == 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5002') do (
        echo Killing process %%a
        taskkill /F /PID %%a >nul 2>&1
    )
)
echo.
echo Starting fresh backend server...
npm run start:dev
pause
