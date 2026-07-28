@echo off
echo Arrêt du serveur sur le port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    echo Arrêt du processus PID %%a
    taskkill /F /PID %%a >nul 2>&1
)
echo Serveur arrêté.
pause




















