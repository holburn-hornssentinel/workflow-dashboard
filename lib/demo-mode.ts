export const DEMO_MODE = process.env.DEMO_MODE === 'true';

export const BLOCKED_OPERATIONS = [
  'filesystem:delete_file',
  'filesystem:write_file',
  'git:push',
  'git:force_push',
  'execute:shell',
];

export function isDemoBlocked(toolId: string): boolean {
  if (!DEMO_MODE) return false;
  return BLOCKED_OPERATIONS.some(op => toolId.includes(op));
}
