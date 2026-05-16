@echo off
echo ============================================
echo   ローカルサーバーを起動します
echo   ブラウザで http://localhost:8000 を開いてください
echo   終了する場合は Ctrl+C を押してください
echo ============================================
echo.
python -m http.server 8000
pause
