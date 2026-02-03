# Phase 2 Security Scanner - Verification Tests

## Test Suite: Dangerous Tool Detection

### Test 1.1: Detect filesystem:write_file
**Objective:** Verify scanner flags dangerous file write operations

**Test Procedure:**
1. Create workflow with node:
```json
{
  "id": "node1",
  "type": "mcp",
  "data": {
    "label": "Write Config",
    "toolId": "filesystem:write_file",
    "args": { "path": "/etc/config", "content": "..." }
  }
}
```
2. Run analyzer on workflow graph
3. Check suggestions output

**Expected Result:**
- Security suggestion generated with `severity: 'high'`
- Title: "Dangerous Tool: filesystem:write_file"
- Remediation recommends human-in-the-loop approval
- CWE-250 reference included

**Status:** ⏳ Pending

---

### Test 1.2: Detect git:push
**Objective:** Verify scanner flags dangerous git push operations

**Test Procedure:**
```json
{
  "id": "node2",
  "type": "mcp",
  "data": {
    "label": "Push Changes",
    "toolId": "git:push"
  }
}
```

**Expected Result:**
- Security suggestion with `severity: 'high'`
- Warns about dangerous tool usage
- Recommends approval for git push

**Status:** ⏳ Pending

---

## Test Suite: Hardcoded Credentials Detection

### Test 2.1: Detect API Key in Prompt
**Objective:** Verify scanner detects hardcoded API keys

**Test Procedure:**
```json
{
  "id": "node3",
  "type": "agent",
  "data": {
    "label": "API Call",
    "prompt": "Call API with api_key=\"sk-1234567890abcdef\""
  }
}
```

**Expected Result:**
- Security suggestion with `severity: 'critical'`
- Title: "Hardcoded Credentials Detected"
- CWE-798 reference
- Recommends environment variables

**Status:** ⏳ Pending

---

### Test 2.2: Detect Password in Config
**Objective:** Verify scanner detects hardcoded passwords

**Test Procedure:**
```json
{
  "id": "node4",
  "type": "agent",
  "data": {
    "label": "Database Connect",
    "config": {
      "password": "MySecretPassword123"
    }
  }
}
```

**Expected Result:**
- Critical security suggestion
- Pattern matches password assignment
- Remediation suggests secure storage

**Status:** ⏳ Pending

---

### Test 2.3: Detect Bearer Token
**Objective:** Verify scanner detects hardcoded tokens

