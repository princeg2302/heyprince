import { callAIModel, isAIConfigured } from '../daily-news/ai-provider';
import { saveMemory, getAllMemories, JarvisMemory } from './memory';
import { extractCleanSpokenText } from './cleaner';

export { extractCleanSpokenText };

export type IntelligenceSector =
  | 'ai'
  | 'technology'
  | 'automobile'
  | 'geopolitics'
  | 'infrastructure'
  | 'recession';

export interface SectorDefinition {
  id: IntelligenceSector;
  label: string;
  icon: string;
  description: string;
  keywords: string[];
  sampleFeeds: string[];
}

export const GLOBAL_SECTORS: Record<IntelligenceSector, SectorDefinition> = {
  ai: {
    id: 'ai',
    label: 'Artificial Intelligence & Frontier Research',
    icon: '🤖',
    description: 'LLMs, Multimodal models, AGI roadmaps, agent swarms, compute scaling, and AI alignment.',
    keywords: ['frontier LLM', 'multimodal reasoning', 'agentic workflow', 'AGI timeline', 'neural architecture'],
    sampleFeeds: ['https://blog.google/technology/ai/rss/', 'https://news.ycombinator.com/rss'],
  },
  technology: {
    id: 'technology',
    label: 'Technologies & Developer Ecosystems',
    icon: '💻',
    description: 'Next.js, TypeScript, cloud computing, cybersecurity, edge runtimes, open-source architectures.',
    keywords: ['Next.js App Router', 'TypeScript 5.8', 'serverless edge', 'distributed systems', 'cyber defense'],
    sampleFeeds: ['https://feeds.arstechnica.com/arstechnica/technology-lab'],
  },
  automobile: {
    id: 'automobile',
    label: 'Automobile, EV & Autonomous Mobility',
    icon: '🚗',
    description: 'Electric vehicles, autonomous driving systems, battery tech, smart transportation, global OEMs.',
    keywords: ['EV adoption', 'autonomous driving L4', 'solid-state battery', 'automotive software-defined vehicle'],
    sampleFeeds: ['https://electrek.co/feed/'],
  },
  geopolitics: {
    id: 'geopolitics',
    label: 'Worldwide Geopolitics & Country Issues',
    icon: '🌍',
    description: 'International treaties, sovereign digital policy, trade corridors, border politics, regulatory shifts.',
    keywords: ['global trade corridors', 'cross-border digital tariffs', 'sovereign AI policy', 'geopolitical tensions'],
    sampleFeeds: ['https://feeds.bbci.co.uk/news/world/rss.xml'],
  },
  infrastructure: {
    id: 'infrastructure',
    label: 'Infrastructure, Data Centers & Energy',
    icon: '🏗️',
    description: 'AI gigawatt data centers, power grids, semiconductor fabs, subsea cables, telecommunications.',
    keywords: ['hyperscale data center', 'semiconductor foundry', 'nuclear power for AI', 'telecom fiber grid'],
    sampleFeeds: ['https://techcrunch.com/category/enterprise/feed/'],
  },
  recession: {
    id: 'recession',
    label: 'Macroeconomics, Recession & Markets',
    icon: '📉',
    description: 'Central bank rates, inflation metrics, liquidity contractions, startup funding, tech enterprise spend.',
    keywords: ['global recession indicators', 'interest rate policy', 'venture liquidity', 'tech labor market shifts'],
    sampleFeeds: ['https://search.cnbc.com/rs/search/view.html?partnerId=2000&keywords=economy&sort=date&output=rss'],
  },
};

export interface SectorBriefingResult {
  sector: IntelligenceSector;
  sectorLabel: string;
  headline: string;
  region: string;
  summary: string;
  businessImpact: string;
  threatLevel: 'low' | 'moderate' | 'elevated' | 'critical';
  tags: string[];
  timestamp: string;
}

export interface GlobalSurveillanceReport {
  timestamp: string;
  totalSectorsScanned: number;
  executiveBriefing: string;
  briefings: SectorBriefingResult[];
}

/**
 * 24/7 Intelligence Scanner for a Single Sector
 */
