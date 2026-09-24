@echo off
echo ========================================
echo   Starting CampusKart Frontend
echo ========================================
echo.

cd frontend

echo Installing dependencies...
call npm install

echo.
echo Starting React development server...
echo Frontend will run on http://localhost:3000
echo.

call npm start

pause
