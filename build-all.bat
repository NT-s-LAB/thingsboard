@echo off
REM ThingsBoard Complete Build Script
REM File: build-all.bat
REM Author: AI Assistant
REM Usage: Double-click or run from command line

echo ======================================
echo   ThingsBoard Complete Build Script
echo ======================================
echo.
echo This script will:
echo [1] Check system requirements
echo [2] Build Backend (Java/Maven)
echo [3] Build Frontend (Angular/Yarn)
echo [4] Provide run instructions
echo.

set /p CONFIRM="Continue? (Y/N): "
if /I not "%CONFIRM%"=="Y" goto :end

echo.
echo ======================================
echo   Step 1: Checking Requirements
echo ======================================

REM Check Java
echo [*] Checking Java...
java -version 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Java not found! Please install Java 17+
    goto :error
)

REM Check Maven
echo [*] Checking Maven...
mvn -version 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Maven not found! Please install Maven 3.6+
    goto :error
)

REM Check Node.js
echo [*] Checking Node.js...
node --version 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js not found! Please install Node.js 16+
    goto :error
)

REM Check/Install Yarn
echo [*] Checking Yarn...
yarn --version 2>nul
if %ERRORLEVEL% neq 0 (
    echo [!] Installing Yarn...
    npm install -g yarn
)

echo [✓] All requirements satisfied!

echo.
echo ======================================
echo   Step 2: Building Backend
echo ======================================
echo [*] Starting Backend build...
echo [*] This may take 10-20 minutes...

mvn -T 2C clean install -DskipTests

if %ERRORLEVEL% neq 0 (
    echo [ERROR] Backend build failed!
    goto :error
)

echo [✓] Backend build completed!

echo.
echo ======================================
echo   Step 3: Building Frontend
echo ======================================
echo [*] Starting Frontend build...

if not exist "ui-ngx" (
    echo [ERROR] ui-ngx directory not found!
    goto :error
)

cd ui-ngx

echo [*] Installing dependencies...
yarn install --network-timeout 300000

if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install frontend dependencies
    cd ..
    goto :error
)

echo [*] Building production bundle...
yarn run build:prod

if %ERRORLEVEL% neq 0 (
    echo [ERROR] Frontend build failed!
    cd ..
    goto :error
)

cd ..
echo [✓] Frontend build completed!

echo.
echo ======================================
echo   Build Completed Successfully!
echo ======================================
echo.
echo [*] Backend JAR: application\target\thingsboard-4.3.0-SNAPSHOT-boot.jar
echo [*] Frontend: ui-ngx\target\generated-resources\public
echo.
echo ======================================
echo   Next Steps:
echo ======================================
echo 1. Setup PostgreSQL database
echo 2. Run: .\install-database.ps1
echo 3. Start backend: .\start-thingsboard.ps1
echo 4. Access: http://localhost:9090
echo.
echo Default login: sysadmin@thingsboard.org / sysadmin
echo.

goto :end

:error
echo.
echo ======================================
echo   Build Failed!
echo ======================================
echo Please fix the errors above and try again.

:end
pause