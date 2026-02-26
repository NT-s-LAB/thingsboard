# ThingsBoard Database Installation Script
# File: install-database.ps1
# Usage: .\install-database.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  ThingsBoard DB Install Script" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Load .env file
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Write-Host "[*] Loading environment variables from .env..." -ForegroundColor Green
    
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        
        # Skip comments and empty lines
        if ($line -match '^#' -or $line -eq '') {
            return
        }
        
        # Parse key=value
        if ($line -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            
            # Set environment variable
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
            Write-Host "  [+] $key" -ForegroundColor Gray
        }
    }
    
    Write-Host "[OK] Environment variables loaded!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[X] Error: .env file not found!" -ForegroundColor Red
    exit 1
}

# Check if JAR file exists
$jarFile = Join-Path $PSScriptRoot "application\target\thingsboard-4.3.0-SNAPSHOT-boot.jar"
if (-not (Test-Path $jarFile)) {
    Write-Host "[X] Error: thingsboard-4.3.0-SNAPSHOT-boot.jar not found!" -ForegroundColor Red
    Write-Host "    Please run: mvn -T 2C clean install -DskipTests" -ForegroundColor Yellow
    exit 1
}

Write-Host "[>] Installing ThingsBoard Database..." -ForegroundColor Yellow
Write-Host "    Database: $env:SPRING_DATASOURCE_URL" -ForegroundColor Gray
Write-Host ""

# Build Java command with system properties
$javaArgs = @(
    "-Dspring.datasource.url=$env:SPRING_DATASOURCE_URL"
    "-Dspring.datasource.username=$env:SPRING_DATASOURCE_USERNAME"
    "-Dspring.datasource.password=$env:SPRING_DATASOURCE_PASSWORD"
    "-Dspring.datasource.driverClassName=$env:SPRING_DRIVER_CLASS_NAME"
    "-Ddatabase.ts.type=$env:DATABASE_TS_TYPE"
    "-Ddatabase.ts_latest.type=$env:DATABASE_TS_LATEST_TYPE"
    "-Dloader.main=org.thingsboard.server.ThingsboardInstallApplication"
    "-jar"
    $jarFile
)

# Run install
& java $javaArgs

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Database installation completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next step: Run .\start-thingsboard.ps1 to start the server" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "[X] Database installation failed!" -ForegroundColor Red
    Write-Host "    Check the error messages above" -ForegroundColor Yellow
}
