@echo off
echo ========================================
echo   Starting CampusKart Backend Server
echo ========================================
echo.

cd backend

echo Installing dependencies...
call npm install

echo.
echo Starting server...
echo Backend will run on http://localhost:5000
echo.

node server.js

pause
