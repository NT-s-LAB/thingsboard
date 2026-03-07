@echo off
REM ThingsBoard Backend Build Script
REM File: build-backend.bat

echo ======================================
echo   ThingsBoard Backend Build Script
echo ======================================
echo.

REM Check Java version
echo [*] Checking Java version...
java -version
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Java not found! Please install Java 17+
    pause
    exit /b 1
)

REM Check Maven
echo.
echo [*] Checking Maven...
mvn -version
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Maven not found! Please install Maven 3.6+
    pause
    exit /b 1
)

echo.
echo [*] Building ThingsBoard Backend...
echo [*] This may take 10-20 minutes...
echo.

REM Clean and build with parallel processing
mvn -T 2C clean install -DskipTests

if %ERRORLEVEL% eq 0 (
    echo.
    echo ======================================
    echo   Build Completed Successfully!
    echo ======================================
    echo.
    echo [*] JAR file location: application\target\thingsboard-4.3.0-SNAPSHOT-boot.jar
    echo.
) else (
    echo.
    echo ======================================
    echo   Build Failed!
    echo ======================================
    echo.
    echo [ERROR] Check the error messages above
)

pause