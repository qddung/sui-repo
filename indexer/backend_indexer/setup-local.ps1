# Prisma Local Setup Script for Windows PowerShell
# This script helps you set up Prisma locally

Write-Host "=== Prisma Local Setup ===" -ForegroundColor Green
Write-Host ""

# Check if .env exists
if (Test-Path .env) {
    Write-Host "✓ .env file exists" -ForegroundColor Green
} else {
    Write-Host "⚠ .env file not found. Creating from .env.example..." -ForegroundColor Yellow
    if (Test-Path .env.example) {
        Copy-Item .env.example .env
        Write-Host "✓ Created .env file. Please update DATABASE_URL with your PostgreSQL credentials." -ForegroundColor Green
    } else {
        Write-Host "✗ .env.example not found. Please create .env manually." -ForegroundColor Red
        exit 1
    }
}

# Check if node_modules exists
if (Test-Path node_modules) {
    Write-Host "✓ node_modules exists" -ForegroundColor Green
} else {
    Write-Host "⚠ Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Make sure PostgreSQL is running locally" -ForegroundColor White
Write-Host "2. Update .env file with your DATABASE_URL" -ForegroundColor White
Write-Host "3. Run: npm run prisma:generate" -ForegroundColor White
Write-Host "4. Run: npm run prisma:migrate" -ForegroundColor White
Write-Host "5. (Optional) Run: npm run prisma:studio" -ForegroundColor White
Write-Host ""

