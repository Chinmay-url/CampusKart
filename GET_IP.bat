@echo off
echo ========================================
echo   CampusKart - Get Your Local IP
echo ========================================
echo.

echo Your Local IP Addresses:
echo.

ipconfig | findstr /i "IPv4"

echo.
echo ========================================
echo Copy one of the IP addresses above
echo (Usually starts with 192.168.x.x)
echo.
echo Then update frontend/.env.local with:
echo REACT_APP_API_URL=http://YOUR_IP:5000/api
echo REACT_APP_SOCKET_URL=http://YOUR_IP:5000
echo ========================================
echo.

pause
