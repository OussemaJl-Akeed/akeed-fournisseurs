@echo off
chcp 65001 >nul
REM Choisit un nouveau mot de passe pour le site et rechiffre les donnees
cd /d "%~dp0"
python outils\generer_site.py --nouveau-mot-de-passe
pause
