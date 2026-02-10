'use client';

/**
 * Template gallery for browsing and importing workflow templates
 */

import { useState, useEffect } from 'react';
import { X, Shield, GitBranch, Database, FileText, Code, Zap, Star } from 'lucide-react';
import { useBuilderStore } from '@/stores/builderStore';
import { useToastStore } from '@/stores/toastStore';
import type { TemplateMetadata, TemplateCategory, WorkflowTemplate } from '@/types/template';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryIcons: Record<TemplateCategory, React.ComponentType<{ className?: string }>> = {
  security: Shield,
  devops: GitBranch,
  'data-pipeline': Database,
  content: FileText,
  'code-review': Code,
};

const categoryColors: Record<TemplateCategory, string> = {
  security: 'bg-red-500',
  devops: 'bg-blue-500',
  'data-pipeline': 'bg-green-500',
  content: 'bg-purple-500',
  'code-review': 'bg-yellow-500',
};

const difficultyColors = {
  beginner: 'text-green-400 bg-green-500/20',
  intermediate: 'text-yellow-400 bg-yellow-500/20',
  advanced: 'text-red-400 bg-red-500/20',
};

export function TemplateGallery({ isOpen, onClose }: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<TemplateMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [importing, setImporting] = useState<string | null>(null);
  const { importWorkflow } = useBuilderStore();
  const toast = useToastStore();

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/templates');
      if (!response.ok) throw new Error('Failed to load templates');

      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    setImporting(templateId);
    try {
      // Fetch full template with nodes and edges
      const response = await fetch(`/api/templates?id=${templateId}`);
      if (!response.ok) throw new Error('Failed to load template');

      const template: WorkflowTemplate = await response.json();

      // Import into builder
      importWorkflow(template.nodes, template.edges);

      toast.success(`Template "${template.name}" loaded successfully`);
      onClose();
    } catch (error) {
      console.error('Failed to import template:', error);
      toast.error('Failed to import template');
    } finally {
      setImporting(null);
    }
  };

  const filteredTemplates =
    selectedCategory === 'all'
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-white/[0.06] rounded-lg shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-blue-400" />
            <h2 className="text-lg font-medium text-white">Workflow Templates</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors active:scale-[0.98]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 p-4 border-b border-white/[0.06] overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            All
          </button>
          {Object.entries(categoryIcons).map(([category, Icon]) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category as TemplateCategory)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Icon className="h-4 w-4" />
              {category.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" message="Loading templates..." />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No templates found in this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => {
                const Icon = categoryIcons[template.category];
                const categoryColor = categoryColors[template.category];

                return (
                  <div
                    key={template.id}
                    className="bg-slate-800/50 border border-white/[0.06] rounded-lg p-4 hover:border-slate-600 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10"
                  >
                    {/* Icon and Category */}
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-3 ${categoryColor} rounded-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex gap-2">
                        {/* Security Score */}
                        <div className="flex items-center gap-1 px-2 py-1 bg-slate-700 rounded text-xs">
                          <Shield className="h-3 w-3 text-green-400" />
                          <span className="text-white font-medium">{template.securityScore}</span>
                        </div>
                        {/* Difficulty */}
                        <div className={`px-2 py-1 rounded text-xs ${difficultyColors[template.difficulty]}`}>
                          {template.difficulty}
                        </div>
                      </div>
                    </div>

                    {/* Name and Description */}
                    <h3 className="text-white font-medium mb-2">{template.name}</h3>
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                      {template.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 3 && (
                        <span className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded">
                          +{template.tags.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                      <span>Cost: {template.metadata.estimatedCost}</span>
                      <span>v{template.metadata.version}</span>
                    </div>

                    {/* Use Button */}
                    <button
                      onClick={() => handleUseTemplate(template.id)}
                      disabled={importing === template.id}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors active:scale-[0.98]"
                    >
                      {importing === template.id ? 'Loading...' : 'Use Template'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
