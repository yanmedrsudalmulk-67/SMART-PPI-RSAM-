@echo off
title SMART PPI - Tarik Pembaruan dari GitHub Sekarang
color 0B
cd /d "%~dp0"

echo ====================================================================
echo       TARIK PEMBARUAN TERBARU SMART PPI DARI GITHUB SEKARANG
echo ====================================================================
echo.

node scripts/sync-github.js --ensure-server

echo.
echo ====================================================================
echo  Proses sinkronisasi selesai! Anda dapat menutup jendela ini.
echo ====================================================================
pause
