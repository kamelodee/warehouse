Write-Host "Starting optimized build process..." -ForegroundColor Cyan

# Check if backup-temp directory exists
$backupExists = Test-Path -Path "backup-temp"
$tempBackupPath = "../backup-temp-storage"

# If backup-temp exists, move it temporarily out of the project
if ($backupExists) {
    Write-Host "Moving backup-temp directory out of project..." -ForegroundColor Yellow
    
    # Create temp storage directory if it doesn't exist
    if (-not (Test-Path -Path $tempBackupPath)) {
        New-Item -Path $tempBackupPath -ItemType Directory -Force | Out-Null
    }
    
    # Move backup-temp to temporary location
    Move-Item -Path "backup-temp" -Destination $tempBackupPath -Force
}

try {
    # Run the build
    Write-Host "Running Next.js build..." -ForegroundColor Green
    npm run build
    
    # Check if build was successful
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Build completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "Build failed with exit code $LASTEXITCODE" -ForegroundColor Red
    }
} finally {
    # Move backup-temp back to project directory if it was moved
    if ($backupExists) {
        Write-Host "Restoring backup-temp directory..." -ForegroundColor Yellow
        
        # Check if the temporary backup exists
        if (Test-Path -Path "$tempBackupPath/backup-temp") {
            # Move it back
            Move-Item -Path "$tempBackupPath/backup-temp" -Destination "." -Force
        }
    }
}

Write-Host "Build process finished." -ForegroundColor Cyan
