@echo off
title Sinkronisasi SMART PPI ke GitHub
color 0A
cd /d "%~dp0"

echo =======================================================
echo    SINKRONISASI OTOMATIS SMART PPI RSAM KE GITHUB
echo =======================================================
echo.
echo Memeriksa status perubahan...
git status --short

echo.
echo Menambahkan perubahan file...
git add .

set TIMESTAMP=%DATE% %TIME%
echo Menyimpan commit: "Update: %TIMESTAMP%"...
git commit -m "Update otomatis: %TIMESTAMP%"

echo.
echo Mengirim perubahan ke GitHub (https://github.com/yanmedrsudalmulk-67/SMART-PPI-RSAM-)...
git push origin main

echo.
if %ERRORLEVEL% equ 0 (
    echo =======================================================
    echo    BERHASIL! Semua perubahan telah terkirim ke GitHub.
    echo =======================================================
) else (
    echo =======================================================
    echo    GAGAL atau Tidak ada perubahan baru untuk di-push.
    echo =======================================================
)

echo.
pause
