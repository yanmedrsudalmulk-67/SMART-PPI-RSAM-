@echo off
title SMART PPI - Auto-Sync GitHub Watcher
color 0A
cd /d "%~dp0"

echo ====================================================================
echo         SMART PPI - PENGIKUT OTOMATIS PEMBARUAN GITHUB
echo ====================================================================
echo  Layanan latar belakang ini memeriksa pembaruan GitHub setiap 45 detik.
echo  Jika ada perubahan dari AI Studio / GitHub, aplikasi akan otomatis:
echo  [1] Menarik pembaruan kode (sambil menjaga database SQLite RS tetap aman)
echo  [2] Menyusun ulang build produksi Next.js
echo  [3] Menjalankan ulang server lokal port 3001 secara otomatis
echo ====================================================================
echo.

node scripts/sync-github.js --watch
