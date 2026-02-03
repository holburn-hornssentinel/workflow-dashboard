# Phase 1 Security Fixes - Verification Tests

## Test Suite: Command Injection Prevention

### Test 1.1: Command Injection via Backticks
**Objective:** Verify that backtick command substitution is blocked

**Test Procedure:**
```bash
curl -X POST http://localhost:3004/api/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "prompt": "test`whoami`injection",
    "model": "claude-sonnet-4-5-20250929"
  }'
```

**Expected Result:**
- Request succeeds (backticks are safely passed as argument, not executed)
- No command substitution occurs
- Prompt is treated as literal string

**Status:** ⏳ Pending

---

### Test 1.2: Command Injection via $()
**Objective:** Verify that $() command substitution is blocked

**Test Procedure:**
```bash
curl -X POST http://localhost:3004/api/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "prompt": "test$(whoami)injection",
    "model": "claude-sonnet-4-5-20250929"
  }'
```

**Expected Result:**
- Request succeeds ($(cmd) is safely passed as argument)
- No command substitution occurs
- Prompt treated as literal string

**Status:** ⏳ Pending

---

### Test 1.3: Command Injection via Semicolon
**Objective:** Verify that semicolon command chaining is blocked

**Test Procedure:**
```bash
curl -X POST http://localhost:3004/api/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "prompt": "test; whoami; echo done",
    "model": "claude-sonnet-4-5-20250929"
  }'
```

**Expected Result:**
- Request succeeds (semicolons are part of prompt string)
- No command chaining occurs
- Entire string passed as single argument

**Status:** ⏳ Pending

---

## Test Suite: Model Validation

### Test 2.1: Invalid Model Rejection
**Objective:** Verify that non-allowlisted models are rejected

**Test Procedure:**
```bash
curl -X POST http://localhost:3004/api/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "prompt": "test prompt",
    "model": "malicious-model-name"
  }'
```

**Expected Result:**
- HTTP 400 Bad Request
- Error message: "Invalid model. Must be one of the allowed models."
- Request rejected before execution

**Status:** ⏳ Pending

---

### Test 2.2: Model Injection Attack
**Objective:** Verify that model parameter cannot be used for injection

**Test Procedure:**
```bash
curl -X POST http://localhost:3004/api/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "prompt": "test",
    "model": "claude-sonnet-4-5-20250929; whoami"
  }'
```

**Expected Result:**
- HTTP 400 Bad Request
- Zod validation error (not in allowlist)
- No command execution

**Status:** ⏳ Pending

---

## Test Suite: API Authentication

### Test 3.1: Missing API Key
**Objective:** Verify requests without API key are rejected in production

**Test Procedure:**
```bash
NODE_ENV=production curl -X POST http://localhost:3004/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "test",
    "model": "claude-sonnet-4-5-20250929"
  }'
```

**Expected Result:**
- HTTP 401 Unauthorized
- Error message: "Invalid or missing API key"
- Request blocked by middleware

**Status:** ⏳ Pending

---

### Test 3.2: Invalid API Key
**Objective:** Verify requests with wrong API key are rejected

**Test Procedure:**
```bash
NODE_ENV=production curl -X POST http://localhost:3004/api/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: wrong-key" \
  -d '{
    "prompt": "test",
    "model": "claude-sonnet-4-5-20250929"
  }'
```

**Expected Result:**
- HTTP 401 Unauthorized
- Error message: "Invalid or missing API key"
- Timing-safe comparison prevents timing attacks

**Status:** ⏳ Pending

---

### Test 3.3: Development Mode Bypass
**Objective:** Verify API key not required in development

**Test Procedure:**
```bash
NODE_ENV=development curl -X POST http://localhost:3004/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "test",
    "model": "claude-sonnet-4-5-20250929"
  }'
```

**Expected Result:**
- Request succeeds without API key
- Development mode allows unauthenticated access
- Middleware skips auth check

**Status:** ⏳ Pending

---

## Test Suite: MCP Call Validation

### Test 4.1: Invalid Tool ID Format
**Objective:** Verify malformed tool IDs are rejected

**Test Procedure:**
```bash
curl -X POST http://localhost:3004/api/mcp/call \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "toolId": "invalid_format_no_colon",
    "args": {}
  }'
```

**Expected Result:**
- HTTP 400 Bad Request
- Error: "Invalid tool ID format. Expected format: server:tool"
- Validation prevents malformed calls

**Status:** ⏳ Pending

---

### Test 4.2: Missing Required Arguments
**Objective:** Verify missing required args are caught

**Test Procedure:**
```bash
curl -X POST http://localhost:3004/api/mcp/call \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "toolId": "filesystem:write_file",
    "args": {
      "content": "test"
    }
  }'
```

**Expected Result:**
- HTTP 400 Bad Request (if 'path' is required)
- Error: "Missing required field: path"
- Schema validation enforced

**Status:** ⏳ Pending

---

## Test Suite: YAML Parsing Safety

### Test 5.1: Safe YAML Load
**Objective:** Verify yaml.safeLoad() is used

**Test Procedure:**
1. Inspect `/lib/workflow-parser.ts` source code
2. Search for all YAML parsing calls

**Expected Result:**
- All instances use `yaml.safeLoad()` or `yaml.load()` (js-yaml 4.x safeLoad is deprecated but load is safe)
- No use of unsafe parsing methods
- Lines 64 and 300 verified

**Status:** ⏳ Pending

---

## Test Suite: Spawn vs Exec Verification

### Test 6.1: Verify spawn() Usage
**Objective:** Confirm exec() replaced with spawn()

**Test Procedure:**
1. Inspect `/app/api/execute/route.ts`
2. Search for `exec(` and `spawn(`

**Expected Result:**
- No calls to `exec()` or `execAsync()`
- All command execution uses `spawn()`
- Arguments passed as array, not string

**Status:** ⏳ Pending

---

## Summary

**Total Tests:** 11
- Command Injection: 3 tests
- Model Validation: 2 tests
- API Authentication: 3 tests
- MCP Validation: 2 tests
- YAML Safety: 1 test

**Pass Criteria:**
- All command injection attempts must fail to execute shell commands
- Invalid models must be rejected before execution
- Authentication must be enforced in production
- MCP calls must be validated against schemas
- YAML parsing must use safe methods
