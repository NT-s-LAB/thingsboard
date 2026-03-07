@echo off
REM ThingsBoard Frontend Build Script
REM File: build-frontend.bat

echo ======================================
echo   ThingsBoard Frontend Build Script
echo ======================================
echo.

REM Check Node.js
echo [*] Checking Node.js version...
node --version
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js not found! Please install Node.js 16+
    pause
    exit /b 1
)

REM Check Yarn
echo.
echo [*] Checking Yarn...
yarn --version
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Yarn not found! Installing...
    npm install -g yarn
)

echo.
echo [*] Changing to ui-ngx directory...
cd ui-ngx

if not exist "ui-ngx" (
    echo [ERROR] ui-ngx directory not found!
    pause
    exit /b 1
)

echo.
echo [*] Installing dependencies...
echo [*] This may take 10-15 minutes...
yarn install --network-timeout 300000

if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [*] Building production bundle...
echo [*] This may take 15-20 minutes...
yarn run build:prod

if %ERRORLEVEL% eq 0 (
    echo.
    echo ======================================
    echo   Frontend Build Completed!
    echo ======================================
    echo.
    echo [*] Built files location: ui-ngx\target\generated-resources\public
    echo.
) else (
    echo.
    echo ======================================
    echo   Frontend Build Failed!
    echo ======================================
    echo.
    echo [ERROR] Check the error messages above
)

cd ..
pause