#!/bin/bash

# Security validation script for environment variables
# Run before committing to verify no secrets are leaked

set -e

echo "═══════════════════════════════════════════════════════════════════"
echo "🔐 SECURITY VALIDATION SCRIPT"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

ERRORS=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check .env files are not tracked by git
echo "📋 Test 1: Checking .env files are not tracked by git..."
if git status --short | grep -E "\.env$|\.env\.docker$" > /dev/null; then
    echo -e "${RED}❌ FAIL: .env files found in git status!${NC}"
    git status --short | grep -E "\.env$|\.env\.docker$"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ PASS: No .env files in git status${NC}"
fi
echo ""

# Test 2: Check .gitignore is working
echo "📋 Test 2: Checking .gitignore is working..."
IGNORED_FILES=(
    "backend/.env"
    "analytics/.env"
    ".env"
    "backend/.env.docker"
)
for file in "${IGNORED_FILES[@]}"; do
    if git check-ignore "$file" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $file is ignored${NC}"
    else
        echo -e "${RED}❌ FAIL: $file is NOT ignored!${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# Test 3: Search for real secrets in .example files
echo "📋 Test 3: Checking for real secrets in .example files..."
REAL_SECRETS=(
    "18034783"
    "0x04a7912db14c316ebe613e67dafb614cfaf6a7b0f31527e8aca1753f6c5edbce"
    "49e9f9b154dd406397b14aca8c93544c"
)

FOUND_SECRETS=0
for secret in "${REAL_SECRETS[@]}"; do
    if grep -r "$secret" backend/.env.example analytics/.env.example .env.example 2>/dev/null; then
        echo -e "${RED}❌ FAIL: Real secret found in .example file!${NC}"
        FOUND_SECRETS=$((FOUND_SECRETS + 1))
    fi
done

if [ $FOUND_SECRETS -eq 0 ]; then
    echo -e "${GREEN}✅ PASS: No real secrets in .example files${NC}"
else
    ERRORS=$((ERRORS + FOUND_SECRETS))
fi
echo ""

# Test 4: Check .example files are staged (if modified)
echo "📋 Test 4: Checking .example files are ready to commit..."
if git diff --cached --name-only | grep "\.env\.example$" > /dev/null; then
    echo -e "${GREEN}✅ .example files are staged for commit${NC}"
elif git diff --name-only | grep "\.env\.example$" > /dev/null; then
    echo -e "${YELLOW}⚠️  WARNING: .example files modified but not staged${NC}"
else
    echo -e "${GREEN}✅ No .example files modified${NC}"
fi
echo ""

# Test 5: Check .dockerignore file structure
echo "📋 Test 5: Checking .dockerignore files exist..."
DOCKERIGNORE_FILES=(
    "backend/.dockerignore"
    "analytics/.dockerignore"
)
for file in "${DOCKERIGNORE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file exists${NC}"
    else
        echo -e "${RED}❌ FAIL: $file is missing!${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# Test 6: Check token synchronization
echo "📋 Test 6: Checking token synchronization..."
BACKEND_TOKEN=$(grep "ANALYTICS_WEBHOOK_TOKEN=" backend/.env.docker 2>/dev/null | cut -d= -f2)
ANALYTICS_TOKEN=$(grep "ANALYTICS_WEBHOOK_TOKEN=" analytics/.env 2>/dev/null | cut -d= -f2)

if [ -z "$BACKEND_TOKEN" ] || [ -z "$ANALYTICS_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Could not read tokens (files might not exist yet)${NC}"
elif [ "$BACKEND_TOKEN" = "$ANALYTICS_TOKEN" ]; then
    echo -e "${GREEN}✅ PASS: Tokens are synchronized${NC}"
else
    echo -e "${RED}❌ FAIL: Tokens DO NOT match!${NC}"
    echo "   Backend: $BACKEND_TOKEN"
    echo "   Analytics: $ANALYTICS_TOKEN"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Final result
echo "═══════════════════════════════════════════════════════════════════"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED - SAFE TO COMMIT!${NC}"
    echo "═══════════════════════════════════════════════════════════════════"
    exit 0
else
    echo -e "${RED}❌ $ERRORS ERROR(S) FOUND - DO NOT COMMIT!${NC}"
    echo "═══════════════════════════════════════════════════════════════════"
    echo ""
    echo "Please fix the errors above before committing."
    exit 1
fi
