# Configuration Guide

Complete setup and configuration reference for Workflow Dashboard.

## API Keys

### Anthropic Claude

**Get Your Key:**
1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up (free $5 credit)
3. Navigate to API Keys
4. Create a new key
5. Copy it immediately (shown only once)

**Add to Workflow Dashboard:**

Option A: Via Settings UI
1. Click **⚙️ Settings**
2. Paste key in "Anthropic API Key" field
3. Click Save

Option B: Via `.env.local`
```bash
echo "ANTHROPIC_API_KEY=sk-ant-api03-..." >> .env.local
```

**Available Models:**
- `claude-opus-4` - Most capable ($15/1M tokens)
- `claude-sonnet-4` - Balanced ($3/1M tokens)
- `claude-haiku-4` - Fast ($0.25/1M tokens)

### Google Gemini

**Get Your Key:**
1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key

**Add to Workflow Dashboard:**

Via Settings UI:
1. Click **⚙️ Settings**
2. Paste in "Gemini API Key" field
3. Click Save

Or `.env.local`:
```bash
echo "GEMINI_API_KEY=AIza..." >> .env.local
```

**Available Models:**
- `gemini-2.0-flash` - Best value ($0.10/1M tokens)
- `gemini-2.0-pro` - Advanced ($2.50/1M tokens)

### Testing Your Keys

After adding keys:
1. Go to **🎨 Visual Builder**
2. Add an AI Agent node
3. Set prompt: `Say hello`
4. Click Run
5. You should see a response

If it fails, check:
- Key is pasted correctly (no extra spaces)
- Key is valid (check provider console)
- Browser console for errors (F12)

## Model Context Protocol (MCP)

MCP provides 75+ tools for file system, Git, APIs, and more.

### Available Tool Categories

**File System**
- `filesystem:read` - Read file contents
- `filesystem:write` - Write files
- `filesystem:list` - List directory
- `filesystem:search` - Search files by pattern

**Git Operations**
- `git:status` - Check repo status
- `git:diff` - View changes
- `git:commit` - Create commits
- `git:log` - View history
- `git:branch` - Manage branches

**Web & APIs**
- `fetch:get` - HTTP GET request
- `fetch:post` - HTTP POST request
- `fetch:search` - Web search

**Database**
- `sqlite:query` - SQL queries
- `sqlite:schema` - View tables

**Utilities**
- `brave:search` - Brave web search
- `github:api` - GitHub API calls

### Using MCP Tools in Workflows

**Example 1: Read File**
```
AI Agent Node:
Prompt: Read the package.json file
        {tool:mcp:filesystem:read:package.json}
```

**Example 2: Git Status**
```
AI Agent Node:
Prompt: Check if there are uncommitted changes
        {tool:mcp:git:status}
```

**Example 3: Web Search**
```
AI Agent Node:
Prompt: Search for "TypeScript best practices"
        {tool:mcp:brave:search}
```

### MCP Server Configuration

MCP servers run in the background and connect tools to the dashboard.

**Check Active Servers:**
1. Click **🔧 MCP Tools**
2. See list of connected servers
3. Green = active, Red = disconnected

**Add Custom MCP Server:**

Edit `~/.claude/mcp.json`:
```json
{
  "mcpServers": {
    "custom-server": {
      "command": "node",
      "args": ["/path/to/server.js"],
      "env": {
        "API_KEY": "your_key"
      }
    }
  }
}
```

Restart the dashboard for changes to take effect.

