# Workflow Builder Guide

Complete guide to building AI workflows with the visual builder.

## Node Types

### 1. Input Node
Receives data to start the workflow.

**Configuration:**
- **Label**: Display name
- **Type**: `text`, `json`, `file`
- **Default Value**: Optional starting value

**Example Use Cases:**
- User input form
- File upload
- API webhook data

### 2. AI Agent Node
Processes data using AI models.

**Configuration:**
- **Prompt**: Instructions for the AI (supports `{{variables}}`)
- **Model**: Choose from:
  - `gemini-flash` - Fast, cheap ($0.10/1M tokens)
  - `claude-sonnet` - Balanced ($3/1M tokens)
  - `claude-opus` - Complex reasoning ($15/1M tokens)
- **Temperature**: 0.0 (deterministic) to 1.0 (creative)
- **Max Tokens**: Response length limit

**Prompt Variables:**
```
Use {{input}} to reference the previous node's output.
Use {{memory:key}} to recall stored memories.
Use {tool:mcp:filesystem:read} to call MCP tools.
```

**Example:**
```
Analyze this code for security issues: {{input}}

Focus on:
- SQL injection (CWE-89)
- Command injection (CWE-78)
- Path traversal (CWE-22)

Return JSON: {"vulnerabilities": [...], "severity": "..."}
```

### 3. API Call Node
Makes HTTP requests to external services.

**Configuration:**
- **URL**: Endpoint (supports `{{variables}}`)
- **Method**: GET, POST, PUT, DELETE
- **Headers**: JSON object
- **Body**: Request payload (POST/PUT)

**Example: GitHub API**
```json
{
  "url": "https://api.github.com/repos/{{owner}}/{{repo}}",
  "method": "GET",
  "headers": {
    "Accept": "application/vnd.github+json",
    "Authorization": "Bearer {{github_token}}"
  }
}
```

### 4. Transform Node
Manipulates data with JavaScript.

**Configuration:**
- **Code**: JavaScript function that processes input

**Example: Parse JSON**
```javascript
const data = JSON.parse(input);
return {
  name: data.user.name,
  email: data.user.email,
  created: new Date(data.timestamp).toISOString()
};
```

**Available Globals:**
- `input` - Previous node's output
- `JSON`, `Math`, `Date` - Standard JavaScript
- `fetch` - HTTP requests (async/await supported)

### 5. Conditional Node
Branches execution based on conditions.

**Configuration:**
- **Condition**: JavaScript expression (returns boolean)
- **True Path**: Executes if condition is true
- **False Path**: Executes if condition is false

**Examples:**
```javascript
// Check if sentiment is positive
input.sentiment > 0.5

// Validate required fields
input.email && input.email.includes('@')

// Check API response status
input.status === 200

// Complex logic
input.user.role === 'admin' && input.action === 'delete'
```

### 6. Loop Node
Repeats execution for arrays or iterations.

**Configuration:**
- **Array**: `{{variable}}` containing array
- **Item Variable**: Name for current item (e.g., `item`)
- **Max Iterations**: Safety limit

**Example: Process Multiple Files**
```
Array: {{files}}
Item Variable: file
Max Iterations: 100

Inside loop:
AI Agent → Prompt: "Analyze {{file}} for errors"
```

**Example: Batch API Calls**
```
Array: {{user_ids}}
Item Variable: user_id

API Call → URL: https://api.example.com/users/{{user_id}}
```

### 7. Output Node
Displays or returns results.

**Configuration:**
- **Format**: `text`, `json`, `html`
- **Display**: How to show the result

**Example Use Cases:**
- Show summary to user
- Return API response
- Generate report

## Common Workflow Patterns

### Pattern 1: API Data Processing
```
Input (API params) → API Call → Transform (clean data) → AI Agent (analyze) → Output
```

**Use Case:** Fetch GitHub issues, extract key info, summarize with AI

### Pattern 2: Conditional Logic
```
Input → AI Agent (classify) → Conditional
                               ├─ True → Output (urgent)
                               └─ False → Output (normal)
```

**Use Case:** Triage support tickets by urgency

### Pattern 3: Batch Processing
```
Input (file list) → Loop
                    └─ AI Agent (process file) → Collect Results
                                                 └─ Output
```

**Use Case:** Analyze multiple code files for vulnerabilities

### Pattern 4: Multi-Agent Pipeline
```
Input → AI Agent (research) → AI Agent (draft) → AI Agent (review) → Output
```

