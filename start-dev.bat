@echo off
echo ========================================
echo   DEMARRAGE DU SERVEUR DE DEVELOPPEMENT
echo ========================================
echo.

REM Verifier que node_modules existe
if not exist "node_modules\" (
    echo [ERREUR] node_modules n'existe pas!
    echo Installation des dependances...
    call npm install
    if errorlevel 1 (
        echo [ERREUR] Echec de l'installation
        pause
        exit /b 1
    )
)

REM Verifier .env
if not exist ".env" (
    echo [ATTENTION] Fichier .env non trouve
    echo Creation du fichier .env...
    echo VITE_API_URL=http://localhost:5000/api > .env
    echo Fichier .env cree avec VITE_API_URL=http://localhost:5000/api
)

echo.
echo Demarrage du serveur...
echo Ouvrez http://localhost:8080 dans votre navigateur
echo Appuyez sur Ctrl+C pour arreter
echo.

call npm run dev

pause


