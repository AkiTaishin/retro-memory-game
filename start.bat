@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

set "DEV_URL=http://localhost:5173"

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
for /f "delims=" %%v in ('node -v 2^>nul') do (
    set "NODE_VERSION=%%v"
    echo       バージョン: %%v
)
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

set "INSTALL_STATUS=インストール済み（スキップ）"
if exist "node_modules\" (
    echo [スキップ] 依存パッケージはすでにインストール済みです。
    echo            npm install を省略して続行します。
    echo.
    set "INSTALL_EXIT=0"
) else (
    set "INSTALL_STATUS=初回インストール完了"
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

if not exist "node_modules\vite\bin\vite.js" (
    echo [エラー] Vite が見つかりません。npm install が正常に完了しているか確認してください。
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo  起動準備完了
echo ========================================
echo.
echo [OK] Node.js: !NODE_VERSION!
echo [OK] 作業フォルダ: %CD%
echo [OK] 依存パッケージ: !INSTALL_STATUS!
echo [OK] 開発サーバー: %DEV_URL%
echo.
echo ----------------------------------------
echo  以下で Vite を起動します。
echo  起動後、ブラウザが %DEV_URL% を自動で開きます。
echo  停止するときは Ctrl+C を 1 回押してください。
echo ----------------------------------------
echo.

node "node_modules\vite\bin\vite.js"
set "DEV_EXIT=!ERRORLEVEL!"

echo.
echo ========================================
echo  終了
echo ========================================
echo.
if not "!DEV_EXIT!"=="0" (
    echo [情報] 開発サーバーが停止しました。（終了コード: !DEV_EXIT!^）
    echo        上記のログにエラーが出ていないか確認してください。
) else (
    echo [OK] 開発サーバーが停止しました。
)
echo.
pause
exit /b !DEV_EXIT!
