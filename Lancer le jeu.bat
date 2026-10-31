@echo off
setlocal
cd /d "%~dp0"

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERREUR] npm est introuvable. Installe Node.js 18 ou plus recent, puis reessaie.
  pause
  exit /b 1
)

echo Demarrage de NBA Sim Lab...
start "NBA Sim Lab - serveur" cmd /k "cd /d ""%~dp0"" && npm start"

for /L %%i in (1,1,30) do (
  powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:3001/api/health' -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } } catch { exit 1 }" >nul 2>&1
  if not errorlevel 1 (
    start "" "http://127.0.0.1:3001"
    exit /b 0
  )
  timeout /t 1 /nobreak >nul
)

echo [ATTENTION] Le serveur ne repond pas encore sur http://127.0.0.1:3001.
echo Verifie la fenetre du serveur pour voir une eventuelle erreur.
pause
