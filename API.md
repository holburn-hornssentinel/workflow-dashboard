# 🔌 API Reference

Complete API documentation for Workflow Dashboard.

## Base URL

```
http://localhost:3004/api
```

## Authentication

Currently no authentication required for local development. Add authentication for production deployments.

## Endpoints

### Settings

#### GET `/api/settings/env`

Get current environment configuration (masked).

**Response:**
```json
{
  "anthropicKey": "sk-ant-***dgAA",
  "geminiKey": "AIzaSyC***uwiY",
  "hasAnthropicKey": true,
  "hasGeminiKey": true,
  "memoryBackend": "local",
  "lancedbPath": "./data/lancedb"
}
```

#### POST `/api/settings/env`

Update environment configuration.

**Request:**
```json
{
  "anthropicKey": "sk-ant-...",
  "geminiKey": "AIza...",
  "memoryBackend": "local",
  "lancedbPath": "./data/lancedb"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Configuration saved. Restart the server for changes to take effect."
}
```

#### POST `/api/settings/restart`

Restart the development server.

**Response:**
```json
{
  "success": true,
  "message": "Server restarting..."
}
```

### Vibe Coding

#### POST `/api/vibe/generate`

Generate workflow from natural language description.

**Request:**
```json
{
  "description": "Create an agent that greets users",
  "provider": "claude"
}
```

**Response:**
```json
{
  "nodes": [
    {
      "id": "start-1",
      "type": "custom",
      "position": { "x": 100, "y": 200 },
      "data": {
        "label": "Start",
        "type": "start"
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "start-1",
      "target": "agent-1",
      "type": "smoothstep"
    }
  ]
}
```

### Builder

#### POST `/api/builder/export`

Export workflow graph to YAML.

**Request:**
```json
{
  "nodes": [...],
  "edges": [...]
}
```

**Response:**
```json
{
  "yaml": "name: Workflow\\nsteps:\\n  step1:\\n    name: Agent"
}
```

#### POST `/api/builder/import`

Import YAML to workflow graph.

**Request:**
```json
{
  "yaml": "name: Test\\nsteps:\\n  step1:\\n    name: Agent"
}
```

**Response:**
```json
{
  "nodes": [...],
  "edges": [...]
}
```

### Agents

#### GET `/api/agents`

List all available agents.

**Response:**
```json
{
  "agents": [
    {
      "id": "...",
      "role": "planner",
      "name": "Strategy Planner",
      "description": "Breaks down complex goals",
      "status": "idle",
      "capabilities": ["planning", "task-decomposition"]
    }
  ]
}
```

#### POST `/api/agents/stream`

Stream AI responses in real-time.

**Request:**
```json
{
  "prompt": "Say hello",
  "provider": "claude",
  "model": "claude-sonnet-4-5-20250929"
}
```

**Response:** Server-Sent Events (SSE)
```
data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}

data: [DONE]
```

### Memory

#### GET `/api/memory?type={type}`

Get memories by type.

**Query Parameters:**
- `type`: conversation | fact | preference | context

**Response:**
```json
{
  "memories": [...]
}
```

#### POST `/api/memory`

Store memory.

**Request:**
```json
{
  "type": "fact",
  "content": "User prefers dark mode",
  "metadata": {
    "source": "settings"
  }
}
```

**Response:**
```json
{
  "success": true
}
```

#### GET `/api/memory/stats`

Get memory statistics.

**Response:**
```json
{
  "totalConversations": 0,
  "totalFacts": 0,
  "totalPreferences": 0,
  "totalContexts": 0
}
```

#### POST `/api/memory/search`

Search memories.

**Request:**
```json
{
  "query": "user preferences",
  "limit": 10
}
```

**Response:**
```json
{
  "results": [...]
}
```

### QA Testing

#### GET `/api/qa/run`

Get available test suites.

**Response:**
```json
{
  "suites": [
    {
      "id": "api-suite",
      "name": "API Endpoints",
      "category": "api",
      "testCount": 8
    }
  ]
}
```

#### POST `/api/qa/run`

Run all tests.

**Response:**
```json
{
  "timestamp": "2026-02-01T18:00:00.000Z",
  "totalTests": 11,
  "passed": 11,
  "failed": 0,
  "skipped": 0,
  "duration": 27425,
  "coverage": {
    "api": 100,
    "ui": 0,
    "integration": 100
  },
  "results": [...]
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request
- `500`: Internal Server Error

## Rate Limiting

No rate limiting in development. Implement rate limiting for production.

---

For usage examples, see [Features Guide](./FEATURES.md).
