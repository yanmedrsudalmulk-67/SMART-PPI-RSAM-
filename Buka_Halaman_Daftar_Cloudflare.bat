@echo off
title Membuka Halaman Cloudflare & Arenhost
cd /d "%~dp0"

echo ====================================================================
echo      MEMBUKA HALAMAN PENDAFTARAN CLOUDFLARE & PANEL ARENHOST
echo ====================================================================
echo.
echo Sedang membuka browser Anda...
echo 1. Cloudflare: dash.cloudflare.com/sign-up
echo 2. Arenhost Client Area: client.arenhost.com
echo.

start https://dash.cloudflare.com/sign-up
start https://client.arenhost.com/clientarea.php?action=domains

echo Selesai! Silakan ikuti panduan di chat untuk langkah berikutnya.
echo.
pause
