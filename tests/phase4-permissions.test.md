# Phase 4 Human-in-the-Loop Permissions - Verification Tests

## Test Suite: Permission Levels

### Test 1.1: Auto Permission - No Prompt
**Objective:** Verify 'auto' level allows execution without approval

**Test Procedure:**
1. Set toolPermission: filesystem:read_file → level='auto'
2. Call MCP tool: filesystem:read_file
3. Check execution

**Expected Result:**
- Tool executes immediately
- No permission modal displayed
- No approval request created
- Executes without user interaction

**Status:** ⏳ Pending

---

### Test 1.2: Notify Permission - Log Only
**Objective:** Verify 'notify' level logs but doesn't block

**Test Procedure:**
1. Set tool permission: network:http_request → level='notify'
2. Call tool
3. Check console logs

**Expected Result:**
- Tool executes without blocking
- Console log: "Notification: Executing network:http_request"
- No modal shown
- User informed but not prompted

**Status:** ⏳ Pending

---

### Test 1.3: Confirm Permission - Request Approval
**Objective:** Verify 'confirm' level shows approval modal

**Test Procedure:**
1. Set tool permission: filesystem:write_file → level='confirm'
2. Call tool
3. Observe UI

**Expected Result:**
- PermissionModal appears
- Shows tool details and risk assessment
- Blocks execution until approved/denied
- Request added to pendingRequests

**Status:** ⏳ Pending

---

### Test 1.4: Block Permission - Reject Immediately
**Objective:** Verify 'block' level prevents execution

**Test Procedure:**
1. Set tool permission: git:force_push → level='block'
2. Attempt to call tool
3. Check result

**Expected Result:**
- Error thrown immediately
- Error message: "Permission denied: git:force_push is blocked by security policy"
- No execution occurs
- No modal displayed

**Status:** ⏳ Pending

---

## Test Suite: Approval Workflow

### Test 2.1: Approve Request - Execution Proceeds
**Objective:** Verify approval allows execution

**Test Procedure:**
1. Set filesystem:delete_file → level='confirm'
2. Call tool (triggers modal)
3. Click "Approve" in modal
4. Verify execution

**Expected Result:**
- Tool executes after approval
- Request status changes to 'approved'
- Request moved to history
- Tool call completes successfully

**Status:** ⏳ Pending

---

### Test 2.2: Deny Request - Execution Blocked
**Objective:** Verify denial prevents execution

**Test Procedure:**
1. Trigger confirmation request
2. Click "Deny" in modal
3. Check result

**Expected Result:**
- Error thrown: "Permission denied: User did not approve..."
- Request status = 'denied'
- Moved to history with reason
- Tool never executes

**Status:** ⏳ Pending

---

### Test 2.3: Timeout - Auto-Deny
**Objective:** Verify requests timeout after 30 seconds

**Test Procedure:**
1. Trigger confirmation request
2. Wait 30+ seconds without responding
3. Check status

**Expected Result:**
- Request auto-denied after timeout
- Status = 'timeout'
- Error thrown to caller
- Timeout warning shown in UI

**Status:** ⏳ Pending

---

## Test Suite: Remember Choice

### Test 3.1: Remember Approval
**Objective:** Verify "remember" makes future auto-approve

**Test Procedure:**
1. Request approval for filesystem:write_file
2. Check "Remember this choice"
3. Click "Approve"
4. Call same tool again

**Expected Result:**
- First call: shows modal
- Choice remembered in store
- Second call: executes immediately (auto level)
- No modal on subsequent calls

**Status:** ⏳ Pending

---

### Test 3.2: Remember Denial
**Objective:** Verify remembered denial blocks future calls

**Test Procedure:**
1. Request approval
2. Check "Remember this choice"
3. Click "Deny"
4. Try same tool again

**Expected Result:**
- First call: shows modal
- Denial remembered
- Second call: immediately blocked
- No modal shown (treated as 'block')

**Status:** ⏳ Pending

---

### Test 3.3: Clear Remembered Choice
**Objective:** Verify remembered choices can be reset

**Test Procedure:**
1. Remember a choice
2. Clear via store/UI
3. Call tool again

**Expected Result:**
- Remembered choice removed from store
- Next call prompts for approval again
- Returns to default permission level

**Status:** ⏳ Pending

---

## Test Suite: Risk Assessment

### Test 4.1: Critical Risk - Delete Operation
**Objective:** Verify delete operations marked critical

**Test Procedure:**
1. Trigger approval for filesystem:delete_file
2. Check modal risk display

**Expected Result:**
- Risk level: CRITICAL
- Red color coding
- Reasons include: "Destructive operation that cannot be undone"
- Mitigations suggest backups

**Status:** ⏳ Pending

---

### Test 4.2: High Risk - Write Operation
**Objective:** Verify write operations marked high risk

**Test Procedure:**
1. Trigger filesystem:write_file
2. Check risk assessment

**Expected Result:**
- Risk level: HIGH
- Orange color
- Reason: "Can modify system state"
- Mitigation: "Review operation details carefully"

**Status:** ⏳ Pending

---

### Test 4.3: Medium Risk - Network Request
**Objective:** Verify network operations marked medium

**Test Procedure:**
1. Trigger network:http_request
2. Check risk

**Expected Result:**
- Risk level: MEDIUM
- Yellow color
- Reason: "Makes external network requests"
- Mitigation: "Verify target URL is trusted"

**Status:** ⏳ Pending

---

### Test 4.4: Path Traversal - Critical Override
**Objective:** Verify path traversal escalates risk

**Test Procedure:**
1. Call filesystem:write_file with path="../../../etc/config"
2. Check risk assessment

**Expected Result:**
- Risk level: CRITICAL (escalated from HIGH)
- Reason includes: "Path contains directory traversal"
- Red critical alert

