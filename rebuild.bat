@echo off
setlocal enabledelayedexpansion
title AdVisor - Force Rebuild

echo.
echo  ========================================
echo     Force Rebuilding AdVisor
echo  ========================================
echo.

REM Stop existing containers
echo [1/4] Stopping existing containers...
docker-compose down

REM Remove old images to force rebuild
echo [2/4] Removing old frontend image...
docker rmi gr1-frontend 2>nul
docker rmi gr1_frontend 2>nul

echo [3/4] Building with no cache...
docker-compose build --no-cache frontend

echo [4/4] Starting all services...
docker-compose up -d

echo.
echo Waiting for services...
timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo   Rebuild Complete!
echo ========================================
echo   Frontend: http://localhost
echo ========================================
echo.

start http://localhost

pause
