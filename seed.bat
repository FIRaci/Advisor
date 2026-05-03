@echo off
setlocal
echo.
echo ========================================
echo    Seeding Database
echo ========================================
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
    exit /b 1
)

echo [OK] Using compose command: %COMPOSE_CMD%
echo Ensuring backend service is running...
%COMPOSE_CMD% up -d db backend >nul
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start db/backend services
    exit /b 1
)

echo Running backend seed script...
%COMPOSE_CMD% exec -T backend npm run db:seed
if %errorlevel% neq 0 (
    echo [ERROR] Seed failed
    exit /b 1
)

echo.
echo [OK] Seed complete.
echo Demo credentials:
echo   Email: demo@advisor.ai
echo   Password: demo123
endlocal
