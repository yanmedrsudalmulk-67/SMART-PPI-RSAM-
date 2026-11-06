@echo off
title SMART PPI - Konfigurasi Domain Cloudflare (rsudalmulkmobile.xyz)
color 0B
cd /d "%~dp0"

echo ====================================================================
echo    SMART PPI RSUD AL-MULK - KONFIGURASI DOMAIN RESMI CLOUDFLARE
echo                  www.rsudalmulkmobile.xyz
echo ====================================================================
echo.

if not exist "tools\cloudflared.exe" (
    echo [ERROR] File tools\cloudflared.exe tidak ditemukan!
    echo Pastikan file cloudflared.exe ada di dalam folder tools.
    pause
    exit /b
)

node scripts/setup-cloudflare-domain.js