**Use Case:** Generate blog post: research → write → edit

### Pattern 5: Error Handling
```
Input → API Call → Conditional (check status)
                   ├─ Success → Transform → Output
                   └─ Error → AI Agent (suggest fix) → Output
```

**Use Case:** Robust API integration with fallback

## Keyboard Shortcuts

- **Ctrl+Z** - Undo
- **Ctrl+Y** - Redo
- **Delete** - Remove selected node
- **Ctrl+C** - Copy node
- **Ctrl+V** - Paste node
- **Space+Drag** - Pan canvas
- **Mouse Wheel** - Zoom

## View Modes

### 2D View (Default)
- Clean, fast interface
- Best for complex workflows
- Traditional flowchart style

### 3D View
- Immersive visualization
- Shows execution flow with animations
- Great for presentations

Toggle with the **3D** button in top right.

## Import/Export

### Export Workflow
1. Click **Export** button
2. Choose format: `JSON` or `YAML`
3. Save to file

### Import Workflow
1. Click **Import** button
2. Paste JSON/YAML or upload file
3. Workflow loads instantly

**Example YAML:**
```yaml
name: "Code Analyzer"
nodes:
  - id: input-1
    type: input
    config:
      label: "Code to analyze"
  - id: agent-1
    type: ai-agent
    config:
      prompt: "Find security issues in: {{input}}"
      model: "claude-sonnet"
connections:
  - from: input-1
    to: agent-1
```

## Security Scanner

The built-in scanner detects vulnerabilities as you build:

**Detected Issues:**
- **CWE-78**: Command Injection
- **CWE-22**: Path Traversal
- **CWE-798**: Hardcoded Credentials
- **CWE-89**: SQL Injection
- **CWE-79**: Cross-Site Scripting (XSS)

**Severity Levels:**
- 🔴 **Critical** - Immediate security risk
- 🟠 **High** - Significant vulnerability
- 🟡 **Medium** - Potential issue
- ✅ **Passed** - No issues detected

Click any issue for:
- Code snippet showing the problem
- CWE reference link
- Suggested fix

## Budget Control

### Multi-Model Routing
The router automatically selects the cheapest model that can handle your task:

- Simple tasks (summarize, extract) → Gemini Flash
- Moderate tasks (analyze, classify) → Claude Sonnet
- Complex tasks (reason, plan) → Claude Opus

### Budget Limits
Set in **⚙️ Settings → Budget & Usage**:
- Daily/Weekly/Monthly limits
- Actions when limit hit:
  - **Throttle** - Use only cheap models
  - **Block** - Stop all AI calls
  - **Notify** - Alert but continue

## Best Practices

### 1. Start Simple
Build incrementally. Test each node before adding the next.

### 2. Use Descriptive Names
```
❌ "Agent 1", "Agent 2"
✅ "Research Agent", "Writing Agent", "Review Agent"
```

### 3. Handle Errors
Always check API responses with Conditional nodes.

### 4. Optimize Costs
- Use Gemini Flash for simple tasks
- Set appropriate max_tokens limits
- Cache results in Memory nodes

### 5. Version Control
Export workflows to Git for version history:
```bash
mkdir workflows-backup
cp ~/.claude/workflows/*.yaml workflows-backup/
git add workflows-backup/
git commit -m "Save workflow versions"
```

## Advanced Features

### Memory Integration
Store and recall context across workflows:

```
AI Agent → Prompt: "Remember this analysis: {{input}}"
          {tool:memory:store:analysis_123}

Later workflow:
AI Agent → Prompt: "Recall the previous analysis"
          {tool:memory:recall:analysis_123}
```

### MCP Tool Calling
Use 75+ tools in AI prompts:

```
AI Agent → Prompt: "List files in this directory: {{path}}"
          {tool:mcp:filesystem:list}

AI Agent → Prompt: "Get the latest commit message"
          {tool:mcp:git:log}
```

### Agent Handoffs
Transfer control between specialized agents:

```
Research Agent → Gathers information
     ↓
Writing Agent → Drafts content
     ↓
Review Agent → Checks quality
     ↓
Output → Final result
```

Each agent has different:
- Temperature (creative vs precise)
- Model (speed vs reasoning)
- System prompt (role/expertise)

## Examples

See the [screenshots in README](../README.md#screenshots) for real-world workflows.
