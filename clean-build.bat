@echo off
echo Cleaning up Next.js build environment...

REM Kill any running Node.js processes
taskkill /f /im node.exe 2>nul

REM Remove the .next directory if it exists
if exist .next (
  echo Removing .next directory...
  rmdir /s /q .next
)

REM Create a fresh .next directory with proper permissions
echo Creating fresh .next directory...
mkdir .next
mkdir .next\trace

REM Run the build with tracing disabled
echo Running Next.js build...
set "NODE_OPTIONS=--no-warnings --max-old-space-size=4096"
npm run build

echo Build process completed.
