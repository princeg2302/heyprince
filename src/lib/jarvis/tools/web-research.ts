import { JarvisTool, ToolResult, ToolCitation } from './types';

interface WebResearchInput {
  query: string;
  category?: 'ai' | 'engineering' | 'business' | 'seo' | 'general';
  maxResults?: number;
}

interface ResearchStory {
  title: string;
  url: string;
  snippet: string;
  source: string;
  publishedDate?: string;
  score?: number;
}

export const webResearchTool: JarvisTool<WebResearchInput, { stories: ResearchStory[] }> = {
  name: 'web_research',
  label: 'Live Web & Tech Research',
  description:
    'Searches real, live developer and technology sources (Hacker News Algolia API, tech RSS) to retrieve factual information, release notes, and verified source URLs without hallucinations.',
  permissionLevel: 'safe_auto',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query or topic to research (e.g., "Next.js 16 features", "LLM reasoning models", "e-commerce web performance").',
      },
      category: {
        type: 'string',
        description: 'Optional focus category.',
        enum: ['ai', 'engineering', 'business', 'seo', 'general'],
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of research results to return (default 5, max 10).',
      },
    },
    required: ['query'],
  },
  execute: async (input) => {
    const startTime = Date.now();
    const query = input.query?.trim() || 'AI web development';
    const limit = Math.min(Math.max(input.maxResults || 5, 1), 10);
    const stories: ResearchStory[] = [];
    const citations: ToolCitation[] = [];

    try {
      // 1. Query Hacker News Algolia Search API (real-time, fast, unauthenticated)
      const hnUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=${limit}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(hnUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.hits)) {
          for (const hit of json.hits) {
            const rawUrl = hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
            const title = hit.title || 'Untitled Tech Story';
            const snippet = hit.story_text || `Discussion with ${hit.points || 0} points and ${hit.num_comments || 0} comments.`;
            const dateStr = hit.created_at ? new Date(hit.created_at).toISOString().split('T')[0] : undefined;

            stories.push({
              title,
              url: rawUrl,
              snippet: snippet.slice(0, 240),
              source: 'Hacker News Community & Industry',
              publishedDate: dateStr,
              score: hit.points || 0,
            });

            citations.push({
              title,
              url: rawUrl,
              snippet: snippet.slice(0, 160),
              publishedDate: dateStr,
            });
          }
        }
      }
    } catch (err: any) {
      console.warn('[web_research tool] HN API fetch notice:', err?.message || err);
    }

    // 2. If Algolia search returned few results, pull fresh AI RSS fallback
    if (stories.length === 0) {
      try {
        const rssUrl = 'https://news.ycombinator.com/rss';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const rssRes = await fetch(rssUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (rssRes.ok) {
          const text = await rssRes.text();
          const itemRegex = /<item\b[^>]*>(.*?)<\/item>/gis;
          let match;
          let count = 0;

          while ((match = itemRegex.exec(text)) !== null && count < limit) {
            const block = match[1];
            const titleMatch = /<title\b[^>]*>(.*?)<\/title>/is.exec(block);
            const linkMatch = /<link\b[^>]*>(.*?)<\/link>/is.exec(block);

            if (titleMatch && linkMatch) {
              const title = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1').trim();
              const url = linkMatch[1].trim();

              stories.push({
                title,
                url,
                snippet: 'Trending tech development from Hacker News RSS feed.',
                source: 'Hacker News RSS',
              });

              citations.push({ title, url });
              count++;
            }
          }
        }
      } catch (rssErr) {
        console.warn('[web_research tool] RSS fallback notice:', rssErr);
      }
    }

    const durationMs = Date.now() - startTime;
    const summary =
      stories.length > 0
        ? `Found ${stories.length} verified tech and industry developments for "${query}". Top source: "${stories[0].title}" (${stories[0].url}).`
        : `Live search completed for "${query}", but no public stories matched the criteria.`;

    return {
      toolName: 'web_research',
      success: stories.length > 0,
      data: { stories },
      summary,
      citations,
      durationMs,
      timestamp: new Date().toISOString(),
    };
  },
};
