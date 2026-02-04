export interface UserPreferences {
  lastProvider: 'claude' | 'gemini';
  recentWorkflows: string[];
  favoriteFeatures: string[];
  theme: 'dark' | 'light' | 'auto';
  usageCount: {
    builder: number;
    vibe: number;
    qa: number;
    workflows: number;
  };
}

const PREFERENCES_KEY = 'user-preferences';

const defaultPreferences: UserPreferences = {
  lastProvider: 'claude',
  recentWorkflows: [],
  favoriteFeatures: [],
  theme: 'dark',
  usageCount: {
    builder: 0,
    vibe: 0,
    qa: 0,
    workflows: 0,
  },
};

export function getPreferences(): UserPreferences {
  if (typeof window === 'undefined') return defaultPreferences;

  const saved = localStorage.getItem(PREFERENCES_KEY);
  if (saved) {
    try {
      return { ...defaultPreferences, ...JSON.parse(saved) };
    } catch {
      return defaultPreferences;
    }
  }
  return defaultPreferences;
}

export function savePreferences(prefs: Partial<UserPreferences>) {
  if (typeof window === 'undefined') return;

  const current = getPreferences();
  const updated = { ...current, ...prefs };
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
}

export function incrementUsage(feature: keyof UserPreferences['usageCount']) {
  const prefs = getPreferences();
  prefs.usageCount[feature]++;
  savePreferences(prefs);
}

export function addRecentWorkflow(workflowName: string) {
  const prefs = getPreferences();
  prefs.recentWorkflows = [
    workflowName,
    ...prefs.recentWorkflows.filter((w) => w !== workflowName),
  ].slice(0, 5); // Keep last 5
  savePreferences(prefs);
}

export function getRecommendations(): string[] {
  const prefs = getPreferences();
  const recommendations: string[] = [];

  // Smart recommendations based on usage
  if (prefs.usageCount.builder > 0 && prefs.usageCount.vibe === 0) {
    recommendations.push('Try Vibe Coding for faster workflow creation!');
  }

  if (prefs.usageCount.workflows > 3 && prefs.usageCount.qa === 0) {
    recommendations.push('Run QA tests to ensure everything works perfectly');
  }

  if (!prefs.recentWorkflows.length) {
    recommendations.push('Create your first workflow to get started');
  }

  return recommendations;
}
