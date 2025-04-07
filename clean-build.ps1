Write-Host "Cleaning up Next.js build environment..." -ForegroundColor Cyan

# Kill any running Node.js processes
Write-Host "Stopping Node.js processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait a moment to ensure processes are fully stopped
Start-Sleep -Seconds 2

# Remove the .next directory if it exists
if (Test-Path -Path ".next") {
    Write-Host "Removing .next directory..." -ForegroundColor Yellow
    Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
}

# Create a fresh .next directory with proper permissions
Write-Host "Creating fresh .next directory..." -ForegroundColor Yellow
New-Item -Path ".next" -ItemType Directory -Force | Out-Null
New-Item -Path ".next\trace" -ItemType Directory -Force | Out-Null

# Run the build with optimized settings
Write-Host "Running Next.js build..." -ForegroundColor Green
$env:NODE_OPTIONS = "--no-warnings --max-old-space-size=4096"
npm run build

Write-Host "Build process completed." -ForegroundColor Cyan
