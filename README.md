# Workflow Dashboard

AI workflow orchestration with visual builder, security scanning, and multi-model routing.

**[🚀 Live Demo](https://workflow.mikedeez.top/)** | [GitHub](https://github.com/holburn-hornssentinel/workflow-dashboard)

![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-1.1.0-blue)

## Features

- **Visual Workflow Builder** - Drag-and-drop interface with 2D/3D visualization
- **"Vibe Coding"** - Type natural language like "Create an email workflow" and AI generates the nodes
- **Security Scanner** - Real-time vulnerability detection (CWE-78, CWE-22, CWE-798) as you build
- **Multi-Model Router** - Routes simple tasks to Gemini Flash, complex reasoning to Claude Opus
- **Budget Enforcement** - Daily/weekly/monthly spending limits with automatic cutoffs
- **Permission System** - Human-in-the-loop approvals for high-risk operations
- **MCP Tools** - 75+ tools via Model Context Protocol (file system, Git, APIs, web)

## Screenshots

### Visual Workflow Builder
![Workflow Builder](docs/screenshots/workflow-builder.png)
*Drag-and-drop canvas with 7 node types: Input, Output, AI Agent, API Call, Transform, Conditional, Loop*

### Security Scanner
![Security Scanner](docs/screenshots/security-scanner.png)
*Real-time vulnerability detection with CWE references, severity ratings, and fix suggestions*

### Model Routing & Budget Control
![Settings](docs/screenshots/settings-routing.png)
*Multi-model routing with cost tracking and budget enforcement*

## Quick Start

```bash
git clone https://github.com/holburn-hornssentinel/workflow-dashboard.git
cd workflow-dashboard
npm install
npm run dev
```

Open http://localhost:3004

The UI works immediately. Add API keys via Settings when ready for AI features.

## Why This Exists

I built this to solve problems I kept hitting when building AI workflows:

**Security blind spots** - Command injection, hardcoded API keys, and path traversal bugs slip through until production. The security scanner (`lib/suggestions/rules/security.ts`) catches these as you build, with CWE references and fix suggestions.

**Cost blowout** - Routing everything through expensive models burns budget fast. The multi-model router (`lib/ai/router.ts`) analyzes task complexity and routes:
- Simple tasks → Gemini Flash ($0.10/1M tokens)
- Moderate tasks → Claude Sonnet ($3/1M tokens)
- Complex reasoning → Claude Opus ($15/1M tokens)

**Permission chaos** - Dangerous operations (file writes, shell commands) need human approval. The permission system (`lib/mcp/client.ts`) gates risky operations with risk assessment before execution.

**What makes it different from Langflow/Flowise:**
- Security scanning is built into the builder (not a separate audit step)
- Multi-model routing with budget enforcement (not single-model)
- "Vibe Coding" generates workflows from natural language descriptions

## Configuration

Optional for testing. Configure via Settings UI or `.env.local`:

```env
ANTHROPIC_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

Get free API keys:
- [Anthropic Claude](https://console.anthropic.com/)
- [Google Gemini](https://aistudio.google.com/app/apikey)

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI**: React Flow (2D), Three.js (3D visualization)
- **AI**: Anthropic Claude API, Google Gemini API
- **Validation**: Zod schemas
- **Storage**: LanceDB (vector memory)
- **Tools**: Model Context Protocol (MCP)

## Project Structure

```
workflow-dashboard/
├── app/           # Next.js pages and API routes
├── components/    # React components (builder, security, router)
├── lib/           # Core libraries (AI, MCP, security, suggestions)
├── stores/        # State management (Zustand)
└── types/         # TypeScript definitions
```

## Commands

```bash
npm run dev        # Start development server (port 3004)
npm run build      # Build for production
npm start          # Run production build
npm run lint       # Run linter
```

## Documentation

- **[Getting Started Guide](docs/GETTING_STARTED.md)** - Build your first workflow in 5 minutes
- **[Workflow Builder](docs/WORKFLOW_BUILDER.md)** - Complete guide to nodes, connections, and patterns
- **[Configuration](docs/CONFIGURATION.md)** - API setup, MCP tools, and troubleshooting

## Contributing

Contributions welcome! Please open an issue first to discuss what you'd like to change.

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## License

[MIT](LICENSE)

## Development Status

This is an early-stage project shared for testing and feedback. You may encounter rough edges or bugs. Issue reports and contributions are appreciated!
