@echo off
title Pasang Cloudflare Tunnel sebagai Layanan Otomatis Windows
cd /d "%~dp0"

echo ====================================================================
echo      MEMASANG CLOUDFLARE TUNNEL SEBAGAI WINDOWS SERVICE
echo                 www.rsudalmulkmobile.xyz
echo ====================================================================
echo.
echo Pastikan file ini dijalankan dengan: Klik Kanan -^> Run as Administrator!
echo.
echo Menghentikan dan memperbarui layanan Windows...
tools\cloudflared.exe service uninstall >nul 2>&1
tools\cloudflared.exe service install eyJhIjoiYmQ2NTRiZGFiMTIzZGYzOTQ5MDIzZWJkMTMzNGFmMDQiLCJ0IjoiNjkxMTdjZjktN2UzNy00NTA5LTk5ZTEtYWJhODkyOTNmOGZlIiwicyI6Ik1qaVZUQVZpaEl3d2EycVEvNXgvVkFYeXdFdWM5WFBVYmJERS8wQjRnbGs9In0=
echo.
echo Memulai layanan cloudflared...
net start cloudflared
echo.
echo ====================================================================
echo SUKSES! Cloudflare Tunnel kini berjalan otomatis 24 Jam di background.
echo Setiap kali komputer server dinyalakan, www.rsudalmulkmobile.xyz
echo akan langsung aktif tanpa perlu membuka jendela terminal lagi!
echo ====================================================================
echo.
pause
