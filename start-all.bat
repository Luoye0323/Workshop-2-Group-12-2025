@echo off
chcp 65001 > nul
mode con: cols=80 lines=25
title RBI Automation System Launcher

:menu
cls
echo.
echo ╔════════════════════════════════════════════╗
echo ║           RBI AUTOMATION SYSTEM            ║
echo ╠════════════════════════════════════════════╣
echo ║                                            ║
echo ║  1. 🚀 Start ALL Servers (Frontend+Backend)║
echo ║  2. 🌐 Start Frontend Only (React)         ║
echo ║  3. ⚙️  Start Backend Only (Flask)         ║
echo ║  4. 🔗 Open Dashboard (Browser)            ║
echo ║  5. 📊 Open API Test (Browser)             ║
echo ║  6. ❌ Kill All Servers                    ║
echo ║  7. 📋 Show Running Ports                  ║
echo ║  8. 🚪 Exit                                ║
echo ║                                            ║
echo ╚════════════════════════════════════════════╝
echo.
set /p choice="Select option (1-8): "

if "%choice%"=="1" goto start_all
if "%choice%"=="2" goto start_frontend
if "%choice%"=="3" goto start_backend
if "%choice%"=="4" goto open_dashboard
if "%choice%"=="5" goto open_api
if "%choice%"=="6" goto kill_servers
if "%choice%"=="7" goto show_ports
if "%choice%"=="8" exit

goto menu

:start_all
start "RBI Backend" cmd /k "cd /d C:\rbi-system\backend && venv\Scripts\activate.bat && python run.py"
timeout /t 3 > nul
start "RBI Frontend" cmd /k "cd /d C:\rbi-system\frontend && npm run dev"
timeout /t 5 > nul
start http://localhost:3000
echo ✅ Both servers started!
pause
goto menu

:start_frontend
start "RBI Frontend" cmd /k "cd /d C:\rbi-system\frontend && npm run dev"
echo ✅ Frontend started on port 3000
pause
goto menu

:start_backend
start "RBI Backend" cmd /k "cd /d C:\rbi-system\backend && venv\Scripts\activate.bat && python run.py"
echo ✅ Backend started on port 5000
pause
goto menu

:open_dashboard
start http://localhost:3000
echo ✅ Opening dashboard...
goto menu

:open_api
start http://localhost:5000/api/dashboard/stats
echo ✅ Opening API test...
goto menu

:kill_servers
taskkill /F /IM node.exe 2>nul
taskkill /F /IM python.exe 2>nul
echo ✅ All servers killed
pause
goto menu

:show_ports
echo Checking running ports...
netstat -ano | findstr :3000
netstat -ano | findstr :5000
pause
goto menu