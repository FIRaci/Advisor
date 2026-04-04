@echo off
setlocal enabledelayedexpansion
title AdVisor AI Marketing Platform

echo.
echo  ========================================
echo     AdVisor AI Marketing Platform
echo  ========================================
echo.

REM Check Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed
    echo Please install Docker Desktop: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)

echo [OK] Docker is running
echo.

echo Starting services...
docker-compose up --build -d

echo.
echo Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo   AdVisor is ready!
echo ========================================
echo.
echo   Frontend: http://localhost
echo   Backend:  http://localhost:3000
echo.
echo ========================================
echo.

start http://localhost

echo Press any key to view logs...
pause >nul

docker-compose logs -f

