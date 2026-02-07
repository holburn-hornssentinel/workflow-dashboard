# Contributing to Workflow Dashboard

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow the project's technical standards

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/workflow-dashboard.git
   cd workflow-dashboard
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/holburn-hornssentinel/workflow-dashboard.git
   ```

## Development Setup

### Prerequisites

- Node.js 20+ and npm
- Git
- (Optional) API keys for testing AI features:
  - Anthropic Claude API key
  - Google Gemini API key

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# (Optional) Add your API keys to .env.local

# Start development server
npm run dev
```

The application will be available at `http://localhost:3004`

### Project Structure

```
workflow-dashboard/
├── app/              # Next.js App Router pages and API routes
├── components/       # React components
├── lib/              # Core libraries (AI, security, MCP)
├── stores/           # Zustand state management
├── types/            # TypeScript type definitions
├── e2e/              # End-to-end tests (Playwright)
├── docs/             # Documentation
└── public/           # Static assets
```

## Development Workflow

### Branch Naming

- Feature: `feature/description-here`
- Bug fix: `fix/description-here`
- Documentation: `docs/description-here`
- Chore: `chore/description-here`

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <description>

[optional body]
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```bash
feat: add export to JSON feature in workflow builder
fix: resolve WebGL memory leak in 3D view
docs: update installation instructions
refactor: simplify MCP client connection logic
test: add E2E tests for security scanner
chore: update dependencies to latest versions
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types/interfaces (avoid `any`)
- Use meaningful variable names
- Add JSDoc comments for public APIs

### React

- Use functional components with hooks
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks
- Use proper prop types

### Security

- **Never commit secrets or API keys**
- Validate all user inputs
- Use parameterized queries for databases
- Sanitize data before rendering
- Follow OWASP security guidelines

### Code Style

```typescript
// Good: Clear, typed, documented
interface UserPreferences {
  theme: 'light' | 'dark';
  autoSave: boolean;
}

/**
 * Updates user preferences in local storage
 * @param preferences - User preference settings
 */
function updatePreferences(preferences: UserPreferences): void {
  localStorage.setItem('preferences', JSON.stringify(preferences));
}

// Bad: Unclear, untyped, no documentation
function upd(p: any) {
  localStorage.setItem('prefs', JSON.stringify(p));
}
```

### Formatting

```bash
# Format code before committing
npm run format

# Check formatting
npm run format:check
```

## Testing

### Running Tests

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Unit tests
npm run test:unit

# E2E tests (requires dev server running)
npm run test:e2e

# All tests
npm run test:all
```

### Writing Tests

- **Unit tests** for utilities and pure functions
- **E2E tests** for user workflows using Playwright
- Test edge cases and error conditions
- Use descriptive test names: `should X when Y`

Example:
```typescript
// e2e/workflow-builder.spec.ts
test('should create workflow node when drag-drop from palette', async ({ page }) => {
  await page.goto('/builder');
  // ... test implementation
});
```

## Pull Request Process

### Before Submitting

1. **Update from upstream**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks**:
   ```bash
   npm run type-check
   npm run lint
   npm run test:all
   ```

3. **Update documentation** if needed

### Submitting PR

1. **Push to your fork**:
   ```bash
   git push origin your-branch-name
   ```

2. **Create Pull Request** on GitHub

3. **Fill out PR template**:
   - Clear description of changes
   - Link related issues
   - Include screenshots for UI changes
   - List breaking changes (if any)

4. **Respond to feedback**:
   - Address review comments
   - Update code as needed
   - Be open to suggestions

### PR Review Criteria

- ✅ Code follows style guidelines
- ✅ All tests pass
- ✅ No console.log or debug code
- ✅ Documentation updated
- ✅ No security vulnerabilities
- ✅ Meaningful commit messages

## Reporting Issues

### Bug Reports

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) and include:

- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Node version, browser)
- Screenshots/logs if applicable

### Feature Requests

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md) and include:

- Clear description of the feature
- Use case and benefits
- Proposed implementation (optional)
- Alternative solutions considered

### Security Issues

**Do not open public issues for security vulnerabilities.**

Report security issues privately to the maintainers. See [SECURITY.md](SECURITY.md) for details.

## Development Tips

### Hot Reload

The dev server supports hot reload for most changes. Restart only needed for:
- Environment variable changes
- Next.js config changes
- New dependencies

### Debugging

```bash
# Enable verbose logging
DEBUG=* npm run dev

# Debug specific modules
DEBUG=workflow:* npm run dev
```

### Common Issues

**Port 3004 already in use:**
```bash
# Find and kill process
lsof -ti:3004 | xargs kill
```

**Module not found errors:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

**Type errors after updating:**
```bash
# Rebuild TypeScript
npm run type-check
```

## Questions?

- Check [Documentation](docs/)
- Search [existing issues](https://github.com/holburn-hornssentinel/workflow-dashboard/issues)
- Ask in discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