**Test Procedure:**
```json
{
  "data": {
    "prompt": "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Expected Result:**
- Critical severity suggestion
- Matches bearer token pattern
- CWE-798 reference

**Status:** ⏳ Pending

---

## Test Suite: Command Injection Pattern Detection

### Test 3.1: Detect Command Substitution
**Objective:** Verify scanner detects $(cmd) patterns

**Test Procedure:**
```json
{
  "data": {
    "prompt": "Execute command with input: $(whoami)"
  }
}
```

**Expected Result:**
- Critical severity suggestion
- Title: "Command Injection Risk"
- CWE-78 reference
- Recommends safe command execution

**Status:** ⏳ Pending

---

### Test 3.2: Detect Backtick Substitution
**Objective:** Verify scanner detects backtick patterns

**Test Procedure:**
```json
{
  "data": {
    "prompt": "Run: `cat /etc/passwd`"
  }
}
```

**Expected Result:**
- Critical severity
- Command injection warning
- Sanitization recommended

**Status:** ⏳ Pending

---

## Test Suite: Path Traversal Detection

### Test 4.1: Detect ../ in File Path
**Objective:** Verify scanner detects directory traversal

**Test Procedure:**
```json
{
  "type": "mcp",
  "data": {
    "toolId": "filesystem:read_file",
    "args": {
      "path": "../../etc/passwd"
    }
  }
}
```

**Expected Result:**
- High severity suggestion
- Title: "Path Traversal Risk"
- CWE-22 reference
- Recommends path validation

**Status:** ⏳ Pending

---

### Test 4.2: Missing Path Validation
**Objective:** Verify scanner warns about unvalidated paths

**Test Procedure:**
```json
{
  "data": {
    "toolId": "filesystem:write_file",
    "args": {
      "path": "/some/path",
      "validatePath": false
    }
  }
}
```

**Expected Result:**
- Medium severity
- "Missing Path Validation"
- Recommends adding validation

**Status:** ⏳ Pending

---

## Test Suite: Missing Input Validation

### Test 5.1: Agent Without Validation
**Objective:** Verify scanner detects missing input validation

**Test Procedure:**
```json
{
  "type": "agent",
  "data": {
    "label": "Process Input",
    "input": true,
    "variables": ["userInput"]
  }
}
```

**Expected Result:**
- Medium severity suggestion
- "Missing Input Validation"
- CWE-20 reference
- Recommends Zod schemas

**Status:** ⏳ Pending

---

## Test Suite: Network Request Safety

### Test 6.1: Unsanitized URL
**Objective:** Verify scanner detects dynamic URLs

**Test Procedure:**
```json
{
  "data": {
    "toolId": "network:http_request",
    "args": {
      "url": "https://api.example.com/${userInput}/data"
    }
  }
}
```

**Expected Result:**
- High severity
- "Unsanitized Network Request"
- CWE-918 reference
- Domain allowlist recommended

**Status:** ⏳ Pending

---

## Test Suite: SQL Injection Detection

### Test 7.1: Detect SQL Injection Pattern
**Objective:** Verify scanner detects SQL injection risks

**Test Procedure:**
```json
{
  "data": {
    "toolId": "database:execute_query",
    "args": {
      "query": "SELECT * FROM users WHERE id = 1 OR 1=1"
    }
  }
}
```

**Expected Result:**
- Critical severity
- "SQL Injection Risk"
- CWE-89 reference
- Recommends parameterized queries

**Status:** ⏳ Pending

---

## Test Suite: Security Score Calculation

### Test 8.1: Critical Issues Impact Score
**Objective:** Verify critical issues significantly reduce score

**Test Procedure:**
1. Create workflow with 1 critical issue (hardcoded password)
2. Run analyzer
3. Check securityScore

**Expected Result:**
- securityScore = 70 (100 - 30 for critical)
- criticalCount = 1
- Overall score reflects risk

**Status:** ⏳ Pending

---

### Test 8.2: Multiple Severity Levels
**Objective:** Verify score calculation with mixed severity

**Test Procedure:**
1. Create workflow with:
   - 1 critical (hardcoded creds) = -30
   - 2 high (dangerous tools) = -30
   - 1 medium (missing validation) = -5
2. Expected score: 100 - 30 - 30 - 5 = 35

**Expected Result:**
- securityScore = 35
- Breakdown shows all severity counts
- Score accurately reflects cumulative risk

**Status:** ⏳ Pending

---

## Test Suite: UI Integration

### Test 9.1: Security Section Display
**Objective:** Verify security suggestions appear in panel

**Test Procedure:**
1. Create workflow with security issue
2. Analyze workflow
3. Check SuggestionsPanel UI

**Expected Result:**
- Security section appears at top
- Red/critical styling applied
- Shield icon displayed
- Suggestions listed with severity badges

**Status:** ⏳ Pending

---

### Test 9.2: Security Score Badge
**Objective:** Verify security score displays correctly

**Test Procedure:**
1. Analyze workflow with known score
2. Check score display

**Expected Result:**
- Security score shows correct value
- Progress bar matches percentage
- Color coding: green (80+), yellow (60-80), red (<60)
- Critical issue count displayed if present

**Status:** ⏳ Pending

---

## Summary

**Total Tests:** 16
- Dangerous Tools: 2 tests
- Hardcoded Credentials: 3 tests
- Command Injection: 2 tests
- Path Traversal: 2 tests
- Input Validation: 1 test
- Network Safety: 1 test
- SQL Injection: 1 test
- Score Calculation: 2 tests
- UI Integration: 2 tests

**Pass Criteria:**
- All security patterns correctly detected
- Severity levels assigned appropriately
- CWE references included where applicable
- Security score calculation accurate
- UI displays security information clearly