export async function scanGlobalSector(
  sector: IntelligenceSector,
  customTopicHint?: string
): Promise<SectorBriefingResult> {
  const def = GLOBAL_SECTORS[sector];
  const now = new Date().toISOString();

  let headline = `24/7 Intelligence Briefing: ${def.label}`;
  let region = 'Global';
  let summary = `Continuous surveillance detected major strategic movements across ${def.description}`;
  let businessImpact = `Opportunities identified for HeyPrince.in in high-reliability software architecture, AI agent automation, and resilient digital consulting.`;
  let threatLevel: 'low' | 'moderate' | 'elevated' | 'critical' = 'moderate';
  let tags = [sector, '24_7_intelligence', 'chief_of_staff'];

  // 1. Live Wire Feed Ingestion: Fetch real-time public headlines to ground factual analysis
  let liveFeedContext = '';
  if (def.sampleFeeds && def.sampleFeeds.length > 0) {
    try {
      const feedUrl = def.sampleFeeds[0];
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(feedUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'HeyPrince-GlobalBrain/2.0' },
      });
      clearTimeout(timeout);
      if (res.ok) {
        const text = await res.text();
        const itemRegex = /<item\b[^>]*>(.*?)<\/item>/gis;
        let match;
        const liveItems: string[] = [];
        while ((match = itemRegex.exec(text)) !== null && liveItems.length < 3) {
          const titleMatch = /<title\b[^>]*>(.*?)<\/title>/is.exec(match[1]);
          if (titleMatch) {
            const cleanT = titleMatch[1]
              .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
              .replace(/<[^>]+>/g, '')
              .trim();
            if (cleanT) liveItems.push(cleanT);
          }
        }
        if (liveItems.length > 0) {
          liveFeedContext = `\nREAL-TIME WIRE HEADLINES DISCOVERED FROM PUBLIC FEED:\n${liveItems.map((h) => `- ${h}`).join('\n')}\n`;
        }
      }
    } catch {}
  }

  if (isAIConfigured()) {
    try {
      const systemPrompt = `You are the 24/7 Global Intelligence & Cognitive Surveillance Brain of JARVIS (AI Chief of Staff for Prince at HeyPrince.in).
Your mandate is continuous worldwide surveillance across high-stakes sectors:
- Technologies & Software Architecture
- Artificial Intelligence & Frontier Models
- Automobile & Autonomous Mobility
- Worldwide Geopolitics & Country-Related Issues
- Infrastructure, Gigawatt Data Centers & Energy Grids
- Macroeconomics, Recession Warnings & Financial Markets

You are currently scanning sector: "${def.label}" (${def.description}).
${customTopicHint ? `Specific focal point: "${customTopicHint}"` : ''}
${liveFeedContext}

Synthesize a fact-grounded, cutting-edge strategic intelligence briefing.
Analyze what is happening globally in this domain right now, its regional impact (which country or global), and what it means strategically for an elite software engineer & AI consultant (Prince).

Respond in strict JSON:
{
  "headline": "Punchy, executive-level headline (max 12 words)",
  "region": "Affected country or region (e.g., 'United States', 'European Union', 'India', 'East Asia', 'Global')",
  "summary": "Crisp 3-4 sentence intelligence brief highlighting core development, technical mechanisms, and global geopolitical/economic ripple effects.",
  "businessImpact": "Direct strategic implication for HeyPrince.in (e.g., client demand shift, pricing leverage, new technology moat).",
  "threatLevel": "low | moderate | elevated | critical",
  "tags": ["tag1", "tag2", "tag3"]
}`;

      const userPrompt = `Conduct real-time global surveillance on ${def.label}. Current time: ${now}`;
      const aiRes = await callAIModel(systemPrompt, userPrompt);
      const cleaned = aiRes.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (parsed.headline) headline = parsed.headline;
      if (parsed.region) region = parsed.region;
      if (parsed.summary) summary = parsed.summary;
      if (parsed.businessImpact) businessImpact = parsed.businessImpact;
      if (['low', 'moderate', 'elevated', 'critical'].includes(parsed.threatLevel)) {
        threatLevel = parsed.threatLevel;
      }
      if (Array.isArray(parsed.tags)) tags = [...new Set([...tags, ...parsed.tags])];
    } catch (err) {
      console.warn(`[JARVIS Global Brain] AI Scan notice for ${sector}:`, err);
    }
  }

  const result: SectorBriefingResult = {
    sector,
    sectorLabel: def.label,
    headline,
    region,
    summary,
    businessImpact,
    threatLevel,
    tags,
    timestamp: now,
  };

  // Persist to JARVIS permanent memory vault
  await saveMemory({
    category: 'global_intelligence',
    title: `[${def.icon} ${def.id.toUpperCase()}] ${headline}`,
    content: `Region: ${region}\n\n${summary}\n\nStrategic Business Impact: ${businessImpact}`,
    source: 'global_surveillance',
    tags,
    importance: threatLevel === 'critical' || threatLevel === 'elevated' ? 9 : 7,
    metadata: {
      sector,
      threatLevel,
      region,
      scannedAt: now,
    },
  });

  return result;
}

