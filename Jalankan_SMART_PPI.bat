@echo off
title SMART PPI - Server Lokal dan Online - RSUD AL-MULK
cd /d "%~dp0"

:: 1. FAST PATH (< 0.1 detik): Jika server lokal sudah aktif di 127.0.0.1:3001, langsung buka browser!
curl -s -o nul --connect-timeout 1 http://127.0.0.1:3001 >nul 2>&1
if %errorlevel% equ 0 (
    start "" "http://localhost:3001"
    tasklist /FI "IMAGENAME eq cloudflared.exe" 2>nul | find /I "cloudflared.exe" >nul 2>&1
    if errorlevel 1 start /min "Cloudflare Tunnel - SMART PPI" cmd /c "Aktifkan_Akses_Online_Cloudflare.bat"
    exit /b 0
)

echo ====================================================================
echo             MEMULAI APLIKASI SMART PPI - RSUD AL-MULK
echo ====================================================================
echo.

:: 2. Aktifkan Cloudflare Tunnel di background tanpa memblokir startup lokal
echo [1/3] Memeriksa layanan akses online Cloudflare Tunnel...
tasklist /FI "IMAGENAME eq cloudflared.exe" 2>nul | find /I "cloudflared.exe" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Mengaktifkan Cloudflare Tunnel untuk akses HP / Mobile Data...
    start /min "Cloudflare Tunnel - SMART PPI" cmd /c "Aktifkan_Akses_Online_Cloudflare.bat"
) else (
    echo [OK] Akses online Cloudflare sudah aktif!
)

:: Bersihkan proses lama yang menggantung di port 3001 jika ada
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

:: 3. Verifikasi kelengkapan build produksi sebelum menjalankan server
echo [2/3] Memeriksa kelengkapan build produksi...
set "NEED_BUILD=0"
if not exist ".next\BUILD_ID" set "NEED_BUILD=1"
if not exist ".next\routes-manifest.json" set "NEED_BUILD=1"
if not exist ".next\prerender-manifest.json" set "NEED_BUILD=1"

if "%NEED_BUILD%"=="1" (
    echo ====================================================================
    echo   Menyiapkan mode produksi SMART PPI untuk performa maksimal...
    echo   Proses kompilasi awal sedang berjalan...
    echo ====================================================================
    node "node_modules\next\dist\bin\next" build
    if errorlevel 1 (
        echo [ERROR] Gagal melakukan build. Menjalankan mode dev sementara...
        start /b "" cmd /c "for /L %%i in (1,1,45) do @(curl -s -o nul --connect-timeout 1 http://127.0.0.1:3001 && (start http://localhost:3001 & exit /b 0) || ping -n 2 127.0.0.1 >nul)"
        node "node_modules\next\dist\bin\next" dev -p 3001 -H 0.0.0.0
        exit /b
    )
)

:: Tampilkan info alamat IP lokal & online
node scripts/show-wifi-info.js

:: Helper background: polling kesiapan 127.0.0.1:3001, buka browser instan, dan pre-warm rute utama
start /b "" cmd /c "for /L %%i in (1,1,45) do @(curl -s -o nul --connect-timeout 1 http://127.0.0.1:3001 && (start http://localhost:3001 & curl -s -o nul http://127.0.0.1:3001/login & curl -s -o nul http://127.0.0.1:3001/dashboard & curl -s -o nul http://127.0.0.1:3001/dashboard/reports/supervisi & curl -s -o nul http://127.0.0.1:3001/dashboard/icra & curl -s -o nul http://127.0.0.1:3001/dashboard/klb & exit /b 0) || ping -n 2 127.0.0.1 >nul)"

:: Jalankan server Next.js mode Produksi langsung via Node (tanpa overhead wrapper npm)
echo [3/3] Menjalankan server aplikasi...
node "node_modules\next\dist\bin\next" start -p 3001 -H 0.0.0.0

pause
