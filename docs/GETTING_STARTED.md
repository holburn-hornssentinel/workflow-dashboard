# Getting Started

Build your first AI workflow in 5 minutes.

## Installation

```bash
git clone https://github.com/holburn-hornssentinel/workflow-dashboard.git
cd workflow-dashboard
npm install
npm run dev
```

Open http://localhost:3004

## Your First Workflow

Let's create a simple workflow that takes user input, processes it with AI, and returns a result.

### Step 1: Open the Visual Builder

Click **🎨 Visual Builder** in the top navigation.

### Step 2: Add Nodes

**Method A: Drag & Drop** (Traditional)
1. Drag an **Input** node from the left palette
2. Drag an **AI Agent** node
3. Drag an **Output** node

**Method B: "Vibe Coding"** (AI-powered)
1. Type in the input: `"Create a workflow that summarizes text"`
2. Press Enter
3. The AI generates all nodes automatically

### Step 3: Connect Nodes

Click and drag from the circle on the right of one node to the left of another:
```
Input → AI Agent → Output
```

### Step 4: Configure the AI Agent

Click the **AI Agent** node and set:
- **Prompt**: `Summarize this text in 2 sentences: {{input}}`
- **Model**: Claude Sonnet (good balance of speed/quality)

### Step 5: Test It

1. Click the **Input** node
2. Enter sample text: `"Artificial intelligence is transforming software development..."`
3. Click **Run Workflow** in the top right
4. Watch the execution flow through the nodes
5. See the summary in the **Output** node

## Next Steps

### Enable AI Features

Add your API keys via **⚙️ Settings**:

```env
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
```

Get free API keys:
- [Anthropic Claude](https://console.anthropic.com/) - $5 free credit
- [Google Gemini](https://aistudio.google.com/app/apikey) - Free tier

### Explore Features

**🔧 MCP Tools** - Connect 75+ tools (file system, Git, web APIs)
- Click **🔧 MCP Tools** to browse available tools
- Use them in AI Agent prompts with `{tool:filesystem:read}`

**🧠 Memory** - Save context across workflows
- Click **🧠 Memory** to view stored memories
- Memories are automatically embedded and searchable

**🤖 Agents** - Multi-agent orchestration
- Click **🤖 Agents** to manage agent teams
- Assign tasks and track progress

### Learn More

- [Workflow Builder Guide](WORKFLOW_BUILDER.md) - All 7 node types explained
- [Configuration Guide](CONFIGURATION.md) - Advanced setup options
- [Examples](../README.md#screenshots) - See the security scanner and routing features

## Troubleshooting

**Q: "Module not found" errors**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Q: Port 3004 already in use**
```bash
# Edit next.config.mjs and change port
# Or kill the existing process:
lsof -ti:3004 | xargs kill -9
```

**Q: AI features not working**
- Check API keys in Settings
- Verify keys are valid at provider console
- Check browser console for errors (F12)

**Q: Workflows not saving**
- Workflows are stored in `~/.claude/workflows/`
- Check directory permissions: `ls -la ~/.claude/workflows/`

## Getting Help

- [GitHub Issues](https://github.com/holburn-hornssentinel/workflow-dashboard/issues) - Report bugs or request features
- [Security Issues](../SECURITY.md) - Report vulnerabilities privately