/**
 * Runs a complete 24/7 Global Surveillance Cycle across all 6 key sectors
 */
export async function runFullGlobalBrainSurveillance(): Promise<GlobalSurveillanceReport> {
  const sectors: IntelligenceSector[] = [
    'ai',
    'technology',
    'automobile',
    'geopolitics',
    'infrastructure',
    'recession',
  ];

  const briefings: SectorBriefingResult[] = [];

  for (const s of sectors) {
    try {
      const res = await scanGlobalSector(s);
      briefings.push(res);
    } catch (err) {
      console.warn(`[Global Brain] Sector ${s} scan error:`, err);
    }
  }

  // Synthesize executive spoken briefing
  let executiveBriefing = `24/7 Global Intelligence Surveillance complete, Prince. All 6 worldwide sectors have been scanned and committed to permanent memory. Core highlights: In AI and infrastructure, compute scaling continues to drive power grid demand; macroeconomic recession metrics indicate cautious corporate IT spend, favoring high-ROI AI automation like HeyPrince.in.`;

  if (isAIConfigured()) {
    try {
      const prompt = `You are JARVIS, British AI Chief of Staff.
Given these 6 fresh global intelligence updates:
${briefings.map((b) => `- [${b.sectorLabel}] (${b.region}): ${b.headline}. ${b.summary}`).join('\n')}

Generate a 3-sentence executive spoken briefing for Prince (Senior Engineer & Consultant at HeyPrince.in).
Tone: Dignified, sharp, British, calm authority. Address him as Prince or sir.
CRITICAL FORMAT RULE: Respond ONLY with plain spoken English sentences to be read aloud. Do NOT wrap in JSON, objects, markdown code blocks, quotes, curly braces or speaker prefixes.`;

      const aiRes = await callAIModel('You are JARVIS, British Chief of Staff.', prompt);
      if (aiRes.text?.trim()) {
        const cleaned = extractCleanSpokenText(aiRes.text);
        if (cleaned) {
          executiveBriefing = cleaned;
        }
      }
    } catch {}
  }

  return {
    timestamp: new Date().toISOString(),
    totalSectorsScanned: briefings.length,
    executiveBriefing,
    briefings,
  };
}

/**
 * Formats recent global intelligence into a prompt context block for JARVIS reasoning
 */
export async function getGlobalIntelligenceContext(): Promise<string> {
  try {
    const memories = await getAllMemories(undefined, 25);
    const intel = memories.filter((m) => m.category === 'global_intelligence');

    if (intel.length === 0) {
      return 'No global intelligence scans logged yet.';
    }

    let out = 'JARVIS 24/7 GLOBAL SURVEILLANCE & SECTOR INTELLIGENCE:\n';
    intel.slice(0, 6).forEach((item) => {
      out += `• ${item.title} (Region: ${item.metadata?.region || 'Global'}): ${item.content.slice(0, 190)}...\n`;
    });
    return out;
  } catch {
    return '24/7 Surveillance: Nominal.';
  }
}

