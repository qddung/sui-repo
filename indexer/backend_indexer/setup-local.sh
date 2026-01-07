#!/bin/bash
# Prisma Local Setup Script for Linux/Mac
# This script helps you set up Prisma locally

echo "=== Prisma Local Setup ==="
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "✓ .env file exists"
else
    echo "⚠ .env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✓ Created .env file. Please update DATABASE_URL with your PostgreSQL credentials."
    else
        echo "✗ .env.example not found. Please create .env manually."
        exit 1
    fi
fi

# Check if node_modules exists
if [ -d node_modules ]; then
    echo "✓ node_modules exists"
else
    echo "⚠ Installing dependencies..."
    npm install
    echo "✓ Dependencies installed"
fi

echo ""
echo "Next steps:"
echo "1. Make sure PostgreSQL is running locally"
echo "2. Update .env file with your DATABASE_URL"
echo "3. Run: npm run prisma:generate"
echo "4. Run: npm run prisma:migrate"
echo "5. (Optional) Run: npm run prisma:studio"
echo ""

