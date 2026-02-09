'use client';

import { useState, useEffect } from 'react';
import { Brain, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/lib/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface MemoryStats {
  totalConversations: number;
  totalFacts: number;
  totalPreferences: number;
  totalContexts: number;
}

interface Memory {
  id: string;
  content: string;
  metadata: {
    type: string;
    timestamp: number;
    source?: string;
    tags?: string[];
  };
}

export default function MemoryBrowser() {
  const { success, error: showError, toasts, removeToast } = useToast();
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemory, setNewMemory] = useState({ content: '', type: 'fact', tags: '' });

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchMemories(selectedType);
  }, [selectedType]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/memory/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchMemories = async (type: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/memory?type=${type}`);
      if (response.ok) {
        const data = await response.json();
        setMemories(data.memories || []);
      }
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/memory/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setMemories(data.results?.map((r: any) => r.entry).filter(Boolean) || []);
      } else {
        showError('Search failed. Please try again.');
      }
    } catch (error) {
      console.error('Search failed:', error);
      showError('Unable to search memories. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Clear all memories? This cannot be undone.')) return;

    try {
      await fetch('/api/memory', { method: 'DELETE' });
      fetchStats();
      setMemories([]);
    } catch (error) {
      console.error('Failed to clear memories:', error);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (!confirm('Delete this memory? This cannot be undone.')) return;

    try {
      const response = await fetch(`/api/memory?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        // Remove from local state
        setMemories(memories.filter(m => m.id !== id));
        fetchStats();
        success('Memory deleted successfully');
      } else {
        showError('Failed to delete memory. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete memory:', error);
      showError('Error deleting memory. Check your connection.');
    }
  };

  const handleAddMemory = async () => {
    if (!newMemory.content.trim()) {
      showError('Please enter memory content');
      return;
    }

    try {
      const metadata: any = {
        tags: newMemory.tags.split(',').map(t => t.trim()).filter(Boolean),
        source: 'manual-entry'
      };

      // Add key for preference type
      if (newMemory.type === 'preference') {
        metadata.key = newMemory.tags.split(',')[0]?.trim() || 'default';
      }

      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMemory.content,
          type: newMemory.type,
          metadata,
        }),
      });

      if (response.ok) {
        setNewMemory({ content: '', type: 'fact', tags: '' });
        setShowAddForm(false);
        fetchStats();
        if (selectedType === newMemory.type || selectedType === 'all') {
          fetchMemories(selectedType);
        }
        success('Memory added successfully!');
      } else {
        const data = await response.json().catch(() => ({}));
        showError(data.error || 'Failed to add memory. Please try again.');
      }
    } catch (error) {
      console.error('Failed to add memory:', error);
      showError('Error adding memory. Check your connection and try again.');
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="flex h-full bg-slate-900">
      {/* Left Sidebar: Stats & Filters */}
      <div className="w-80 border-r border-white/[0.06] p-6 overflow-y-auto">
        <h3 className="text-base font-medium text-white mb-6">Memory System</h3>

        {/* Stats */}
        {stats && (
          <div className="space-y-3 mb-6">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-lg font-medium text-blue-400">{stats.totalConversations}</div>
              <div className="text-sm text-slate-400">Conversations</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-lg font-medium text-green-400">{stats.totalFacts}</div>
              <div className="text-sm text-slate-400">Facts</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-lg font-medium text-purple-400">{stats.totalPreferences}</div>
              <div className="text-sm text-slate-400">Preferences</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-lg font-medium text-orange-400">{stats.totalContexts}</div>
              <div className="text-sm text-slate-400">Contexts</div>
            </div>
          </div>
        )}

        {/* Type Filter */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-slate-300 mb-3">Filter by Type</h4>
          <div className="space-y-2">
            {['all', 'conversation', 'fact', 'preference', 'context'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`
                  w-full text-left px-3 py-2 rounded transition-colors capitalize
                  ${
                    selectedType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                  }
                `}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Add Memory Section */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
          >
            {showAddForm ? '− Cancel' : '+ Add Memory'}
          </button>

          {showAddForm && (
            <div className="bg-slate-800/50 border border-white/[0.06] rounded-lg p-4 space-y-3 mt-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Type</label>
                <select
                  value={newMemory.type}
                  onChange={(e) => setNewMemory({ ...newMemory, type: e.target.value })}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:outline-none focus:border-blue-500 text-sm"
                >
                  <option value="conversation">Conversation</option>
                  <option value="fact">Fact</option>
                  <option value="preference">Preference</option>
                  <option value="context">Context</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Content</label>
                <textarea
                  value={newMemory.content}
                  onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
                  placeholder="Enter memory content..."
                  rows={3}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:outline-none focus:border-blue-500 text-sm resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newMemory.tags}
                  onChange={(e) => setNewMemory({ ...newMemory, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <button
                onClick={handleAddMemory}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm active:scale-[0.98]"
              >
                Save Memory
              </button>
            </div>
          )}
        </div>

        {/* Clear Button */}
        <button
          onClick={handleClear}
          className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors active:scale-[0.98]"
        >
          Clear All Memories
        </button>
      </div>

      {/* Right Content: Memories */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Search */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search memories..."
              className="flex-1 bg-slate-800 text-white px-4 py-2 rounded border border-slate-600 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors active:scale-[0.98]"
            >
              Search
            </button>
          </div>
        </div>

        {/* Memories List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner message="Loading memories..." />
          </div>
        ) : memories.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <Brain className="h-16 w-16 text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              {selectedType === 'all' ? 'No memories yet' : `No ${selectedType} memories found`}
            </h3>
            <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
              {selectedType === 'all'
                ? 'Memories help agents remember context across conversations. Click "Add Memory" to create your first one.'
                : `Add a ${selectedType} memory using the "Add Memory" button above.`}
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Your First Memory
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {memories.map((memory) => (
              <div
                key={memory.id}
                className="bg-slate-800/50 border border-white/[0.06] rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded capitalize">
                    {memory.metadata.type}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {formatTimestamp(memory.metadata.timestamp)}
                    </span>
                    <button
                      onClick={() => handleDeleteMemory(memory.id)}
                      className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                      aria-label="Delete memory"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-white text-sm whitespace-pre-wrap">{memory.content}</p>
                {memory.metadata.tags && memory.metadata.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {memory.metadata.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
