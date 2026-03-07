@echo off
REM EITEK Platform Database Setup
REM File: setup-eitek-database.bat

echo ======================================
echo   EITEK Platform Database Setup
echo ======================================
echo.

echo [*] This script will:
echo     1. Create EITEK Platform database
echo     2. Setup Prisma
echo     3. Run migrations  
echo     4. Seed initial data
echo.

set /p CONFIRM="Continue? (Y/N): "
if /I not "%CONFIRM%"=="Y" goto :end

echo.
echo ======================================
echo   Step 1: Create Database
echo ======================================

REM Create database using psql
echo [*] Creating database 'eitek_platform'...

psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE eitek_platform;" 2>nul

if %ERRORLEVEL% eq 0 (
    echo [✓] Database created successfully!
) else (
    echo [!] Database might already exist
)

echo.
echo ======================================
echo   Step 2: Setup Environment
echo ======================================

REM Copy environment file
if exist "backend\.env" (
    echo [!] .env file already exists
) else (
    copy "backend\.env.example" "backend\.env" >nul
    echo [✓] Environment file created
)

echo.
echo ======================================
echo   Step 3: Install Dependencies
echo ======================================

cd backend

echo [*] Installing Node.js dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install dependencies
    goto :error
)
echo [✓] Dependencies installed

echo.
echo ======================================
echo   Step 4: Setup Prisma
echo ======================================

echo [*] Generating Prisma client...
call npx prisma generate
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to generate Prisma client
    goto :error
)
echo [✓] Prisma client generated

echo.
echo [*] Pushing database schema...
call npx prisma db push
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to push database schema
    goto :error
)
echo [✓] Database schema created

echo.
echo ======================================
echo   Step 5: Seed Initial Data
echo ======================================

echo [*] Seeding database with initial data...
call npx prisma db seed
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to seed database
    goto :error
)
echo [✓] Database seeded successfully

cd ..

echo.
echo ======================================
echo   Setup Complete!
echo ======================================
echo.
echo [✓] EITEK Platform database is ready!
echo.
echo Database Details:
echo   Host: localhost
echo   Port: 5432
echo   Database: eitek_platform
echo   Username: postgres
echo.
echo Default Admin Account:
echo   Email: admin@eitek.com
echo   Password: admin123
echo.
echo Next steps:
echo   1. cd backend
echo   2. npm run start:dev
echo.
echo   3. cd ..\frontend  
echo   4. npm install
echo   5. npm run dev
echo.

goto :end

:error
cd ..
echo.
echo ======================================
echo   Setup Failed!
echo ======================================
echo Please check the errors above and try again.

:end
pause