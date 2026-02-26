# ThingsBoard Start Script with .env loader
# File: start-thingsboard.ps1
# Usage: .\start-thingsboard.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  ThingsBoard Startup Script" -ForegroundColor Cyan
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
    Write-Host "[!] Warning: .env file not found!" -ForegroundColor Yellow
    Write-Host "    Creating default .env file..." -ForegroundColor Yellow
    Write-Host ""
}

# Check if JAR file exists
$jarFile = Join-Path $PSScriptRoot "application\target\thingsboard-4.3.0-SNAPSHOT-boot.jar"
if (-not (Test-Path $jarFile)) {
    Write-Host "[X] Error: thingsboard-4.3.0-SNAPSHOT-boot.jar not found!" -ForegroundColor Red
    Write-Host "    Please run: mvn -T 2C clean install -DskipTests" -ForegroundColor Yellow
    exit 1
}

Write-Host "[>] Starting ThingsBoard..." -ForegroundColor Green
Write-Host "    JAR: $jarFile" -ForegroundColor Gray
Write-Host "    Config: application.properties" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start ThingsBoard with external config file
& java -jar $jarFile --spring.config.location=file:./application.properties
