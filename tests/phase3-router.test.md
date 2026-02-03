# Phase 3 Multi-Model Router - Verification Tests

## Test Suite: Model Selection Logic

### Test 1.1: Complex Task → Claude Opus
**Objective:** Verify complex reasoning tasks route to Claude Opus

**Test Procedure:**
```bash
curl -X POST http://localhost:3004/api/router/complete \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "prompt": "Analyze this complex algorithm...",
    "taskType": "reasoning",
    "estimatedComplexity": "high",
    "requiresReasoning": true
  }'
```

**Expected Result:**
- selectedModel.model = "claude-opus-4-5-20251101"
- executionPlan.reasoning mentions complexity="high"
- estimatedCost reflects Opus pricing

**Status:** ⏳ Pending

---

### Test 1.2: Medium Task → Claude Sonnet
**Objective:** Verify medium complexity routes to Sonnet

**Test Procedure:**
```bash
curl -X POST http://localhost:3004/api/router/complete \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "prompt": "Write a function to...",
    "taskType": "coding",
    "estimatedComplexity": "medium"
  }'
```

**Expected Result:**
- selectedModel.model = "claude-sonnet-4-5-20250929"
- Balanced cost/performance choice
- Coding capability included

**Status:** ⏳ Pending

---

### Test 1.3: Simple Task → Gemini Flash
**Objective:** Verify simple tasks route to cheapest model

**Test Procedure:**
```bash
curl -X POST http://localhost:3004/api/router/complete \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "prompt": "Format this JSON",
    "taskType": "formatting",
    "estimatedComplexity": "low",
    "requiresSpeed": true
  }'
```

**Expected Result:**
- selectedModel.model = "gemini-2.5-flash"
- Lowest cost option
- Fast execution prioritized

**Status:** ⏳ Pending

---

### Test 1.4: Rule-Based Routing
**Objective:** Verify routing rules are followed

**Test Procedure:**
```bash
curl -X POST http://localhost:3004/api/router/complete \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "prompt": "Analyze data...",
    "taskType": "analysis"
  }'
```

**Expected Result:**
- Matches "data-analysis" routing rule
- preferredModel = "gemini-2.5-pro"
- Rule-based selection documented in reasoning

**Status:** ⏳ Pending

---

## Test Suite: Budget Enforcement

### Test 2.1: Within Budget - Allow Expensive Model
**Objective:** Verify expensive models allowed when within budget

**Test Procedure:**
1. Set budget: $5.00 daily, used: $0.50
2. Request with taskType="reasoning"
3. Check model selection

**Expected Result:**
- Claude Opus selected (expensive but within budget)
- budgetStatus shows remaining ~$4.50
- Request proceeds normally

**Status:** ⏳ Pending

---

### Test 2.2: Near Budget - Use Cheaper Fallback
**Objective:** Verify fallback to cheaper model near budget limit

**Test Procedure:**
1. Set budget: $5.00 daily, used: $4.80 (96%)
2. Request with expensive model preference
3. Check selection

**Expected Result:**
- Falls back to cheaper model (Gemini Flash or Ollama)
- budgetStatus shows high percentUsed
- Prevents budget overage

**Status:** ⏳ Pending

---

### Test 2.3: Budget Exceeded - Force Free Model
**Objective:** Verify free model used when budget exceeded

**Test Procedure:**
1. Set budget: $5.00 daily, used: $5.10 (102%)
2. Attempt any request
3. Check model selection

**Expected Result:**
- HTTP 429 or forces ollama/llama3.1 (free)
- Error message explains budget exceeded
- budgetStatus shows percentUsed >= 100%
- Recommendation to increase limit

**Status:** ⏳ Pending

---

## Test Suite: Cost Tracking

### Test 3.1: Record Usage Correctly
**Objective:** Verify usage recording with correct token counts

**Test Procedure:**
```bash
curl -X POST http://localhost:3004/api/router/usage \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "model": "claude-sonnet-4-5-20250929",
    "inputTokens": 1000,
    "outputTokens": 500,
    "taskType": "coding"
  }'
```

**Expected Result:**
- record.cost = (1000/1M * $3) + (500/1M * $15) = $0.0105
- budgetStatus.used increases by $0.0105
- Record appears in usage history

**Status:** ⏳ Pending

---

### Test 3.2: Model Breakdown Accuracy
**Objective:** Verify cost breakdown by model

**Test Procedure:**
1. Record usage for multiple models:
   - Claude Sonnet: 2 calls
   - Gemini Flash: 5 calls
2. GET /api/router/usage
3. Check breakdown

**Expected Result:**
- breakdown.byModel shows both models
- Costs sum correctly
- Call counts accurate

