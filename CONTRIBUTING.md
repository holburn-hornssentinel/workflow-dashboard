# 🤝 Contributing to Workflow Dashboard

Thank you for your interest in contributing! This guide will help you get started.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other contributors

## How to Contribute

### Reporting Bugs

1. Check existing issues first
2. Use the bug report template
3. Include:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots if applicable
   - Environment details

### Suggesting Features

1. Check existing feature requests
2. Describe the problem you're solving
3. Propose your solution
4. Explain alternative solutions considered

### Pull Requests

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Make** your changes
4. **Test** your changes
5. **Commit** using conventional commits
6. **Push** to your fork
7. **Create** a Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/workflow-dashboard.git
cd workflow-dashboard

# Install dependencies
npm install

# Create .env.local and add API keys
cp .env.example .env.local

# Start development server
npm run dev:restart
```

## Code Style

### TypeScript

- Use TypeScript for all new code
- Add type annotations for function signatures
- Prefer interfaces over types for objects
- Use meaningful variable names

```typescript
// Good
interface WorkflowNode {
  id: string;
  type: NodeType;
  data: NodeData;
}

// Avoid
type N = { i: string; t: string };
```

### React Components

- Use functional components
- Use hooks for state management
- Keep components focused and small
- Extract reusable logic into custom hooks

```typescript
// Good
export default function MyComponent({ prop }: Props) {
  const [state, setState] = useState();
  return <div>{prop}</div>;
}
```

### File Organization

```
feature/
├── ComponentName.tsx       # Component
├── hooks/
│   └── useFeature.ts      # Custom hooks
├── types.ts               # TypeScript types
└── utils.ts               # Utility functions
```

## Commit Guidelines

### Conventional Commits

Use the format: `type(scope): description`

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests
- `chore`: Maintaining, dependencies, etc.

**Examples:**
```bash
feat(builder): add undo/redo functionality
fix(api): resolve memory storage error
docs(readme): update installation instructions
```

## Testing

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# QA dashboard tests
curl -X POST http://localhost:3004/api/qa/run
```

### Writing Tests

Add tests for:
- New features
- Bug fixes
- API endpoints
- Complex logic

```typescript
// Example test
describe('WorkflowBuilder', () => {
  it('should create a new node', () => {
    const node = createNode('agent');
    expect(node.type).toBe('custom');
  });
});
```

## Documentation

### Code Comments

- Comment complex logic
- Use JSDoc for public APIs
- Keep comments up to date

```typescript
/**
 * Generates workflow from natural language description
 * @param description - User's workflow description
 * @param provider - AI provider (claude or gemini)
 * @returns Generated workflow with nodes and edges
 */
export async function generateWorkflow(
  description: string,
  provider: AIProvider
): Promise<Workflow> {
  // Implementation
}
```

### Documentation Files

Update relevant docs when changing:
- API endpoints → `API.md`
- Features → `FEATURES.md`
- Setup → `README.md`

## Review Process

### Pull Request Checklist

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Added/updated tests for changes
- [ ] Updated documentation
- [ ] Commit messages follow conventions
- [ ] No merge conflicts

### Review Guidelines

Reviewers will check for:
- Code quality and style
- Test coverage
- Documentation updates
- Breaking changes
- Performance implications

## Questions?

- 📖 Read the [documentation](./FEATURES.md)
- 💬 Join [discussions](https://github.com/yourusername/workflow-dashboard/discussions)
- 🐛 Report [issues](https://github.com/yourusername/workflow-dashboard/issues)

---

Thank you for contributing! 🎉
