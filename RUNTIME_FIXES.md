# Runtime Fixes - Critical Issues Resolved

## Issues Fixed

### ✅ Issue 1: MCP Connect 500 Errors (FIXED)

**Problem:** All MCP server connections were failing with 500 Internal Server Error

**Root Cause:** Server configurations set environment variables to empty strings (`process.env.GITHUB_TOKEN || ''`), causing validation to fail when users tried to connect to unconfigured servers.

**Fix Applied:**
- Modified `/lib/mcp/tool-registry.ts`
- Changed to only include `env` objects when environment variables are actually set
- Servers without credentials now have `enabled: false` with no env object

**Result:** ✅ Filesystem, Git, and Fetch servers should now connect successfully

---

### ✅ Issue 2: React Flow Container Size Error (FIXED)

**Problem:**
```
[React Flow]: The React Flow parent container needs a width and a height to render the graph.
```

**Root Cause:** The React Flow parent container needed explicit dimensions. While it had `flex-1`, it was missing critical CSS properties for proper flex sizing.

**Fix Applied:**
- Modified `/app/builder/page.tsx:358`
- Added `min-h-0` to parent flex container (fixes common flex overflow issue)
- Added `w-full h-full` to ReactFlow wrapper div

**Before:**
```jsx
<div className="flex-1 flex overflow-hidden">
  <div className="flex-1 relative transition-all" ref={reactFlowWrapper}>
```

**After:**
```jsx
<div className="flex-1 flex overflow-hidden min-h-0">
  <div className="flex-1 relative transition-all w-full h-full" ref={reactFlowWrapper}>
```

**Result:** ✅ React Flow should now render with proper dimensions, enabling:
- Drag and drop nodes from palette
- Node selection and editing
- Creating connections between nodes
- All canvas interactions

---

### ⚠️ Issue 3: Vibe Generate 500 Error (EXPECTED BEHAVIOR)

**Problem:** `/api/vibe/generate` returns 500 error

**Diagnosis:** This is **expected** if you don't have API keys configured. The error should show:
- "ANTHROPIC_API_KEY not configured" if using Claude
- "GEMINI_API_KEY not configured" if using Gemini

**To Fix:** Add API keys to `.env.local`:
```bash
# In /home/horns/workflow-dashboard/.env.local
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
# OR
GEMINI_API_KEY=your-actual-gemini-key-here
```

Then restart the dev server:
```bash
npm run dev
```

**Note:** The error message should be displayed in a red banner at the top of the builder page when you try to use Vibe Code.

---

### ⚠️ Issue 4: THREE.WebGLRenderer Context Lost (KNOWN LIMITATION)

**Problem:**
```
THREE.WebGLRenderer: Context Lost
```

**Diagnosis:** This happens when switching between 2D and 3D views multiple times, especially in development mode with React Strict Mode enabled.

**Workaround:**
- Refresh the page if 3D view stops working
- Primarily use 2D view for node editing
- Use 3D view for visualization only

**Future Fix:** Consider implementing proper Three.js cleanup in `useEffect` cleanup functions in the Builder3DCanvas component.

---

## Testing Checklist

### ✅ Test MCP Servers (Should Work Now)
```bash
1. Navigate to http://localhost:3004/tools
2. Click "File System" category
   ✅ Should connect successfully (no 500 error)
3. Click "Git" category
   ✅ Should connect successfully
4. Click "Web Fetch" category
   ✅ Should connect successfully
5. Click "GitHub" category (without API key)
   ❌ Should show error: "Missing required environment variable: GITHUB_PERSONAL_ACCESS_TOKEN"
   ✅ This is correct behavior
```

### ✅ Test Builder Operations (Should Work Now)

#### Drag & Drop
```
1. Navigate to http://localhost:3004/builder
2. Drag "Agent" node from left palette
3. Drop onto canvas
✅ Node should appear at drop location
✅ Canvas should show "X nodes, Y edges" counter update
```

#### Node Selection
```
1. Click on a node
✅ Node should highlight
✅ Property panel should open on right side
```

#### Node Connections
```
1. Drag from one node's edge handle
2. Connect to another node
✅ Connection line should appear between nodes
✅ Edge counter should update
```

#### Undo/Redo
```
1. Add a node
2. Click Undo button (↶)
✅ Node should disappear
3. Click Redo button (↷)
✅ Node should reappear
```

