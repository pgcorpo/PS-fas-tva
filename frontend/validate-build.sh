#!/bin/bash
# Pre-commit validation script
# Run this before every commit to catch errors early

set -e  # Exit on any error

echo "🔍 Running pre-commit validation..."
echo ""

# Check TypeScript compilation
echo "1️⃣ Checking TypeScript..."
if command -v npx &> /dev/null; then
    npx tsc --noEmit --skipLibCheck || {
        echo "❌ TypeScript errors found!"
        exit 1
    }
    echo "✅ TypeScript OK"
else
    echo "⚠️  TypeScript check skipped (npx not available)"
fi

# Check ESLint
echo ""
echo "2️⃣ Checking ESLint..."
if command -v npx &> /dev/null; then
    npx next lint || {
        echo "❌ ESLint errors found!"
        exit 1
    }
    echo "✅ ESLint OK"
else
    echo "⚠️  ESLint check skipped (npx not available)"
fi

# Try to build (catches both TypeScript and ESLint issues)
echo ""
echo "3️⃣ Running production build..."
if command -v npm &> /dev/null; then
    npm run build || {
        echo "❌ Build failed!"
        exit 1
    }
    echo "✅ Build successful"
else
    echo "⚠️  Build check skipped (npm not available)"
fi

echo ""
echo "✅ All validation checks passed!"
echo "Safe to commit."
