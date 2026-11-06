@echo off
title SMART PPI - Mode Pengembang (Development / Hot-Reload)
cd /d "%~dp0"

echo ====================================================================
echo             SMART PPI - MODE PENGEMBANG (DEV)
echo ====================================================================
echo Mode ini digunakan untuk mengubah kode dan melihat perubahan langsung.
echo (Catatan: Kecepatan klik menu lebih lambat karena kompilasi on-demand)
echo.
npm run dev

pause