**Status:** ⏳ Pending

---

### Test 3.3: Task Type Breakdown
**Objective:** Verify cost breakdown by task type

**Test Procedure:**
1. Record usage with taskType labels
2. GET /api/router/usage
3. Check taskType breakdown

**Expected Result:**
- breakdown.byTaskType groups correctly
- Costs per task type accurate
- Helps identify expensive task categories

**Status:** ⏳ Pending

---

## Test Suite: Budget Dashboard UI

### Test 4.1: Real-Time Budget Display
**Objective:** Verify dashboard shows current budget status

**Test Procedure:**
1. Open BudgetDashboard component
2. Record some usage
3. Refresh dashboard

**Expected Result:**
- Used/limit displayed correctly
- Progress bar shows accurate percentage
- Color coding: green (<80%), yellow (80-100%), red (>100%)
- Remaining amount calculated correctly

**Status:** ⏳ Pending

---

### Test 4.2: Projected Spend Warning
**Objective:** Verify projected spending is calculated

**Test Procedure:**
1. Use $2.00 in first 8 hours of day
2. Check projected end of period

**Expected Result:**
- projectedEndOfPeriod ≈ $6.00 (extrapolated to 24h)
- Warning shown if projection > limit
- TrendingUp icon displayed

**Status:** ⏳ Pending

---

### Test 4.3: Model Cost Breakdown Chart
**Objective:** Verify pie chart shows costs per model

**Test Procedure:**
1. Use multiple models with varying costs
2. View breakdown section

**Expected Result:**
- Each model listed with cost and call count
- Percentage bars show relative cost
- Sorted by cost (highest first)

**Status:** ⏳ Pending

---

### Test 4.4: Export/Import Functionality
**Objective:** Verify usage data can be exported and imported

**Test Procedure:**
1. Record some usage
2. Click "Export" button
3. Import the downloaded JSON
4. Verify data restored

**Expected Result:**
- Export creates valid JSON file
- Import restores all records
- Budget status recalculated correctly

**Status:** ⏳ Pending

---

## Test Suite: Routing Configuration UI

### Test 5.1: Add Routing Rule
**Objective:** Verify new rules can be added via UI

**Test Procedure:**
1. Open ModelRoutingPanel
2. Click "Add Rule"
3. Fill: taskType="testing", preferredModel="gemini-2.5-flash"
4. Save rule

**Expected Result:**
- Rule appears in list
- Future requests with taskType="testing" use Gemini Flash
- Rule persisted to store

**Status:** ⏳ Pending

---

### Test 5.2: Remove Routing Rule
**Objective:** Verify rules can be deleted

**Test Procedure:**
1. Select existing rule
2. Click trash icon
3. Confirm deletion

**Expected Result:**
- Rule removed from list
- No longer applied to routing decisions
- Store updated

**Status:** ⏳ Pending

---

### Test 5.3: Update Budget Settings
**Objective:** Verify budget can be changed

**Test Procedure:**
1. Change budget limit to $10.00
2. Change period to "weekly"
3. Save

**Expected Result:**
- config.budgetLimit = 10.00
- config.budgetPeriod = "week"
- Budget status recalculated for weekly period
- Alert confirms save

**Status:** ⏳ Pending

---

## Test Suite: Fallback Behavior

### Test 6.1: Primary Model Unavailable → Fallback
**Objective:** Verify fallback model used if primary unavailable

**Test Procedure:**
1. Create rule: preferredModel="claude-opus", fallbackModel="claude-sonnet"
2. Simulate Opus unavailable (budget exceeded)
3. Request with this rule

**Expected Result:**
- Attempts claude-opus first
- Falls back to claude-sonnet
- Reasoning explains fallback

**Status:** ⏳ Pending

---

### Test 6.2: All Paid Models → Free Model
**Objective:** Verify ultimate fallback to Ollama

**Test Procedure:**
1. Exceed budget completely
2. Request any task
3. Verify fallback

**Expected Result:**
- All paid models skipped
- ollama/llama3.1 selected
- Cost = $0.00
- Warning about budget limit

**Status:** ⏳ Pending

---

## Summary

**Total Tests:** 18
- Model Selection: 4 tests
- Budget Enforcement: 3 tests
- Cost Tracking: 3 tests
- Budget Dashboard: 4 tests
- Configuration UI: 3 tests
- Fallback Behavior: 2 tests

**Pass Criteria:**
- Model selection follows complexity heuristics
- Routing rules applied correctly
- Budget limits strictly enforced
- Cost tracking accurate to 4 decimal places
- Dashboard displays real-time data
- Configuration changes persist
- Fallback cascade works correctly
