@echo off
title SMART PPI - Server Lokal dan Online - RSUD AL-MULK
cd /d "%~dp0"

echo ====================================================================
echo             MEMULAI APLIKASI SMART PPI - RSUD AL-MULK
echo ====================================================================
echo.

:: 1. Periksa koneksi Cloudflare Tunnel (Akses Online HP / Mobile Data)
echo [1/3] Memeriksa konektivitas online www.rsudalmulkmobile.xyz...
curl -s -m 2 -I https://www.rsudalmulkmobile.xyz | findstr /i "200 301 302 307 308" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Mengaktifkan Cloudflare Tunnel untuk akses HP / Mobile Data...
    start /min "Cloudflare Tunnel - SMART PPI" cmd /c "Aktifkan_Akses_Online_Cloudflare.bat"
) else (
    echo [OK] Akses online Cloudflare sudah aktif!
)

:: 2. Periksa apakah server Next.js lokal sudah aktif berjalan di localhost:3001
echo [2/3] Memeriksa server lokal...
curl -s -m 1 http://localhost:3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Aplikasi SMART PPI sudah aktif berjalan!
    echo.
    node scripts/show-wifi-info.js
    echo Membuka browser langsung...
    start http://localhost:3001
    exit /b 0
)

:: Bersihkan proses lama yang menggantung di port 3001 jika ada
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

:: 3. Periksa apakah build produksi sudah ada, jika belum lakukan build otomatis
if not exist ".next\BUILD_ID" (
    echo ====================================================================
    echo   Menyiapkan mode produksi SMART PPI untuk performa maksimal...
    echo   Proses kompilasi awal sedang berjalan...
    echo ====================================================================
    call npm run build
    if errorlevel 1 (
        echo [ERROR] Gagal melakukan build. Menjalankan mode dev sementara...
        start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3001"
        call npm run dev
        exit /b
    )
)

:: Tampilkan info alamat IP lokal & online
node scripts/show-wifi-info.js

:: Buka browser secara otomatis dalam 2 detik
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3001"

:: Jalankan server Next.js mode Produksi pada port 3001
echo [3/3] Menjalankan server aplikasi...
call npm run start

pause
