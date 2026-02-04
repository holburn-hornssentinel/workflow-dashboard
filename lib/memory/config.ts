export interface MemoryConfig {
  backend: 'local' | 'cloud';
  local?: {
    dbPath: string;
  };
  cloud?: {
    apiKey: string;
    indexName: string;
  };
}

export function getMemoryConfig(): MemoryConfig {
  const backend = process.env.MEMORY_BACKEND || 'local';

  if (backend === 'cloud') {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      console.warn('[Memory] PINECONE_API_KEY not set, falling back to local');
      return {
        backend: 'local',
        local: {
          dbPath: process.env.LANCEDB_PATH || './data/lancedb',
        },
      };
    }

    return {
      backend: 'cloud',
      cloud: {
        apiKey,
        indexName: process.env.PINECONE_INDEX || 'workflow-memory',
      },
    };
  }

  return {
    backend: 'local',
    local: {
      dbPath: process.env.LANCEDB_PATH || './data/lancedb',
    },
  };
}

export function getEmbeddingConfig() {
  return {
    model: 'text-embedding-3-small', // OpenAI model
    dimensions: 1536,
  };
}
