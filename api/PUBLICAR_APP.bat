@echo off
REM Copia o app (app\dist) para a pasta app_mobile do Gerenciador de ONUs.
REM Uso: PUBLICAR_APP.bat "C:\caminho\do\gerenciador de onu"
set DESTINO=%~1
if "%DESTINO%"=="" set DESTINO=%USERPROFILE%\Desktop\gerenciador de onu
if not exist "%~dp0..\app\dist\index.html" (
  echo Gere o app antes: cd app ^&^& npm install ^&^& npm run build
  pause & exit /b 1
)
if not exist "%DESTINO%\noc.py" (
  echo Nao achei o noc.py em "%DESTINO%".
  pause & exit /b 1
)
xcopy /E /I /Y "%~dp0..\app\dist" "%DESTINO%\app_mobile" >nul
copy /Y "%~dp0api_mobile.py" "%DESTINO%\" >nul
copy /Y "%~dp0instalar_api_mobile.py" "%DESTINO%\" >nul
echo App copiado para "%DESTINO%\app_mobile".
echo Se for a primeira vez, rode na pasta do Gerenciador:  python instalar_api_mobile.py
pause