**Popular MCP Servers:**
- [@modelcontextprotocol/server-filesystem](https://github.com/modelcontextprotocol/servers) - File operations
- [@modelcontextprotocol/server-git](https://github.com/modelcontextprotocol/servers) - Git integration
- [@modelcontextprotocol/server-brave-search](https://github.com/modelcontextprotocol/servers) - Web search
- [@modelcontextprotocol/server-sqlite](https://github.com/modelcontextprotocol/servers) - Database queries

## Settings Reference

### Budget & Usage Tab

**Budget Limits:**
- Daily Limit: Maximum spend per day
- Weekly Limit: Maximum spend per week
- Monthly Limit: Maximum spend per month

**When Limit Reached:**
- **Throttle** - Switch to cheaper models only
- **Block** - Stop all AI operations
- **Notify** - Alert but continue

**Current Usage:**
- View spending chart (last 7 days)
- Total tokens used
- Cost breakdown by model

### AI Models Tab

**Model Routing:**
- **Auto** - Let router choose based on complexity
- **Manual** - Always use selected model

**Model Presets:**
- **Planner** (Opus, temp 0.7) - Strategic thinking
- **Executor** (Sonnet, temp 0.2) - Precise execution
- **Reviewer** (Sonnet, temp 0.1) - Critical analysis
- **Researcher** (Flash, temp 0.5) - Fast research
- **Coordinator** (Sonnet, temp 0.3) - Workflow orchestration

**Advanced Settings:**
- Temperature: 0.0 (deterministic) to 1.0 (creative)
- Max Tokens: Response length limit
- Top P: Nucleus sampling (0.0 to 1.0)

### Security Tab

**Security Scanning:**
- Enable/disable real-time scanning
- Set severity threshold (show critical only, or all)

**Permission System:**
- **Require Approval For:**
  - File writes
  - Shell commands
  - Git commits
  - API calls to external services

**Risk Assessment:**
- Automatic risk scoring (1-10)
- Block high-risk operations (8+)

### Performance Tab

**Caching:**
- Enable prompt caching (saves cost on repeated prompts)
- Cache TTL: How long to keep cached responses

**Execution:**
- Parallel node execution (run independent nodes simultaneously)
- Max concurrent requests (prevent rate limiting)

**Memory:**
- Vector store type: LanceDB (default)
- Embedding model: text-embedding-3-small
- Memory retention: 30 days (auto-cleanup)

## Environment Variables

Full list of supported variables for `.env.local`:

```bash
# AI Provider API Keys
ANTHROPIC_API_KEY=sk-ant-api03-...
GEMINI_API_KEY=AIza...
OPENAI_API_KEY=sk-proj-...  # Optional, for embeddings

# Server Configuration
PORT=3004
NODE_ENV=development
LOG_LEVEL=info  # debug | info | warn | error

# Storage
WORKFLOWS_DIR=/custom/path/to/workflows
MEMORY_DIR=/custom/path/to/memory

# Security
ENABLE_SECURITY_SCAN=true
REQUIRE_APPROVAL_FOR_FILE_WRITES=true
REQUIRE_APPROVAL_FOR_SHELL_COMMANDS=true

# Budget Limits
DAILY_BUDGET_USD=10.00
WEEKLY_BUDGET_USD=50.00
MONTHLY_BUDGET_USD=200.00
BUDGET_LIMIT_ACTION=throttle  # throttle | block | notify

# MCP Configuration
MCP_CONFIG_PATH=/custom/path/to/mcp.json
```

## Workflows Storage

Workflows are saved as YAML files in `~/.claude/workflows/`

### Custom Workflows Directory

Change the location:

**Option 1: Environment Variable**
```bash
export WORKFLOWS_DIR=/custom/path
npm run dev
```

**Option 2: Settings UI**
1. Click **⚙️ Settings**
2. Go to "Advanced" tab
3. Set "Workflows Directory"
4. Restart server

### Workflow File Format

Example: `~/.claude/workflows/code-analyzer.yaml`

```yaml
name: Code Security Analyzer
description: Analyzes code for security vulnerabilities
difficulty: medium

nodes:
  input-1:
    type: input
    label: Code to analyze
    position: { x: 0, y: 0 }

  agent-1:
    type: ai-agent
    label: Security Scanner
    config:
      prompt: |
        Analyze this code for security issues:
        {{input}}

        Check for:
        - SQL injection (CWE-89)
        - Command injection (CWE-78)
        - Path traversal (CWE-22)
      model: claude-sonnet
      temperature: 0.1
    position: { x: 300, y: 0 }

  output-1:
    type: output
    label: Security Report
    position: { x: 600, y: 0 }

edges:
  - id: e1
    source: input-1
    target: agent-1
  - id: e2
    source: agent-1
    target: output-1
```

## Troubleshooting

### API Key Issues

**Error: "Invalid API key"**
- Check key has no extra spaces
- Verify key is active in provider console
- Try regenerating the key

**Error: "Rate limit exceeded"**
- You've hit provider's rate limit
- Wait 1 minute and try again
- Upgrade to paid tier for higher limits

**Error: "Insufficient credits"**
- Your free credits are exhausted
- Add payment method to provider account
- Or use a different model/provider

### MCP Tool Issues

**Tools not appearing:**
1. Check **🔧 MCP Tools** shows servers as connected (green)
2. Restart the dashboard: `npm run dev`
3. Check MCP config: `cat ~/.claude/mcp.json`
4. Check server logs in browser console (F12)

**Permission denied on file operations:**
- MCP filesystem server needs read/write permissions
- Check directory permissions: `ls -la`
- Run server with appropriate user/group

### Workflow Issues

**Workflow won't save:**
- Check `~/.claude/workflows/` directory exists
- Verify write permissions: `ls -la ~/.claude/workflows/`
- Check disk space: `df -h`

**Workflow fails to execute:**
- Check browser console (F12) for errors
- Verify all nodes are properly connected
- Check API keys are configured
- Test each node individually

**"Vibe coding" not generating workflows:**
- Ensure Anthropic API key is set
- Check prompt is clear and specific
- Try simpler prompts first: "Create a text summarizer"

### Performance Issues

**Slow UI:**
- Disable 3D view (use 2D mode)
- Clear browser cache
- Reduce number of nodes on canvas

**Slow AI responses:**
- Use faster models (Gemini Flash, Haiku)
- Reduce max_tokens setting
- Check your internet connection

**High memory usage:**
- Large workflows consume more memory
- Restart browser periodically
- Close unused browser tabs

### Database/Memory Issues

**Memory search not working:**
- Check LanceDB directory: `~/.claude/memory/`
- Verify embedding model is accessible
- Clear and rebuild index if corrupted

**Old memories not deleted:**
- Check retention policy in Settings
- Manually clear: `rm -rf ~/.claude/memory/*`
- Restart dashboard to rebuild

## Docker Deployment

Run Workflow Dashboard in Docker:

### Quick Start

```bash
docker-compose up -d
```

Access at http://localhost:3004

### Custom Configuration

Edit `docker-compose.yml`:

```yaml
services:
  workflow-dashboard:
    image: workflow-dashboard:latest
    ports:
      - "3004:3004"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - DAILY_BUDGET_USD=10.00
    volumes:
      - ./workflows:/root/.claude/workflows
      - ./memory:/root/.claude/memory
    restart: unless-stopped
```

Then:
```bash
docker-compose up -d
```

### Build Custom Image

```bash
docker build -t workflow-dashboard:latest .
docker run -p 3004:3004 \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -v $(pwd)/workflows:/root/.claude/workflows \
  workflow-dashboard:latest
```

## Production Deployment

### Security Checklist

- [ ] Use HTTPS (not HTTP)
- [ ] Set `NODE_ENV=production`
- [ ] Restrict CORS origins
- [ ] Enable rate limiting
- [ ] Use strong API keys
- [ ] Set budget limits
- [ ] Enable security scanning
- [ ] Require approvals for dangerous operations
- [ ] Regular backups of workflows directory
- [ ] Monitor usage and costs

### Recommended Setup

**Reverse Proxy (nginx):**
```nginx
server {
    listen 443 ssl http2;
    server_name workflows.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Environment:**
```bash
NODE_ENV=production
PORT=3004
LOG_LEVEL=warn
ENABLE_SECURITY_SCAN=true
REQUIRE_APPROVAL_FOR_FILE_WRITES=true
MONTHLY_BUDGET_USD=500.00
BUDGET_LIMIT_ACTION=block
```

**Systemd Service:**
```ini
[Unit]
Description=Workflow Dashboard
After=network.target

[Service]
Type=simple
User=workflow
WorkingDirectory=/opt/workflow-dashboard
ExecStart=/usr/bin/npm start
Restart=always
Environment="NODE_ENV=production"
EnvironmentFile=/opt/workflow-dashboard/.env.local

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl enable workflow-dashboard
sudo systemctl start workflow-dashboard
```

## Getting Help

- [GitHub Issues](https://github.com/holburn-hornssentinel/workflow-dashboard/issues)
- [Security Issues](../SECURITY.md)
- [Getting Started Guide](GETTING_STARTED.md)
- [Workflow Builder Guide](WORKFLOW_BUILDER.md)
