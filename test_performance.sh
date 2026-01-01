#!/bin/bash
# Phase 1 Performance Testing Script

echo "🧪 Phase 1 Performance Testing"
echo "=============================="
echo ""

# Check if backend is running
echo "1️⃣ Checking if backend is running..."
if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "   ✅ Backend is running on port 8000"
else
    echo "   ❌ Backend is NOT running"
    echo "   📝 Please start the backend:"
    echo "      cd backend"
    echo "      source venv/bin/activate  # If using venv"
    echo "      uvicorn main:app --reload"
    exit 1
fi
echo ""

# Test gzip compression
echo "2️⃣ Testing gzip compression..."
GZIP_HEADER=$(curl -s -I -H "Accept-Encoding: gzip" http://localhost:8000/api/health | grep -i "content-encoding: gzip")
if [ ! -z "$GZIP_HEADER" ]; then
    echo "   ✅ Gzip compression is ENABLED"
    echo "      $GZIP_HEADER"
else
    echo "   ❌ Gzip compression is NOT working"
    echo "   📝 Check backend/main.py for GZipMiddleware"
fi
echo ""

# Check API health
echo "3️⃣ Testing API health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:8000/api/health)
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo "   ✅ API health check passed"
    echo "      Response: $HEALTH_RESPONSE"
else
    echo "   ❌ API health check failed"
    echo "      Response: $HEALTH_RESPONSE"
fi
echo ""

# Test response sizes (requires authentication for /api/habits)
echo "4️⃣ Checking response compression..."
echo "   Testing /api/health endpoint:"
UNCOMPRESSED_SIZE=$(curl -s -w "%{size_download}" http://localhost:8000/api/health -o /dev/null)
COMPRESSED_SIZE=$(curl -s -H "Accept-Encoding: gzip" -w "%{size_download}" http://localhost:8000/api/health -o /dev/null)

echo "      Uncompressed: ${UNCOMPRESSED_SIZE} bytes"
echo "      Compressed: ${COMPRESSED_SIZE} bytes"

if [ "$COMPRESSED_SIZE" -lt "$UNCOMPRESSED_SIZE" ]; then
    REDUCTION=$(( (UNCOMPRESSED_SIZE - COMPRESSED_SIZE) * 100 / UNCOMPRESSED_SIZE ))
    echo "   ✅ Compression working: ${REDUCTION}% size reduction"
else
    echo "   ⚠️  Response may be too small to compress (< 1000 bytes)"
fi
echo ""

# Summary
echo "=============================="
echo "📊 Testing Summary:"
echo "=============================="
echo ""
echo "✅ Tests Complete!"
echo ""
echo "Next steps:"
echo "1. Open your browser and navigate to your app"
echo "2. Open DevTools (F12) → Network tab"
echo "3. Check that API requests show 'content-encoding: gzip'"
echo "4. Measure page load times and compare with before"
echo "5. Test all CRUD operations (create/edit/delete)"
echo ""
echo "For detailed testing instructions, see: TESTING_PHASE1.md"
echo ""
