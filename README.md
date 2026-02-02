# 🎯 Workflow Dashboard

A bleeding-edge AI agent orchestration platform that transforms natural language descriptions into executable workflows. Built for "vibe coders" - describe what you want in plain English and get working AI agents.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen)

## ✨ Features

### 🤖 Dual AI Providers
- **Claude Sonnet 4.5** - Advanced reasoning and complex workflows
- **Gemini 2.5 Flash** - Fast, efficient task execution
- Switch between providers seamlessly in the UI

### 🎨 Visual Workflow Builder
- Drag-and-drop node-based editor
- Real-time workflow visualization
- Bidirectional YAML import/export
- Undo/redo support with full history

### ✨ Vibe Coding (Natural Language)
- Describe workflows in plain English
- AI generates complete workflows automatically
- Voice input support (Chrome)
- Example prompts for inspiration

### 🔄 Real-Time Streaming
- Server-Sent Events (SSE) for live AI responses
- Terminal-style execution output
- Progress tracking and cancellation

### 🧠 Multi-Agent Orchestration
- **Planner**: Breaks down complex goals
- **Executor**: Carries out tasks
- **Reviewer**: Quality assurance
- **Researcher**: Information gathering
- **Coordinator**: Workflow management

### 🔧 MCP Tool Integration
- 75+ tools via Model Context Protocol
- File system, Git, Web, APIs
- Tool browser and catalog
- Extensible tool registry

### 💾 Persistent Memory
- Vector-based memory storage (LanceDB)
- Session persistence across restarts
- Fact and preference learning
- Context-aware responses

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **API Key** (at least one):
  - [Anthropic Claude API Key](https://console.anthropic.com/)
  - [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/workflow-dashboard.git
   cd workflow-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev:restart
   ```

4. **Open the application**
   - Navigate to [http://localhost:3004](http://localhost:3004)
   - Go to **Settings** and add your API key(s)
   - Click **Restart Server** to apply changes

### First Workflow

1. Click **🎨 Visual Builder** or access vibe coding from the builder
2. Describe your workflow:
   ```
   Create an agent that reads my emails and summarizes important ones
   ```
3. Click **Generate Workflow**
4. View and execute your AI-powered workflow!

## 📁 Project Structure

```
workflow-dashboard/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── builder/           # Visual builder page
│   ├── settings/          # Settings page
│   ├── qa/                # QA testing dashboard
│   └── ...
├── components/            # React components
│   ├── builder/           # Builder-specific components
│   ├── vibe/              # Vibe coding components
│   ├── execution/         # Streaming terminal
│   └── ...
├── lib/                   # Core libraries
│   ├── ai/                # AI provider abstraction
│   ├── mcp/               # MCP tool integration
│   ├── memory/            # Memory system
│   ├── qa/                # QA testing framework
│   └── ...
├── stores/                # Zustand state management
├── types/                 # TypeScript types
└── __tests__/             # Test suites
```

## 🧪 Quality Assurance

Built-in QA dashboard with automated testing:

```bash
# Access QA dashboard
http://localhost:3004/qa

# Run tests via CLI
curl -X POST http://localhost:3004/api/qa/run
```

**Test Coverage:**
- ✅ 8 API endpoint tests
- ✅ 3 Integration tests
- ✅ 100% API coverage
- ✅ 100% Integration coverage

## 📚 Documentation

- **[Features Guide](./FEATURES.md)** - Detailed feature documentation
- **[API Reference](./API.md)** - API endpoint documentation
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment
- **[Contributing](./CONTRIBUTING.md)** - Contribution guidelines

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Access at http://localhost:3004
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup.

## 🔧 Configuration

Environment variables (`.env.local`):

```env
# AI Providers (configure at least one)
ANTHROPIC_API_KEY=your_anthropic_key
GEMINI_API_KEY=your_gemini_key

# Memory Backend
MEMORY_BACKEND=local
LANCEDB_PATH=./data/lancedb

# Optional: Cloud Memory (Pinecone)
# PINECONE_API_KEY=your_pinecone_key
# PINECONE_INDEX=workflow-memory
```

Or configure via **Settings UI** at `/settings`.

## 🛠️ Development

```bash
# Development with auto-restart
npm run dev:restart

# Build for production
npm run build

# Run tests
npm run test

# Run E2E tests
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

Built with:
- [Next.js 14](https://nextjs.org/)
- [Anthropic Claude API](https://www.anthropic.com/)
- [Google Gemini API](https://ai.google.dev/)
- [React Flow](https://reactflow.dev/)
- [LanceDB](https://lancedb.com/)
- [Model Context Protocol](https://www.anthropic.com/news/model-context-protocol)

## 📞 Support

- 📖 [Documentation](./FEATURES.md)
- 🐛 [Issue Tracker](https://github.com/yourusername/workflow-dashboard/issues)
- 💬 [Discussions](https://github.com/yourusername/workflow-dashboard/discussions)

---

Made with ❤️ by the Workflow Dashboard team
