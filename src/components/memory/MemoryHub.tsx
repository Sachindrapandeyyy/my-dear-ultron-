import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ORB_THEMES } from '@/lib/orb/theme';
import {
  Database,
  Search,
  Plus,
  Trash2,
  Download,
  Upload,
  Flame,
  Tag,
  Shield,
  AlertTriangle,
  Settings,
  Workflow,
  Sparkles,
} from 'lucide-react';
import { memoryService } from '@/services/memoryService';
import { audioService } from '@/services/audioService';

export const MemoryHub: React.FC = () => {
  const { theme, memories, refreshMemories, addMemory, deleteMemory, settings } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State for new memory
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<any>('pattern');
  const [newTags, setNewTags] = useState('');

  const themeConfig = ORB_THEMES[theme];

  const categories = [
    { id: 'all', label: 'ALL MEMORIES', icon: Database },
    { id: 'pattern', label: 'PATTERNS', icon: Sparkles },
    { id: 'error', label: 'ERRORS & FIXES', icon: AlertTriangle },
    { id: 'correction', label: 'CORRECTIONS', icon: Settings },
    { id: 'preference', label: 'PREFERENCES', icon: Tag },
    { id: 'security', label: 'SECURITY', icon: Shield },
    { id: 'workflow', label: 'WORKFLOWS', icon: Workflow },
  ];

  const filteredMemories = memories.filter((m) => {
    const matchCat = selectedCategory === 'all' || m.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchQ =
      !searchQuery ||
      m.title.toLowerCase().includes(q) ||
      m.content.toLowerCase().includes(q) ||
      m.tags.some((t) => t.toLowerCase().includes(q));
    return matchCat && matchQ;
  });

  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    if (settings.soundEffects) audioService.playSuccessChime();

    addMemory({
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      tags: newTags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    });

    setNewTitle('');
    setNewContent('');
    setNewTags('');
    setIsAddModalOpen(false);
  };

  const handleExport = () => {
    if (settings.soundEffects) audioService.playClickSound();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(memoryService.exportJson());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ultron_memories_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (memoryService.importJson(content)) {
        refreshMemories();
        if (settings.soundEffects) audioService.playSuccessChime();
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="pt-16 pb-24 px-4 max-w-6xl mx-auto min-h-screen font-mono select-text">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6" style={{ color: themeConfig.cssPrimary }} />
            <h1 className="text-xl font-bold tracking-widest text-white">
              MODELSCOPE COLLECTIVE MEMORY HUB
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Self-evolving tiered memory store. Recalled semantically before every LLM reasoning cycle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold text-xs transition-all"
            style={{
              backgroundColor: themeConfig.cssPrimary,
              color: '#000',
              boxShadow: `0 0 12px ${themeConfig.cssGlow}`,
            }}
          >
            <Plus className="w-4 h-4" />
            <span>NEW MEMORY</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs"
            title="Export JSON Backup"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>IMPORT</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* Search & Category Tabs */}
      <div className="space-y-3 mb-6 select-none">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search collective memory bank (e.g. Electron, MediaPipe, subagent, GPU)..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/90 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-zinc-600 transition-all placeholder:text-zinc-600"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((c) => {
            const Icon = c.icon;
            const isSelected = selectedCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  if (settings.soundEffects) audioService.playClickSound();
                  setSelectedCategory(c.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs tracking-wider transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-zinc-800 text-white border'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-transparent'
                }`}
                style={{
                  borderColor: isSelected ? themeConfig.cssPrimary : undefined,
                  boxShadow: isSelected ? `0 0 8px ${themeConfig.cssGlow}` : 'none',
                }}
              >
                <Icon className="w-3 h-3" />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Memories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMemories.map((mem) => (
          <div
            key={mem.id}
            className="p-4 rounded-lg bg-zinc-950/90 border border-zinc-800 hover:border-zinc-700 transition-all group relative flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
                  {mem.category}
                </span>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                    <Flame className="w-3 h-3" />
                    <span>{mem.hitCount} hits</span>
                  </div>

                  <button
                    onClick={() => {
                      if (settings.soundEffects) audioService.playClickSound();
                      deleteMemory(mem.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition-opacity"
                    title="Delete Memory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-sm font-bold text-white mb-1.5 leading-snug">{mem.title}</h3>

              {/* Content */}
              <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{mem.content}</p>
            </div>

            {/* Tags footer */}
            {mem.tags.length > 0 && (
              <div className="mt-3 pt-2 border-t border-zinc-800/80 flex flex-wrap gap-1">
                {mem.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredMemories.length === 0 && (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-lg">
          <Database className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm text-zinc-400">No collective memories found matching this query.</p>
        </div>
      )}

      {/* Add Memory Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold tracking-wider text-white flex items-center gap-2">
              <Plus className="w-4 h-4" style={{ color: themeConfig.cssPrimary }} />
              REGISTER COLLECTIVE MEMORY
            </h2>

            <form onSubmit={handleCreateMemory} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">MEMORY TITLE</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Three.js Shader Precision Fix"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-white focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">CATEGORY</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-white focus:outline-none focus:border-zinc-600"
                >
                  <option value="pattern">Pattern (Design / Best Practice)</option>
                  <option value="error">Error (Bug Cause & Proven Fix)</option>
                  <option value="correction">Correction (Explicit Rule)</option>
                  <option value="preference">Preference (User/System Choice)</option>
                  <option value="security">Security (Safe Safeguards)</option>
                  <option value="workflow">Workflow (Multi-step Routine)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">CONTENT / LESSON LEARNED</label>
                <textarea
                  required
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Describe the solution, pitfall, or requirement in crisp detail..."
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-white focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">TAGS (COMMA SEPARATED)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="threejs, shaders, webgl, performance"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-white focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-xs"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-xs rounded"
                  style={{
                    backgroundColor: themeConfig.cssPrimary,
                    color: '#000',
                  }}
                >
                  SAVE MEMORY
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
