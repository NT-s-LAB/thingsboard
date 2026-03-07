# EITEK Platform Database Setup Script
# File: setup-database.ps1
# Usage: .\setup-database.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  EITEK Platform Database Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Database configuration
$DB_HOST = "localhost"
$DB_PORT = "5432"  # Same PostgreSQL instance, different database
$DB_NAME = "eitek_platform"
$DB_USER = "postgres"
$DB_PASSWORD = "01041998@"  # Same as ThingsBoard for simplicity

Write-Host "[*] Setting up EITEK Platform database..." -ForegroundColor Green
Write-Host "    Host: $DB_HOST" -ForegroundColor Gray
Write-Host "    Port: $DB_PORT" -ForegroundColor Gray
Write-Host "    Database: $DB_NAME" -ForegroundColor Gray
Write-Host "    User: $DB_USER" -ForegroundColor Gray
Write-Host ""

# Create database using psql
Write-Host "[*] Creating database '$DB_NAME'..." -ForegroundColor Yellow

$createDbCommand = @"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME;"
"@

try {
    Invoke-Expression $createDbCommand
    Write-Host "[✓] Database '$DB_NAME' created successfully!" -ForegroundColor Green
} catch {
    Write-Host "[!] Database might already exist or creation failed" -ForegroundColor Yellow
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Create .env file for backend
Write-Host "[*] Creating environment configuration..." -ForegroundColor Yellow

$envContent = @"
# EITEK Platform Environment Configuration
# Database Configuration
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_USERNAME=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME

# App Configuration  
NODE_ENV=development
PORT=3001
APP_NAME="EITEK Platform"
APP_VERSION="1.0.0"

# JWT Configuration
JWT_SECRET="eitek-platform-jwt-secret-key-change-in-production"
JWT_EXPIRES_IN="1d"
JWT_REFRESH_SECRET="eitek-platform-refresh-secret-key-change-in-production"
JWT_REFRESH_EXPIRES_IN="7d"

# Frontend URL
FRONTEND_URL="http://localhost:3000"

# ThingsBoard Integration
THINGSBOARD_URL="http://localhost:9090"
THINGSBOARD_USERNAME="sysadmin@thingsboard.org"
THINGSBOARD_PASSWORD="sysadmin"
THINGSBOARD_TIMEOUT=30000
THINGSBOARD_RETRY_ATTEMPTS=3
THINGSBOARD_RETRY_DELAY=1000

# Security
BCRYPT_SALT_ROUNDS=12

# Redis (Optional - for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
"@

$envPath = Join-Path $PSScriptRoot "eitek-platform\backend\.env"
$envDir = Split-Path $envPath -Parent

if (-not (Test-Path $envDir)) {
    New-Item -ItemType Directory -Path $envDir -Force | Out-Null
}

Set-Content -Path $envPath -Value $envContent -Encoding UTF8
Write-Host "[✓] Environment file created: $envPath" -ForegroundColor Green

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Database Setup Complete!" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. cd eitek-platform\backend" -ForegroundColor Gray
Write-Host "2. npm install" -ForegroundColor Gray
Write-Host "3. npx prisma generate" -ForegroundColor Gray
Write-Host "4. npx prisma db push" -ForegroundColor Gray
Write-Host "5. npx prisma db seed" -ForegroundColor Gray
Write-Host ""

pause