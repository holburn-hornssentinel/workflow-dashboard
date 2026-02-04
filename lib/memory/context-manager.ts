import { getVectorStore, MemoryEntry } from './vector-store';

export interface ConversationContext {
  recentMessages: string[];
  relevantFacts: string[];
  userPreferences: Record<string, any>;
  sessionSummary?: string;
}

export class ContextManager {
  private vectorStore = getVectorStore();
  private sessionMemories: Map<string, MemoryEntry[]> = new Map();

  /**
   * Store a conversation message
   */
  async storeMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> {
    const entry = await this.vectorStore.store(content, {
      type: 'conversation',
      timestamp: Date.now(),
      source: sessionId,
      tags: [role],
      role,
    });

    // Add to session cache
    if (!this.sessionMemories.has(sessionId)) {
      this.sessionMemories.set(sessionId, []);
    }
    this.sessionMemories.get(sessionId)!.push(entry);
  }

  /**
   * Store a fact learned from conversation
   */
  async storeFact(content: string, source?: string): Promise<void> {
    await this.vectorStore.store(content, {
      type: 'fact',
      timestamp: Date.now(),
      source,
    });
  }

  /**
   * Store user preference
   */
  async storePreference(key: string, value: any, source?: string): Promise<void> {
    await this.vectorStore.store(JSON.stringify({ key, value }), {
      type: 'preference',
      timestamp: Date.now(),
      source,
      preferenceKey: key,
    });
  }

  /**
   * Recall context for a conversation
   */
  async recallContext(
    sessionId: string,
    query: string,
    options: {
      maxMessages?: number;
      maxFacts?: number;
      includePreferences?: boolean;
    } = {}
  ): Promise<ConversationContext> {
    const {
      maxMessages = 10,
      maxFacts = 5,
      includePreferences = true,
    } = options;

    // Get recent session messages
    const sessionMessages =
      this.sessionMemories.get(sessionId)?.slice(-maxMessages) || [];
    const recentMessages = sessionMessages.map((entry) => entry.content);

    // Search for relevant facts
    const factResults = await this.vectorStore.search(query, maxFacts);
    const relevantFacts = factResults
      .filter((result) => result.entry.metadata.type === 'fact')
      .map((result) => result.entry.content);

    // Get user preferences
    let userPreferences: Record<string, any> = {};
    if (includePreferences) {
      const prefs = await this.vectorStore.getByType('preference', 100);
      prefs.forEach((pref) => {
        try {
          const parsed = JSON.parse(pref.content);
          userPreferences[parsed.key] = parsed.value;
        } catch {
          // Ignore parse errors
        }
      });
    }

    return {
      recentMessages,
      relevantFacts,
      userPreferences,
    };
  }

  /**
   * Build context string for AI prompt
   */
  async buildContextPrompt(sessionId: string, query: string): Promise<string> {
    const context = await this.recallContext(sessionId, query);

    const parts: string[] = [];

    // Add user preferences
    if (Object.keys(context.userPreferences).length > 0) {
      parts.push('User Preferences:');
      Object.entries(context.userPreferences).forEach(([key, value]) => {
        parts.push(`- ${key}: ${JSON.stringify(value)}`);
      });
      parts.push('');
    }

    // Add relevant facts
    if (context.relevantFacts.length > 0) {
      parts.push('Relevant Context:');
      context.relevantFacts.forEach((fact) => {
        parts.push(`- ${fact}`);
      });
      parts.push('');
    }

    // Add recent conversation
    if (context.recentMessages.length > 0) {
      parts.push('Recent Conversation:');
      context.recentMessages.forEach((msg) => {
        parts.push(msg);
      });
    }

    return parts.join('\n');
  }

  /**
   * Summarize session for storage
   */
  async summarizeSession(sessionId: string, summary: string): Promise<void> {
    await this.vectorStore.store(summary, {
      type: 'context',
      timestamp: Date.now(),
      source: sessionId,
      tags: ['summary'],
    });

    // Clear session cache
    this.sessionMemories.delete(sessionId);
  }

  /**
   * Get memory statistics
   */
  async getStats(): Promise<{
    totalConversations: number;
    totalFacts: number;
    totalPreferences: number;
    totalContexts: number;
  }> {
    const [conversations, facts, preferences, contexts] = await Promise.all([
      this.vectorStore.getByType('conversation'),
      this.vectorStore.getByType('fact'),
      this.vectorStore.getByType('preference'),
      this.vectorStore.getByType('context'),
    ]);

    return {
      totalConversations: conversations.length,
      totalFacts: facts.length,
      totalPreferences: preferences.length,
      totalContexts: contexts.length,
    };
  }

  /**
   * Clear all memories
   */
  async clearAllMemories(): Promise<void> {
    await this.vectorStore.clear();
    this.sessionMemories.clear();
  }
}

// Singleton instance
let contextManagerInstance: ContextManager | null = null;

export function getContextManager(): ContextManager {
  if (!contextManagerInstance) {
    contextManagerInstance = new ContextManager();
  }
  return contextManagerInstance;
}
