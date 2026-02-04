# Workflow Dashboard

An AI workflow orchestration platform with visual builder, security scanning, and multi-model routing.

> **⚠️ Development Preview** - This is an active development project shared for testing and feedback. Not recommended for production use without additional security hardening.

![Version](https://img.shields.io/badge/version-1.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Quick Start

```bash
git clone https://github.com/holburn-hornssentinel/workflow-dashboard.git
cd workflow-dashboard
npm install
npm run dev
```

Open http://localhost:3004

**No configuration required to start.** The UI works immediately. Add API keys via Settings when ready for AI features.

## Features

- **Visual Workflow Builder** - Drag-and-drop interface with 2D/3D views
- **AI Integration** - Claude and Gemini support with natural language workflow generation
- **Security Scanner** - Real-time vulnerability detection with CWE references
- **Multi-Model Router** - Automatic model selection with cost tracking and budgets
- **Permission System** - Approval workflow for high-risk operations
- **MCP Tools** - 75+ tools via Model Context Protocol

## Configuration

API keys are optional for UI testing. Configure via Settings page or `.env.local`:

```env
ANTHROPIC_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

The app runs on port 3004 by default (configurable in `package.json`).

## Development Status

This project includes:
- ✅ Visual workflow builder with import/export
- ✅ Security features (input validation, command injection prevention)
- ✅ AI routing with budget enforcement
- ⚠️ Authentication disabled in development mode
- ⚠️ Some security enhancements pending (see issues)

For production deployment, additional security configuration is required.

## Project Structure

```
workflow-dashboard/
├── app/           # Next.js pages and API routes
├── components/    # React components
├── lib/           # Core libraries (AI, MCP, security)
├── stores/        # State management
└── types/         # TypeScript definitions
```

## Commands

```bash
npm run dev        # Start development server (port 3004)
npm run build      # Build for production
npm start          # Run production build
npm run lint       # Run linter
```

## License

MIT

## Issues & Feedback

Please report bugs and suggestions via GitHub Issues.
