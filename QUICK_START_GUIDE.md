# 🚀 Quick Start Guide: Secure AI Agent Platform

## Table of Contents
- [First Time Setup](#first-time-setup)
- [Security Features](#security-features)
- [Budget Management](#budget-management)
- [Permission System](#permission-system)
- [API Reference](#api-reference)

---

## First Time Setup

### 1. Generate API Key

```bash
# Generate secure API key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Configure Environment

Create `.env.local`:
```bash
# Required for production
DASHBOARD_API_KEY=your-generated-key-here

# Optional: Require auth in development
REQUIRE_AUTH_IN_DEV=false
```

### 3. Test Installation

```bash
# Start development server
npm run dev

# In another terminal, test API
curl http://localhost:3004/api/router/config \
  -H "X-API-Key: your-api-key"
```

---

## Security Features

### Automatic Security Scanning

Every workflow is automatically scanned for:
- 🔴 Hardcoded credentials
- 🟠 Command injection risks
- 🟡 Path traversal attempts
- 🟢 Missing input validation

**View Results:**
- Open workflow in builder
- Check right panel → Security section
- Security score: 0-100 (higher = safer)

### Security Suggestions Example

```json
{
  "type": "security",
  "severity": "critical",
  "title": "Hardcoded Credentials Detected",
  "description": "Node 'API Call' contains hardcoded API key",
  "remediation": "Use environment variables instead",
  "cwe": "CWE-798"
}
```

### What's Protected

✅ **Command Injection:** All shell commands use argument arrays
✅ **Model Validation:** Only allowlisted models accepted
✅ **API Authentication:** All routes require valid API key in production
✅ **MCP Validation:** Tool calls validated against schemas
✅ **YAML Safety:** Safe parsing prevents deserialization attacks

---

## Budget Management

### Set Your Budget

1. Navigate to Budget Dashboard (or use API)
2. Set daily limit (e.g., $5.00)
3. Choose period: daily/weekly/monthly
4. Click "Save Budget Settings"

### How Routing Works

| Task Type | Preferred Model | Cost per 1K tokens | Fallback |
|-----------|----------------|-------------------|----------|
| Complex reasoning | Claude Opus | $0.09 | Sonnet |
| General coding | Claude Sonnet | $0.018 | Gemini Pro |
| Simple formatting | Gemini Flash | $0.000375 | Ollama |
| Data analysis | Gemini Pro | $0.00625 | Sonnet |

### Budget States

**Green (< 80%):** All models available
```
Used: $3.20 / $5.00 (64%)
Status: ✅ All models available
```

**Yellow (80-100%):** Cheaper models preferred
```
Used: $4.50 / $5.00 (90%)
Status: ⚠️ Approaching limit - using cheaper models
```

**Red (> 100%):** Free models only
```
Used: $5.20 / $5.00 (104%)
Status: 🔴 Budget exceeded - using Ollama (free)
```

### Monitor Spending

**API:**
```bash
curl http://localhost:3004/api/router/usage?period=day \
  -H "X-API-Key: your-key"
```

**Response:**
```json
{
  "budgetStatus": {
    "used": 3.45,
    "limit": 5.00,
    "remaining": 1.55,
    "percentUsed": 69,
    "projectedEndOfPeriod": 4.80
  },
  "breakdown": {
    "byModel": {
      "claude-sonnet": 2.10,
      "gemini-flash": 0.35
    }
  }
}
```

### Export Usage Data

**Via UI:**
1. Open Budget Dashboard
2. Click "Export" button
3. Save JSON file

**Via API:**
```bash
curl http://localhost:3004/api/router/usage \
  -H "X-API-Key: your-key" > usage-data.json
```

---

## Permission System

### Permission Levels

Configure for each tool:

**Auto:** Execute immediately
```typescript
setPermissionLevel('filesystem:read_file', 'auto');
```

**Notify:** Log but don't block
```typescript
setPermissionLevel('network:http_request', 'notify');
```

**Confirm:** Show approval dialog
```typescript
setPermissionLevel('filesystem:write_file', 'confirm');
```

**Block:** Reject immediately
```typescript
setPermissionLevel('git:force_push', 'block');
```

### Default Permissions

Pre-configured dangerous tools:
- `filesystem:delete_file` → **Confirm**
- `filesystem:write_file` → **Confirm**
- `git:push` → **Confirm**
- `git:force_push` → **Block**
- `database:execute_query` → **Confirm**

### Approval Workflow

1. **Tool call triggered** → Permission check
2. **Modal appears** (if level = confirm)
   - Shows risk level and details
   - 30-second countdown timer
3. **User decides:**
   - ✅ Approve → Tool executes
   - ❌ Deny → Error thrown
   - Check "Remember" → Future auto-approved/blocked

### Risk Levels

| Level | Color | Examples |
|-------|-------|----------|
| Critical | 🔴 Red | delete, drop, path traversal |
| High | 🟠 Orange | write, execute, push |
| Medium | 🟡 Yellow | network, read |
| Low | 🟢 Green | standard operations |

### View Approval Queue

**UI:** Navigate to Approval Queue page

**Features:**
- See all pending approvals
- Quick approve/deny buttons
- View full details
- Request history (last 50)

### Remember Choices

**Effect:**
- ✅ Approved + Remember → Future calls execute immediately
- ❌ Denied + Remember → Future calls blocked automatically

**Clear remembered choices:**
```typescript
const { config } = usePermissionsStore();
config.rememberedChoices.clear();
```

---

## API Reference

### Execute Endpoint

**POST /api/execute**

Protected route for executing prompts with safety checks.

```bash
curl -X POST http://localhost:3004/api/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d '{
    "prompt": "Write a function to reverse a string",
    "model": "claude-sonnet-4-5-20250929",
    "workingDirectory": "/home/user/project"
  }'
```

**Validation:**
- ✅ Prompt: 1-10,000 chars
- ✅ Model: Must be in allowlist
- ✅ Working directory: Must be safe path

---

### Routed Completion

**POST /api/router/complete**

Intelligent routing based on task complexity and budget.

```bash
curl -X POST http://localhost:3004/api/router/complete \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d '{
    "prompt": "Explain quantum computing",
    "taskType": "reasoning",
    "estimatedComplexity": "high",
    "requiresReasoning": true,
    "estimatedTokens": 2000
  }'
```

**Parameters:**
- `prompt` (required): The prompt to execute
- `taskType` (optional): routing hint (reasoning/coding/formatting/analysis)
- `estimatedComplexity` (optional): low/medium/high
- `requiresReasoning` (optional): boolean
- `requiresSpeed` (optional): boolean
- `estimatedTokens` (optional): for cost estimation

**Response:**
```json
{
  "selectedModel": {
    "model": "claude-opus-4-5-20251101",
    "maxTokens": 4096,
    "temperature": 0.7,
    "capabilities": ["reasoning", "coding", "analysis", "complex-tasks"]
  },
  "estimatedCost": 0.045,
  "budgetStatus": {
    "used": 2.30,
    "limit": 5.00,
    "remaining": 2.70,
    "percentUsed": 46
  },
  "executionPlan": {
    "taskType": "reasoning",
    "complexity": "high",
    "reasoning": "Selected claude-opus based on high complexity and reasoning requirement"
  }
}
```

---

### MCP Tool Call

**POST /api/mcp/call**

Call MCP tools with validation and permission checks.

```bash
curl -X POST http://localhost:3004/api/mcp/call \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d '{
    "toolId": "filesystem:read_file",
    "args": {
      "path": "/home/user/config.json"
    }
  }'
```

**Validation:**
- ✅ Tool ID format: `server:tool`
- ✅ Args match tool's inputSchema
- ✅ Required fields present
- ✅ Permission check before execution

---

### Router Configuration

**GET /api/router/config**

Get current router configuration.

```bash
curl http://localhost:3004/api/router/config \
  -H "X-API-Key: your-key"
```

**POST /api/router/config**

Update router configuration.

```bash
curl -X POST http://localhost:3004/api/router/config \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d '{
    "budgetLimit": 10.0,
    "budgetPeriod": "week",
    "rules": [
      {
        "id": "custom-rule",
        "taskType": "translation",
        "preferredModel": "gemini-2.5-flash",
        "fallbackModel": "ollama/llama3.1"
      }
    ]
  }'
```

---

### Usage Statistics

**GET /api/router/usage**

Get usage statistics and budget status.

```bash
# Today's usage
curl http://localhost:3004/api/router/usage?period=day \
  -H "X-API-Key: your-key"

# This week's usage
curl http://localhost:3004/api/router/usage?period=week \
  -H "X-API-Key: your-key"
```

**POST /api/router/usage**

Record a usage event (for tracking).

```bash
curl -X POST http://localhost:3004/api/router/usage \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d '{
    "model": "claude-sonnet-4-5-20250929",
    "inputTokens": 1500,
    "outputTokens": 800,
    "taskType": "coding"
  }'