**Status:** ⏳ Pending

---

## Test Suite: Approval Queue UI

### Test 5.1: Display Pending Requests
**Objective:** Verify pending approvals shown in queue

**Test Procedure:**
1. Trigger 3 approval requests
2. Open ApprovalQueue component
3. Check display

**Expected Result:**
- All 3 requests listed
- Sorted by time (newest first)
- Each shows: toolId, risk level, time requested
- Countdown timer shows seconds remaining

**Status:** ⏳ Pending

---

### Test 5.2: Quick Approve/Deny
**Objective:** Verify quick action buttons work

**Test Procedure:**
1. View pending request in queue
2. Click quick approve (✓) button
3. Verify result

**Expected Result:**
- Request immediately approved
- Removed from pending list
- Moved to history
- Tool execution proceeds

**Status:** ⏳ Pending

---

### Test 5.3: View Details
**Objective:** Verify "View Details" opens full modal

**Test Procedure:**
1. Click "View Details" on request
2. Check modal

**Expected Result:**
- Full PermissionModal opens
- Shows all request details
- Risk assessment displayed
- Can approve/deny with reason

**Status:** ⏳ Pending

---

### Test 5.4: Countdown Timer
**Objective:** Verify timer counts down and highlights urgency

**Test Procedure:**
1. Create request
2. Watch timer in queue

**Expected Result:**
- Timer shows seconds remaining (starts at 30)
- Updates every second
- Turns red when ≤10 seconds
- Auto-denies at 0

**Status:** ⏳ Pending

---

## Test Suite: Permission Modal UI

### Test 6.1: Display Request Details
**Objective:** Verify modal shows all relevant information

**Test Procedure:**
1. Trigger approval request
2. Examine modal content

**Expected Result:**
- Tool ID displayed prominently
- Operation type shown
- Arguments formatted as JSON
- Request timestamp included
- Risk level with color coding

**Status:** ⏳ Pending

---

### Test 6.2: Safety Checklist
**Objective:** Verify mitigations displayed

**Test Procedure:**
1. Trigger high/critical risk request
2. Check safety checklist section

**Expected Result:**
- Mitigation list displayed
- Each item starts with warning icon
- Actionable advice provided
- User can review before approving

**Status:** ⏳ Pending

---

### Test 6.3: Optional Reason Field
**Objective:** Verify reason can be provided

**Test Procedure:**
1. Enter reason: "Emergency fix needed"
2. Approve request
3. Check history

**Expected Result:**
- Reason saved with approval
- Displayed in request history
- Helps with audit trail

**Status:** ⏳ Pending

---

### Test 6.4: Keyboard Navigation
**Objective:** Verify modal is accessible

**Test Procedure:**
1. Open modal
2. Use Tab to navigate
3. Use Enter/Escape

**Expected Result:**
- Tab cycles through inputs and buttons
- Enter approves (if focused on approve)
- Escape closes modal (denies)
- Accessible to keyboard-only users

**Status:** ⏳ Pending

---

## Test Suite: Request History

### Test 7.1: Record Approved Requests
**Objective:** Verify approved requests in history

**Test Procedure:**
1. Approve several requests
2. Check history section

**Expected Result:**
- All approvals listed
- Status: "Approved" with green checkmark
- Timestamp of approval shown
- Limited to recent 50 entries

**Status:** ⏳ Pending

---

### Test 7.2: Record Denied Requests
**Objective:** Verify denied requests tracked

**Test Procedure:**
1. Deny requests
2. Check history

**Expected Result:**
- Denials shown with red X icon
- Reason displayed if provided
- Status: "Denied"

**Status:** ⏳ Pending

---

### Test 7.3: Clear History
**Objective:** Verify history can be cleared

**Test Procedure:**
1. Build up history
2. Click "Clear History"
3. Verify cleared

**Expected Result:**
- All history entries removed
- Empty state message shown
- Pending requests not affected

**Status:** ⏳ Pending

---

## Test Suite: Integration with MCP Client

### Test 8.1: Permission Check Before Execution
**Objective:** Verify MCP client checks permissions

**Test Procedure:**
1. Configure permission for tool
2. Call via MCP client
3. Verify check occurs

**Expected Result:**
- checkPermission() called before tool execution
- Permission level determined
- Appropriate action taken (block/confirm/auto/notify)

**Status:** ⏳ Pending

---

### Test 8.2: Async Approval Wait
**Objective:** Verify MCP client waits for approval

**Test Procedure:**
1. Set tool to 'confirm' level
2. Call via MCP client
3. Approve after 5 seconds

**Expected Result:**
- Tool call pauses at permission check
- Waits for user approval
- Resumes execution after approval
- Returns result to caller

**Status:** ⏳ Pending

---

### Test 8.3: Store Integration
**Objective:** Verify permissions store properly integrated

**Test Procedure:**
1. Call MCP client with permissionsStore parameter
2. Verify store methods called
3. Check state updates

**Expected Result:**
- Store's checkPermission() invoked
- requestPermission() creates request
- pendingRequests updated
- State synchronized

**Status:** ⏳ Pending

---

## Summary

**Total Tests:** 28
- Permission Levels: 4 tests
- Approval Workflow: 3 tests
- Remember Choice: 3 tests
- Risk Assessment: 4 tests
- Approval Queue UI: 4 tests
- Permission Modal UI: 4 tests
- Request History: 3 tests
- MCP Integration: 3 tests

**Pass Criteria:**
- All permission levels behave correctly
- Approval/denial workflow functions properly
- Remember choice persists across sessions
- Risk assessment accurate and helpful
- UI displays all necessary information
- History tracking works correctly
- MCP client integration seamless
