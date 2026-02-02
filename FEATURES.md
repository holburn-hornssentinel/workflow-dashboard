# 📖 Features Guide

Comprehensive guide to all features in Workflow Dashboard.

## Table of Contents
- [AI Providers](#ai-providers)
- [Visual Workflow Builder](#visual-workflow-builder)
- [Vibe Coding](#vibe-coding)
- [Multi-Agent Orchestration](#multi-agent-orchestration)
- [Memory System](#memory-system)
- [MCP Tools](#mcp-tools)
- [QA Testing](#qa-testing)

## AI Providers

### Dual Provider Support

Switch between Claude and Gemini for different use cases:

**Claude Sonnet 4.5**
- Complex reasoning tasks
- Long-form content generation
- Code review and analysis
- Strategic planning

**Gemini 2.5 Flash**
- Fast responses
- Simple task execution
- Quick iterations
- Cost-effective operations

### Configuration

1. Navigate to `/settings`
2. Add your API keys
3. Test connections
4. Restart server

## Visual Workflow Builder

### Creating Workflows

**Node Types:**
- **Start**: Entry point
- **Agent**: AI-powered task execution
- **Tool**: MCP tool integration
- **Condition**: Branching logic
- **Loop**: Repetitive tasks
- **Parallel**: Concurrent execution
- **End**: Exit point

### Operations

- **Drag & Drop**: Add nodes from palette
- **Connect**: Click and drag between nodes
- **Edit**: Click node to open properties
- **Undo/Redo**: Ctrl+Z / Ctrl+Y
- **Delete**: Select node and press Delete

### Import/Export

Export to YAML:
```yaml
name: My Workflow
version: '1.0'
description: Created with Visual Builder
steps:
  step1:
    name: Greeting Agent
    prompt: Welcome the user
```

Import from YAML to restore workflows.

## Vibe Coding

### Natural Language Workflow Generation

Describe what you want in plain English:

**Examples:**
- "Create an agent that summarizes PDFs"
- "Build a workflow that monitors my website"
- "Make an agent that reviews code commits"

### How It Works

1. Enter description
2. Select AI provider (Claude or Gemini)
3. Click "Generate Workflow"
4. Review generated workflow
5. Export or execute

### Voice Input

- Click microphone icon
- Speak your workflow description
- Works in Chrome and Edge

## Multi-Agent Orchestration

### Agent Roles

**Planner**
- Strategic planning
- Task decomposition
- Dependency analysis

**Executor**
- Task execution
- Tool usage
- Progress reporting

**Reviewer**
- Quality assurance
- Error detection
- Feedback generation

**Researcher**
- Information gathering
- Source synthesis
- Insight generation

**Coordinator**
- Workflow management
- Agent routing
- Status monitoring

### Agent Communication

Agents can:
- Hand off tasks
- Share context
- Request assistance
- Report status

## Memory System

### Memory Types

**Conversations**: Message history
**Facts**: Learned information
**Preferences**: User settings
**Context**: Session state

### Storage

**Local (LanceDB)**
- Embedded vector database
- Works offline
- No API key needed
- Stored in `./data/lancedb`

**Cloud (Pinecone)** - Coming Soon
- Scalable vector storage
- Team collaboration
- Requires API key

### Usage

Memory is automatically:
- Stored during interactions
- Retrieved for context
- Persisted across sessions

## MCP Tools

### Available Tools

75+ tools including:

**File System**
- Read/write files
- Directory operations
- File search

**Git**
- Repository operations
- Commit history
- Branch management

**Web**
- HTTP requests
- Web scraping
- API calls

**APIs**
- GitHub integration
- Slack messaging
- Custom integrations

### Tool Browser

Access at `/tools` to:
- Browse available tools
- View tool documentation
- Test tool connections

## QA Testing

### Automated Testing

Built-in test suite with:
- API endpoint tests
- Integration tests
- End-to-end workflows

### Running Tests

**Via UI**: Navigate to `/qa` and click "Run All Tests"

**Via API**:
```bash
curl -X POST http://localhost:3004/api/qa/run
```

### Test Coverage

- **API Tests**: 8 tests covering all endpoints
- **Integration Tests**: 3 tests for workflows
- **Coverage**: 100% API and integration

### Test Reports

View detailed reports including:
- Pass/fail status
- Execution time
- Error messages
- Coverage metrics

---

For more information, see [API Reference](./API.md) or [Contributing Guide](./CONTRIBUTING.md).
