import { nanoid } from 'nanoid';
import { getMemoryConfig } from './config';

export interface MemoryEntry {
  id: string;
  content: string;
  embedding?: number[];
  metadata: {
    type: 'conversation' | 'fact' | 'preference' | 'context';
    timestamp: number;
    source?: string;
    tags?: string[];
    [key: string]: any;
  };
}

export interface SearchResult {
  entry: MemoryEntry;
  score: number;
}

export class VectorStore {
  private config = getMemoryConfig();
  private db: any = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (this.config.backend === 'local') {
      await this.initializeLocal();
    } else {
      await this.initializeCloud();
    }

    this.initialized = true;
  }

  private async initializeLocal(): Promise<void> {
    try {
      // LanceDB initialization
      const { connect } = await import('@lancedb/lancedb');
      this.db = await connect(this.config.local!.dbPath);

      console.log(`[Memory] Connected to LanceDB at ${this.config.local!.dbPath}`);
    } catch (error) {
      console.error('[Memory] Failed to initialize LanceDB:', error);
      throw error;
    }
  }

  private async initializeCloud(): Promise<void> {
    // Pinecone initialization would go here
    console.log('[Memory] Cloud memory backend not yet implemented');
    throw new Error('Cloud backend not implemented');
  }

  async store(content: string, metadata: MemoryEntry['metadata']): Promise<MemoryEntry> {
    await this.initialize();

    const entry: MemoryEntry = {
      id: nanoid(),
      content,
      metadata: {
        ...metadata,
        timestamp: Date.now(),
      },
    };

    // Generate embedding (would use OpenAI or similar in production)
    // entry.embedding = await this.generateEmbedding(content);

    // Store in vector database
    if (this.config.backend === 'local') {
      await this.storeLocal(entry);
    }

    return entry;
  }

  private async storeLocal(entry: MemoryEntry): Promise<void> {
    try {
      const tableName = 'memories';

      // Check if table exists
      let table;
      try {
        table = await this.db.openTable(tableName);
      } catch {
        // Create table if it doesn't exist
        table = await this.db.createTable(tableName, [
          {
            id: entry.id,
            content: entry.content,
            metadata: JSON.stringify(entry.metadata),
          },
        ]);
        return;
      }

      // Add entry to table
      await table.add([
        {
          id: entry.id,
          content: entry.content,
          metadata: JSON.stringify(entry.metadata),
        },
      ]);
    } catch (error) {
      console.error('[Memory] Failed to store entry:', error);
      throw error;
    }
  }

  async search(query: string, limit: number = 10): Promise<SearchResult[]> {
    await this.initialize();

    if (this.config.backend === 'local') {
      return this.searchLocal(query, limit);
    }

    return [];
  }

  private async searchLocal(query: string, limit: number): Promise<SearchResult[]> {
    try {
      const tableName = 'memories';
      const table = await this.db.openTable(tableName);

      // Use simple LIKE query instead of full-text search (which requires INVERTED index)
      const results = await table
        .query()
        .where(`content LIKE '%${query}%'`)
        .limit(limit)
        .toArray();

      return results.map((result: any, index: number) => ({
        entry: {
          id: result.id,
          content: result.content,
          metadata: JSON.parse(result.metadata),
        },
        score: 1.0 - (index * 0.1), // Simple relevance scoring
      }));
    } catch (error) {
      console.error('[Memory] Search failed:', error);
      return [];
    }
  }

  async getByType(type: MemoryEntry['metadata']['type'], limit: number = 100): Promise<MemoryEntry[]> {
    await this.initialize();

    if (this.config.backend === 'local') {
      return this.getByTypeLocal(type, limit);
    }

    return [];
  }

  private async getByTypeLocal(type: string, limit: number): Promise<MemoryEntry[]> {
    try {
      const tableName = 'memories';
      const table = await this.db.openTable(tableName);

      // LanceDB 0.23 API: use query().where() instead of filter()
      const results = await table
        .query()
        .where(`metadata LIKE '%"type":"${type}"%'`)
        .limit(limit)
        .toArray();

      return results.map((result: any) => ({
        id: result.id,
        content: result.content,
        metadata: JSON.parse(result.metadata),
      }));
    } catch (error) {
      console.error('[Memory] Failed to get by type:', error);
      return [];
    }
  }

  async delete(id: string): Promise<void> {
    await this.initialize();

    if (this.config.backend === 'local') {
      await this.deleteLocal(id);
    }
  }

  private async deleteLocal(id: string): Promise<void> {
    try {
      const tableName = 'memories';
      const table = await this.db.openTable(tableName);
      await table.delete(`id = '${id}'`);
    } catch (error) {
      console.error('[Memory] Failed to delete:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    await this.initialize();

    if (this.config.backend === 'local') {
      await this.clearLocal();
    }
  }

  private async clearLocal(): Promise<void> {
    try {
      const tableName = 'memories';
      await this.db.dropTable(tableName);
    } catch (error) {
      console.error('[Memory] Failed to clear:', error);
      throw error;
    }
  }
}

// Singleton instance
let vectorStoreInstance: VectorStore | null = null;

export function getVectorStore(): VectorStore {
  if (!vectorStoreInstance) {
    vectorStoreInstance = new VectorStore();
  }
  return vectorStoreInstance;
}
