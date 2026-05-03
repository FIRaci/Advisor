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

set "COMPOSE_CMD="
docker compose version >nul 2>&1
if %errorlevel% equ 0 (
    set "COMPOSE_CMD=docker compose"
) else (
    docker-compose --version >nul 2>&1
    if %errorlevel% equ 0 (
        set "COMPOSE_CMD=docker-compose"
    )
)

if "%COMPOSE_CMD%"=="" (
    echo [ERROR] Docker Compose command not found
    echo Please install or enable Docker Compose
    pause
    exit /b 1
)

echo [OK] Using compose command: %COMPOSE_CMD%
echo.

echo Starting services...
%COMPOSE_CMD% up --build -d
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start services. See errors above.
    pause
    exit /b 1
)

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

%COMPOSE_CMD% logs -f

