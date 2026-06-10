@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

set "DEV_URL=http://localhost:5173"
set "DEV_PORT=5173"

echo ========================================
echo  CRYSTAL MEMORY - 起動
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo [エラー] Node.js がインストールされていません。
    echo.
    echo Node.js 18 以上をインストールしてから、再度実行してください。
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js が見つかりました。
for /f "delims=" %%v in ('node -v 2^>nul') do echo       バージョン: %%v
echo.

set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR="

if exist "%SCRIPT_DIR%package.json" (
    set "PROJECT_DIR=%SCRIPT_DIR%"
) else if exist "%SCRIPT_DIR%retro-memory-game\package.json" (
    set "PROJECT_DIR=%SCRIPT_DIR%retro-memory-game\"
) else (
    echo [エラー] プロジェクトフォルダが見つかりません。
    echo.
    echo 次のいずれかの場所に start.bat を置いてください。
    echo   - retro-memory-game フォルダ直下
    echo   - retro-memory-game フォルダがある階層
    echo.
    pause
    exit /b 1
)

cd /d "%PROJECT_DIR%"
if errorlevel 1 (
    echo [エラー] プロジェクトフォルダへ移動できませんでした。
    echo パス: %PROJECT_DIR%
    echo.
    pause
    exit /b 1
)

echo [情報] 作業フォルダ: %CD%
echo.

if exist "node_modules\" (
    echo [スキップ] 依存パッケージはすでにインストール済みです。
    echo            npm install を省略して続行します。
    echo.
    set "INSTALL_EXIT=0"
) else (
    echo [実行] npm install
    echo ----------------------------------------
    call npm install
    set "INSTALL_EXIT=!ERRORLEVEL!"
    echo ----------------------------------------
    echo.

    if not "!INSTALL_EXIT!"=="0" (
        echo [異常終了] npm install に失敗しました。（終了コード: !INSTALL_EXIT!^）
        echo.
        echo ネットワーク接続や Node.js のバージョンを確認してください。
        echo.
        pause
        exit /b !INSTALL_EXIT!
    )

    echo [OK] npm install が正常に完了しました。
    echo.
)
echo [実行] npm run dev
echo ----------------------------------------
echo 開発サーバーは別ウィンドウで起動します。
echo 起動完了後、ブラウザが %DEV_URL% を自動で開きます。
echo ----------------------------------------
echo.

start "CRYSTAL MEMORY - Dev Server" cmd /k "cd /d ""%PROJECT_DIR%"" && npm run dev"

echo [待機] 開発サーバーの起動を待っています...
set "SERVER_READY=0"
for /l %%i in (1,1,60) do (
    netstat -an | findstr ":%DEV_PORT%" | findstr "LISTENING" >nul 2>&1
    if not errorlevel 1 (
        set "SERVER_READY=1"
        goto :server_ready
    )
    ping 127.0.0.1 -n 2 >nul
)
:server_ready

echo.
echo ========================================
if "%SERVER_READY%"=="1" (
    echo  起動完了
    echo ========================================
    echo.
    echo [OK] 開発サーバーが起動しました。
    echo [OK] ブラウザが自動で開きます。
    echo      開かない場合は %DEV_URL% を手動で開いてください。
    echo.
    echo  このウィンドウは閉じて構いません。
    echo  ゲームを終了するときは、タスクバーの
    echo  「CRYSTAL MEMORY - Dev Server」ウィンドウを開き、
    echo  Ctrl+C を押してください。
    set "DEV_EXIT=0"
) else (
    echo  起動に時間がかかっています
    echo ========================================
    echo.
    echo [警告] サーバーの起動確認ができませんでした。
    echo        「CRYSTAL MEMORY - Dev Server」ウィンドウに
    echo        エラーが出ていないか確認してください。
    echo.
    echo  問題なければ %DEV_URL% をブラウザで開いてください。
    set "DEV_EXIT=1"
)
echo.
pause
exit /b %DEV_EXIT%
