@echo off
echo =====================================
echo   Gallery Backend Server Starter
echo =====================================
echo.

REM Check if node_modules exists in parent directory
if not exist "..\node_modules\" (
    echo [INFO] Installing dependencies...
    echo.
    cd ..
    call npm install
    cd backend
    echo.
    echo [SUCCESS] Dependencies installed!
    echo.
)

echo [INFO] Starting backend server...
echo.
echo Server will run on: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo =====================================
echo.

node server.js