#### Import/Export
```
1. Add some nodes
2. Click "Export YAML"
✅ File should download
3. Click "Import YAML" and select file
✅ Workflow should load
```

### ⚠️ Test Vibe Code (Requires API Key)

**Without API Key:**
```
1. Click "Vibe Code" button
2. Enter description: "Process user signup workflow"
3. Click Generate
❌ Should show error banner: "ANTHROPIC_API_KEY not configured"
✅ This is correct behavior - prompts you to add key
```

**With API Key:**
```
1. Add ANTHROPIC_API_KEY to .env.local
2. Restart dev server
3. Click "Vibe Code" button
4. Enter description: "Process user signup workflow"
5. Click Generate
✅ Should generate nodes and edges
✅ Workflow should appear on canvas
```

---

## Files Modified

### Critical Fixes
1. **lib/mcp/tool-registry.ts**
   - Complete rewrite of `getDefaultMCPServers()`
   - Conditional env object inclusion
   - ~35 lines changed

2. **app/builder/page.tsx**
   - Line 358: Added `min-h-0` to parent container
   - Line 363: Added `w-full h-full` to ReactFlow wrapper
   - ~2 lines changed

### Previously Fixed (Earlier Session)
3. **app/api/router/complete/route.ts**
   - Fixed import from deleted usage route
   - Added CostTracker instantiation

---

## Build Status

```bash
npm run build
✅ Compiled successfully
✅ TypeScript passes
✅ All 31 pages generated
✅ Zero errors
```

---

## Quick Start After Fixes

```bash
# 1. Restart dev server (picks up tool-registry changes)
npm run dev

# 2. Test builder operations
Open http://localhost:3004/builder
Try dragging nodes - should work now!

# 3. Test MCP connections
Open http://localhost:3004/tools
Click filesystem/git/fetch - should connect!

# 4. Add API key for Vibe Code (optional)
echo 'ANTHROPIC_API_KEY=sk-ant-your-key-here' >> .env.local
npm run dev  # Restart after adding key
```

---

## Known Limitations

### WebGL Context Loss
- **Symptom:** 3D view stops rendering after switching views
- **Impact:** Low - 2D view is primary interface
- **Workaround:** Refresh page
- **Permanent Fix:** Needs Three.js cleanup implementation

### Vibe Code Without API Key
- **Symptom:** 500 error when trying to generate
- **Impact:** Medium - feature unavailable until key added
- **Fix:** Add ANTHROPIC_API_KEY or GEMINI_API_KEY to .env.local

---

## What Should Work Now

✅ **Node Palette**
- Drag and drop all node types
- Nodes appear at correct position
- Visual feedback on drag over

✅ **Canvas Interactions**
- Click to select nodes
- Drag nodes to reposition
- Create connections between nodes
- Zoom and pan

✅ **Property Panel**
- Opens when node selected
- Edit node properties
- Changes save to node

✅ **Undo/Redo**
- All actions are undoable
- History persists correctly

✅ **Import/Export**
- Export workflow to YAML
- Import workflow from YAML

✅ **MCP Tools**
- Filesystem server connects
- Git server connects
- Fetch server connects
- Clear errors for unconfigured servers

✅ **View Toggle**
- Switch between 2D and 3D
- (Note: 3D may have context loss issue)

---

## If Issues Persist

### Builder still doesn't work:
1. **Hard refresh:** Ctrl+Shift+R (Cmd+Shift+R on Mac)
2. **Clear cache:** Ctrl+Shift+Delete → Clear browsing data
3. **Check console:** Look for new errors not listed here
4. **Verify dimensions:**
   ```javascript
   // In browser console on /builder page:
   document.querySelector('[class*="flex-1 relative"]').getBoundingClientRect()
   // Should show width > 0 and height > 0
   ```

### MCP still returns 500:
1. **Restart dev server:** `npm run dev`
2. **Check server logs:** Look for [MCP] prefixed errors
3. **Verify tool-registry.ts:** Confirm changes were applied
4. **Test with curl:**
   ```bash
   curl -X POST http://localhost:3004/api/mcp/connect \
     -H "Content-Type: application/json" \
     -d '{"serverName":"filesystem"}'
   ```

### Report New Issues:
If you encounter issues not listed here:
1. **Copy console errors** (F12 → Console tab)
2. **Note specific operation** that failed
3. **Check network tab** for failed requests
4. **Include error message** from any error banners
