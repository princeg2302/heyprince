import {
  DailyNewsSource,
  RawNewsStory,
  NormalizedNewsItem,
} from './types';
import {
  getDailyNewsSources,
  updateDailyNewsSource,
  saveDiscoveredNewsItems,
  getUnusedRecentNewsItems,
} from './db';

// ============================================================================
// 1. Lightweight, Resilient XML Feed Parser (RSS 2.0 & Atom)
// ============================================================================

function cleanHtml(input: string): string {
  if (!input) return '';
  return input
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseFeedXml(xml: string, source: DailyNewsSource): RawNewsStory[] {
  const stories: RawNewsStory[] = [];

  // 1. Detect if RSS (<item>) or Atom (<entry>)
  const isAtom = xml.includes('<entry>') || xml.includes('<entry ');

  if (!isAtom) {
    // RSS 2.0 parser
    const itemRegex = /<item\b[^>]*>(.*?)<\/item>/gis;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const block = match[1];

      // Extract title
      const titleMatch = /<title\b[^>]*>(.*?)<\/title>/is.exec(block);
      const rawTitle = titleMatch ? cleanHtml(titleMatch[1]) : '';

      // Extract link
      const linkMatch =
        /<link\b[^>]*>(.*?)<\/link>/is.exec(block) ||
        /<guid\b[^>]*isPermaLink="true"[^>]*>(.*?)<\/guid>/is.exec(block);
      let rawLink = linkMatch ? cleanHtml(linkMatch[1]) : '';

      // Extract description
      const descMatch =
        /<description\b[^>]*>(.*?)<\/description>/is.exec(block) ||
        /<content:encoded\b[^>]*>(.*?)<\/content:encoded>/is.exec(block);
      const rawSummary = descMatch ? cleanHtml(descMatch[1]) : '';

      // Extract date
      const dateMatch =
        /<pubDate\b[^>]*>(.*?)<\/pubDate>/is.exec(block) ||
        /<dc:date\b[^>]*>(.*?)<\/dc:date>/is.exec(block);
      let pubDate: Date | null = null;
      if (dateMatch) {
        const d = new Date(dateMatch[1].trim());
        if (!isNaN(d.getTime())) {
          pubDate = d;
        }
      }

      if (rawTitle && rawLink && rawLink.startsWith('http')) {
        stories.push({
          sourceId: source.id,
          sourceName: source.name,
          headline: rawTitle,
          url: rawLink.trim(),
          summary: rawSummary.slice(0, 800),
          publishedAt: pubDate,
        });
      }
    }
  } else {
    // Atom parser
    const entryRegex = /<entry\b[^>]*>(.*?)<\/entry>/gis;
    let match;
    while ((match = entryRegex.exec(xml)) !== null) {
      const block = match[1];

      // Extract title
      const titleMatch = /<title\b[^>]*>(.*?)<\/title>/is.exec(block);
      const rawTitle = titleMatch ? cleanHtml(titleMatch[1]) : '';

      // Extract link (often <link href="..." rel="alternate"/> or <link href="..."/>)
      let rawLink = '';
      const linkAttrMatch = /<link\b[^>]*href="([^"]+)"[^>]*>/i.exec(block);
      if (linkAttrMatch) {
        rawLink = linkAttrMatch[1];
      } else {
        const linkTagMatch = /<link\b[^>]*>(.*?)<\/link>/is.exec(block);
        if (linkTagMatch) rawLink = cleanHtml(linkTagMatch[1]);
      }

      // Extract summary / content
      const summaryMatch =
        /<summary\b[^>]*>(.*?)<\/summary>/is.exec(block) ||
        /<content\b[^>]*>(.*?)<\/content>/is.exec(block);
      const rawSummary = summaryMatch ? cleanHtml(summaryMatch[1]) : '';

      // Extract date
      const dateMatch =
        /<published\b[^>]*>(.*?)<\/published>/is.exec(block) ||
        /<updated\b[^>]*>(.*?)<\/updated>/is.exec(block);
      let pubDate: Date | null = null;
      if (dateMatch) {
        const d = new Date(dateMatch[1].trim());
        if (!isNaN(d.getTime())) {
          pubDate = d;
        }
      }

      if (rawTitle && rawLink && rawLink.startsWith('http')) {
        stories.push({
          sourceId: source.id,
          sourceName: source.name,
          headline: rawTitle,
          url: rawLink.trim(),
          summary: rawSummary.slice(0, 800),
          publishedAt: pubDate,
        });
      }
    }
  }

  return stories;
}