```

---

## Common Tasks

### Add Custom Routing Rule

**Via UI:**
1. Open Model Routing Panel
2. Click "Add Rule"
3. Fill in:
   - Task Type: `translation`
   - Preferred Model: `gemini-2.5-flash`
   - Fallback: `ollama/llama3.1`
4. Click "Add Rule"

**Via API:**
```bash
curl -X POST http://localhost:3004/api/router/config \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d '{
    "rules": [
      {
        "id": "translation-rule",
        "taskType": "translation",
        "preferredModel": "gemini-2.5-flash",
        "fallbackModel": "ollama/llama3.1"
      }
    ]
  }'
```

### Check Security Score

**Via UI:**
1. Open workflow in builder
2. Check Suggestions Panel (right side)
3. Look for Security section at top
4. Security Score badge shows 0-100

**Programmatically:**
```typescript
import { analyzeWorkflow } from '@/lib/suggestions/analyzer';

const result = await analyzeWorkflow(graph);
console.log('Security Score:', result.securityScore);
console.log('Critical Issues:',
  result.suggestions
    .filter(s => s.type === 'security' && s.severity === 'critical')
    .length
);
```

### Configure Tool Permission

**Via Store:**
```typescript
import { usePermissionsStore } from '@/stores/permissionsStore';

