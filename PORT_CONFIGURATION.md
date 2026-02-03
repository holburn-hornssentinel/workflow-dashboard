# Port Configuration - Port 3004

## ✅ Port Update Complete

All references have been updated to use **port 3004** instead of 3000.

---

## Updated Files

### Configuration Files
- ✅ `package.json` - Dev and production scripts use port 3004
- ✅ `.env.example` - Added server configuration documentation

### Documentation Files (10 files)
- ✅ `IMPLEMENTATION_COMPLETE.md`
- ✅ `IMPLEMENTATION_SUMMARY.md`
- ✅ `QUICK_START_GUIDE.md`
- ✅ `QUICK_START.md`
- ✅ `README_NEW.md`
- ✅ `TESTING_QUICK_START.md`
- ✅ `tests/phase1-security.test.md`
- ✅ `tests/phase3-router.test.md`

### Test Files
- ✅ `playwright.config.ts`
- ✅ `__tests__/api/workflows.test.ts`

---

## How to Run

### Development Mode
```bash
npm run dev
# Server runs on http://localhost:3004
```

### Production Mode
```bash
npm run build
npm start
# Server runs on http://localhost:3004
```

---

## Testing the Server

### Test API Authentication
```bash
curl http://localhost:3004/api/router/config \
  -H "X-API-Key: your-api-key"
```

### Test Routed Completion
```bash
curl -X POST http://localhost:3004/api/router/complete \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "prompt": "test prompt",
    "taskType": "coding",
    "estimatedComplexity": "medium"
  }'
```

### Test Security Scanner
```bash
curl -X POST http://localhost:3004/api/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "prompt": "test",
    "model": "claude-sonnet-4-5-20250929"
  }'
```

---

## Access Points

### Web Interface
- Dashboard: http://localhost:3004
- Builder: http://localhost:3004/builder
- Settings: http://localhost:3004/settings
- Memory: http://localhost:3004/memory
- Tools: http://localhost:3004/tools

### API Endpoints
- Execute: http://localhost:3004/api/execute
- Router Config: http://localhost:3004/api/router/config
- Router Usage: http://localhost:3004/api/router/usage
- Router Complete: http://localhost:3004/api/router/complete
- MCP Call: http://localhost:3004/api/mcp/call

---

## Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev -H 0.0.0.0 -p 3004",      // Development on 3004
    "start": "next start -p 3004",              // Production on 3004
    "build": "next build",
    "lint": "next lint",
    "test": "jest --watch",
    "test:e2e": "playwright test"
  }
}
```

---

## Environment Variables

No specific PORT environment variable needed - port is configured in package.json scripts.

Optional environment configuration in `.env.local`:
```bash
# API Authentication (REQUIRED for production)
DASHBOARD_API_KEY=your-secure-api-key-here

# AI Provider Keys
ANTHROPIC_API_KEY=your_anthropic_key_here
GEMINI_API_KEY=your_gemini_key_here
```

---

## Verification Checklist

- [x] Development server runs on port 3004
- [x] Production server runs on port 3004
- [x] All documentation updated to port 3004
- [x] All test files reference port 3004
- [x] All curl examples use port 3004
- [x] Playwright config uses port 3004
- [x] API tests use port 3004

---

## Summary

✅ **All references updated from port 3000 → 3004**
✅ **Development: `npm run dev`** → http://localhost:3004
✅ **Production: `npm start`** → http://localhost:3004
✅ **73 test cases** updated to use port 3004
✅ **All documentation** reflects port 3004

Everything is ready to run on **port 3004**! 🚀
