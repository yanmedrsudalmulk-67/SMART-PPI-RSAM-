@echo off
:: ====================================================================
:: Buka Akses Firewall untuk SMART PPI RSUD AL-MULK
:: Script ini membuka port 3000 di Windows Defender Firewall
:: agar HP / Tablet petugas di WiFi Rumah Sakit bisa membuka aplikasi.
:: ====================================================================

title Buka Akses Firewall - SMART PPI RSUD AL-MULK

:: Cek Administrator Privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Meminta izin Administrator...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"
echo ====================================================================
echo      PENGATURAN FIREWALL - SMART PPI RSUD AL-MULK
echo ====================================================================
echo.
echo Sedang mendaftarkan aturan Firewall untuk Port 3000, 3001, dan 3002 (TCP)...

:: Hapus rule lama jika ada, lalu buat rule baru yang mengizinkan semua profil
netsh advfirewall firewall delete rule name="SMART PPI Server (Port 3000)" >nul 2>&1
netsh advfirewall firewall add rule name="SMART PPI Server (Port 3000)" dir=in action=allow protocol=TCP localport=3000 profile=any >nul 2>&1

netsh advfirewall firewall delete rule name="SMART PPI Server (Port 3001)" >nul 2>&1
netsh advfirewall firewall add rule name="SMART PPI Server (Port 3001)" dir=in action=allow protocol=TCP localport=3001 profile=any >nul 2>&1

netsh advfirewall firewall delete rule name="SMART PPI Server (Port 3002)" >nul 2>&1
netsh advfirewall firewall add rule name="SMART PPI Server (Port 3002)" dir=in action=allow protocol=TCP localport=3002 profile=any >nul 2>&1

if %errorLevel% equ 0 (
    echo.
    echo ====================================================================
    echo  [BERHASIL] Port 3000, 3001, dan 3002 telah diizinkan di Windows Firewall!
    echo.
    echo  Sekarang semua HP, Tablet, dan Komputer di jaringan WiFi RSUD
    echo  AL-MULK sudah bisa mengakses aplikasi SMART PPI tanpa hambatan.
    echo ====================================================================
) else (
    echo.
    echo [PERINGATAN] Terjadi kendala saat menambahkan firewall rule.
    echo Silakan jalankan script ini dengan klik kanan -> "Run as Administrator".
)

echo.
pause
