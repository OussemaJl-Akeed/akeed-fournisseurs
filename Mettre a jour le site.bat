@echo off
chcp 65001 >nul
REM Recopie le dossier fournisseurs + le tableau Excel du Bureau, regenere le site et l'envoie sur GitHub
cd /d "%~dp0"
python outils\generer_site.py
if errorlevel 1 goto fin
if not exist ".git" goto fin
git add -A
git diff --cached --quiet
if not errorlevel 1 (
  echo Pas de changement a envoyer sur GitHub.
  goto fin
)
git commit -m "Mise a jour %date% %time:~0,5%"
git remote get-url origin >nul 2>&1
if errorlevel 1 (
  echo Pas encore de depot GitHub configure.
  goto fin
)
git push
:fin
pause
