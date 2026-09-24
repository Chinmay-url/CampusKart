@echo off
echo ========================================
echo   CampusKart - Setup Firewall Rules
echo ========================================
echo.
echo This script will add firewall rules to allow
echo network access to CampusKart.
echo.
echo ⚠️  REQUIRES ADMINISTRATOR PRIVILEGES
echo.
pause

echo.
echo Adding firewall rules...
echo.

netsh advfirewall firewall add rule name="CampusKart Backend" dir=in action=allow protocol=TCP localport=5000
netsh advfirewall firewall add rule name="CampusKart Frontend" dir=in action=allow protocol=TCP localport=3000

echo.
echo ========================================
echo ✅ Firewall rules added successfully!
echo ========================================
echo.
echo Backend Port: 5000
echo Frontend Port: 3000
echo.
echo You can now access CampusKart from other
echo devices on your network.
echo ========================================
echo.

pause