// ============================================================================
// 2. Fetch Single Feed with Polite Headers & Timeout
// ============================================================================

export async function fetchFeed(
  source: DailyNewsSource,
  timeoutMs = 9000
): Promise<{ stories: RawNewsStory[]; error?: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(source.url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (compatible; HeyPrince-NewsBot/1.0; +https://heyprince.in)',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const err = `HTTP ${response.status} ${response.statusText}`;
      await updateDailyNewsSource(source.id, {
        lastStatus: 'error',
        errorMessage: err,
        lastFetchedAt: new Date().toISOString(),
      });
      return { stories: [], error: err };
    }

    const xmlText = await response.text();
    if (!xmlText || xmlText.trim().length === 0) {
      const err = 'Empty response from feed';
      await updateDailyNewsSource(source.id, {
        lastStatus: 'error',
        errorMessage: err,
        lastFetchedAt: new Date().toISOString(),
      });
      return { stories: [], error: err };
    }

    const stories = parseFeedXml(xmlText, source);

    await updateDailyNewsSource(source.id, {
      lastStatus: 'ok',
      errorMessage: null,
      lastFetchedAt: new Date().toISOString(),
    });

    return { stories };
  } catch (err: any) {
    const errorMsg =
      err?.name === 'AbortError'
        ? 'Feed request timed out after 9 seconds'
        : err?.message || 'Network error fetching feed';

    await updateDailyNewsSource(source.id, {
      lastStatus: 'error',
      errorMessage: errorMsg,
      lastFetchedAt: new Date().toISOString(),
    });

    return { stories: [], error: errorMsg };
  }
}

// ============================================================================
// 3. Title Similarity Check (Prevents Reposting Syndicated News)
// ============================================================================

function normalizeTitleForComparison(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateJaccardSimilarity(str1: string, str2: string): number {
  const words1 = new Set(normalizeTitleForComparison(str1).split(' ').filter((w) => w.length > 3));
  const words2 = new Set(normalizeTitleForComparison(str2).split(' ').filter((w) => w.length > 3));

  if (words1.size === 0 || words2.size === 0) return 0;

  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }

  const union = new Set([...words1, ...words2]).size;
  return union === 0 ? 0 : intersection / union;
}

// ============================================================================
// 4. Orchestrate Full News Collection & Deduplication
// ============================================================================

export async function collectDailyNews(lookbackHours = 24): Promise<{
  sourcesChecked: number;
  itemsDiscovered: number;
  duplicatesSkipped: number;
  availableItems: NormalizedNewsItem[];
  errors: { sourceName: string; error: string }[];
}> {
  const sources = await getDailyNewsSources(true); // only active sources
  const errors: { sourceName: string; error: string }[] = [];

  const cutoff = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);
  const collectedStories: RawNewsStory[] = [];

  // Fetch all active feeds concurrently with graceful individual failure
  const fetchPromises = sources.map(async (src) => {
    const res = await fetchFeed(src);
    if (res.error) {
      errors.push({ sourceName: src.name, error: res.error });
    }
    return res.stories;
  });

  const results = await Promise.all(fetchPromises);

  for (const stories of results) {
    for (const story of stories) {
      // Filter by lookback window if date is present
      if (story.publishedAt && story.publishedAt < cutoff) {
        continue;
      }
      collectedStories.push(story);
    }
  }

  // Deduplicate against database
  const saveResult = await saveDiscoveredNewsItems(collectedStories);

  // Retrieve fresh list of unused recent candidates
  const candidateItems = await getUnusedRecentNewsItems(lookbackHours);

  // Deduplicate title similarity among in-memory candidates
  const filteredCandidates: NormalizedNewsItem[] = [];
  for (const candidate of candidateItems) {
    const isDuplicate = filteredCandidates.some(
      (existing) => calculateJaccardSimilarity(existing.headline, candidate.headline) > 0.65
    );
    if (!isDuplicate) {
      filteredCandidates.push(candidate);
    }
  }

  return {
    sourcesChecked: sources.length,
    itemsDiscovered: saveResult.inserted,
    duplicatesSkipped: saveResult.duplicates,
    availableItems: filteredCandidates,
    errors,
  };
}

