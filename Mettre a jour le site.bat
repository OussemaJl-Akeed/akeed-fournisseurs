@echo off
REM Recopie le dossier fournisseurs + le tableau Excel du Bureau et regenere le site
cd /d "%~dp0"
python outils\generer_site.py
pause
