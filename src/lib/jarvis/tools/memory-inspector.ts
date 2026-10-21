import { JarvisTool, ToolResult } from './types';
import { getAllMemories, JarvisMemory } from '../memory';

interface MemoryInspectorInput {
  category?: 'teaching' | 'self_study' | 'rule' | 'preference' | 'global_intelligence';
  query?: string;
  limit?: number;
}

export const memoryInspectorTool: JarvisTool<MemoryInspectorInput, { memories: JarvisMemory[] }> = {
  name: 'memory_inspector',
  label: 'Memory Vault Search & Retrieval',
  description:
    'Retrieves persistent memories, Prince teachings, operating rules, self-study notes, and historical sector scans from the permanent memory vault.',
  permissionLevel: 'safe_auto',
  parameters: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Memory category filter.',
        enum: ['teaching', 'self_study', 'rule', 'preference', 'global_intelligence'],
      },
      query: {
        type: 'string',
        description: 'Optional keyword to search across memory titles, content, and tags.',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of memories to return (default 6).',
      },
    },
  },
  execute: async (input) => {
    const startTime = Date.now();
    const limit = Math.min(Math.max(input.limit || 6, 1), 20);
    const category = input.category;
    const searchWord = input.query?.toLowerCase().trim();

    try {
      const all = await getAllMemories(category, 50);
      let filtered = all;

      if (searchWord) {
        filtered = all.filter(
          (m) =>
            m.title.toLowerCase().includes(searchWord) ||
            m.content.toLowerCase().includes(searchWord) ||
            m.tags.some((t) => t.toLowerCase().includes(searchWord))
        );
      }

      const results = filtered.slice(0, limit);
      const summary = `Retrieved ${results.length} persistent memories from the vault${
        category ? ` in category "${category}"` : ''
      }${searchWord ? ` matching "${searchWord}"` : ''}.`;

      return {
        toolName: 'memory_inspector',
        success: true,
        data: { memories: results },
        summary,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        toolName: 'memory_inspector',
        success: false,
        error: err?.message,
        summary: `Could not retrieve memories: ${err?.message}`,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    }
  },
};

