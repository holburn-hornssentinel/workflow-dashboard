export interface WalkthroughStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector
  action?: 'click' | 'hover' | 'type';
  position?: 'top' | 'bottom' | 'left' | 'right';
  route?: string; // Navigate to this route before showing step
}

export const walkthroughSteps: WalkthroughStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Workflow Dashboard!',
    description: 'Transform natural language into AI-powered workflows. Let me show you around!',
    target: 'body',
    position: 'bottom',
  },
  {
    id: 'settings',
    title: 'Configure API Keys',
    description: 'First, add your Claude or Gemini API key in Settings to unlock AI features.',
    target: '[href="/settings"]',
    position: 'bottom',
    action: 'click',
  },
  {
    id: 'builder',
    title: 'Visual Builder',
    description: 'Create workflows visually with drag-and-drop nodes and connections.',
    target: '[href="/builder"]',
    position: 'bottom',
    route: '/',
  },
  {
    id: 'vibe-button',
    title: 'Vibe Coding',
    description: 'Describe what you want in plain English and let AI generate the workflow!',
    target: 'button:has-text("Vibe Code")',
    position: 'bottom',
    route: '/builder',
  },
  {
    id: 'qa-tests',
    title: 'Quality Assurance',
    description: 'Run automated tests to ensure everything works perfectly.',
    target: '[href="/qa"]',
    position: 'bottom',
    route: '/',
  },
  {
    id: 'memory',
    title: 'Persistent Memory',
    description: 'Agents remember context across sessions with vector-based memory storage.',
    target: '[href="/memory"]',
    position: 'bottom',
    route: '/',
  },
  {
    id: 'agents',
    title: 'Multi-Agent System',
    description: 'Coordinate multiple specialized agents (Planner, Executor, Reviewer, etc.)',
    target: '[href="/agents"]',
    position: 'bottom',
    route: '/',
  },
  {
    id: 'complete',
    title: 'You are All Set!',
    description: 'Start building workflows with natural language or the visual builder. Happy coding!',
    target: 'body',
    position: 'bottom',
  },
];