const { setPermissionLevel } = usePermissionsStore();

// Set filesystem:delete_file to require confirmation
setPermissionLevel('filesystem:delete_file', 'confirm');

// Block force push completely
setPermissionLevel('git:force_push', 'block');

// Auto-approve read operations
setPermissionLevel('filesystem:read_file', 'auto');
```

---

## Troubleshooting

### Problem: 401 Unauthorized

**Cause:** Missing or invalid API key

**Solution:**
```bash
# Check API key is set
echo $DASHBOARD_API_KEY

# Or in .env.local
cat .env.local | grep DASHBOARD_API_KEY

# Make sure to include header in requests
-H "X-API-Key: your-api-key-here"
```

---

### Problem: Budget Exceeded Error

**Cause:** Daily/weekly/monthly limit reached

**Solution:**
```bash
# Check current budget status
curl http://localhost:3004/api/router/usage \
  -H "X-API-Key: your-key"

# Option 1: Increase limit
# Via UI: Budget Dashboard → Update budget

# Option 2: Wait for period reset
# Daily: Resets at midnight
# Weekly: Resets on Sunday midnight
# Monthly: Resets on 1st of month

# Option 3: Use free model
# Ollama is always available regardless of budget
```

---

### Problem: Permission Denied for Tool

**Cause:** Tool is blocked or approval denied

**Solution:**
```typescript
// Check permission level
const { toolPermissions } = usePermissionsStore();
const permission = toolPermissions.get('toolId');
console.log('Level:', permission?.level);

// Update permission if needed
setPermissionLevel('toolId', 'confirm'); // or 'auto'

// Clear remembered denials
config.rememberedChoices.delete('toolId');
```

---

### Problem: Security Score Low

**Cause:** Workflow contains security issues

**Solution:**
1. Check Security section in Suggestions Panel
2. Review each security suggestion
3. Follow remediation guidance:
   - Remove hardcoded credentials → Use env vars
   - Add input validation → Use Zod schemas
   - Validate file paths → Check for `..`
   - Sanitize URLs → Use allowlist
4. Re-analyze workflow
5. Score should improve after fixes

---

## Best Practices

### ✅ Security
- Never commit `.env.local` with API keys
- Rotate API keys periodically
- Use `confirm` level for dangerous operations
- Review security suggestions before deployment
- Keep security score > 80

### ✅ Budgets
- Start with low daily limit ($2-5)
- Monitor projected spending
- Export usage data monthly
- Use routing rules to optimize costs
- Set up cost alerts (future feature)

### ✅ Permissions
- Default to `confirm` for new tools
- Use `block` for truly dangerous operations
- Be cautious with "Remember" checkbox
- Review approval queue regularly
- Audit request history monthly

---

## Next Steps

1. ✅ Set up API authentication
2. ✅ Configure budget limits
3. ✅ Review default permissions
4. ✅ Test security scanner on sample workflow
5. ✅ Run verification tests
6. 🚀 Deploy to production

---

## Resources

- Implementation Details: `/IMPLEMENTATION_COMPLETE.md`
- Test Suites: `/tests/`
- Security Patterns: `/types/security.ts`
- Model Pricing: `/lib/ai/cost-tracker.ts`

---

**🎉 You're ready to build secure AI workflows!**
