@echo off
title SMART PPI - Cloudflare Tunnel Online - rsudalmulkmobile.xyz
color 0B
cd /d "%~dp0"

echo ====================================================================
echo             SMART PPI RSUD AL-MULK - KONEKSI ONLINE
echo                   https://www.rsudalmulkmobile.xyz
echo ====================================================================
echo.
echo Sedang menghubungkan server lokal ke domain resmi www.rsudalmulkmobile.xyz...
echo.
echo ====================================================================
echo  PETUNJUK:
echo  1. Pastikan jendela ini TETAP TERBUKA agar web bisa diakses dari HP.
echo  2. Petugas di lapangan bisa langsung buka: https://www.rsudalmulkmobile.xyz
echo ====================================================================
echo.

tools\cloudflared.exe tunnel --protocol http2 run --token eyJhIjoiYmQ2NTRiZGFiMTIzZGYzOTQ5MDIzZWJkMTMzNGFmMDQiLCJ0IjoiNjkxMTdjZjktN2UzNy00NTA5LTk5ZTEtYWJhODkyOTNmOGZlIiwicyI6Ik1qaVZUQVZpaEl3d2EycVEvNXgvVkFYeXdFdWM5WFBVYmJERS8wQjRnbGs9In0=

echo.
pause
