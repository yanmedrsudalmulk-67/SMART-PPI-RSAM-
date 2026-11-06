@echo off
title Update dan Build Ulang SMART PPI - Produksi
cd /d "%~dp0"

echo ====================================================================
echo             UPDATE DAN BUILD ULANG SMART PPI (MODE PRODUKSI)
echo                     UOBK RSUD AL-MULK KOTA SUKABUMI
echo ====================================================================
echo.
echo Sedang melakukan kompilasi dan optimasi seluruh halaman aplikasi...
echo Mohon tunggu sebentar sampai proses selesai...
echo.

call npm run build

if errorlevel 1 (
    echo.
    echo ====================================================================
    echo [ERROR] Terjadi kendala saat proses build! Periksa pesan error di atas.
    echo ====================================================================
) else (
    echo.
    echo ====================================================================
    echo [SUKSES] Seluruh halaman telah berhasil dioptimasi!
    echo Sekarang Anda dapat menjalankan 'Jalankan_SMART_PPI.bat'.
    echo Aplikasi akan berjalan super cepat, instan, dan responsif.
    echo ====================================================================
)

echo.
pause
