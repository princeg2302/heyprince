import { sanitizeAiContent, sanitizeEmDashes } from '../ai-content-sanitizer';
import crypto from 'crypto';
import { query } from '../outreach/db';
import {
  DailyNewsSettings,
  DailyNewsSource,
  NormalizedNewsItem,
  DailyNewsRunRecord,
  RunStatus,
  WebsiteStatus,
  LinkedInStatus,
} from './types';

// ============================================================================
// 1. Settings Operations
// ============================================================================

export async function getDailyNewsSettings(): Promise<DailyNewsSettings> {
  const rows = await query(`
    SELECT * FROM daily_news_settings ORDER BY id ASC LIMIT 1;
  `);

  if (!rows || rows.length === 0) {
    // Return sensible in-memory fallback
    return {
      id: 1,
      isEnabled: true,
      autoGenerate: true,
      autoPublishWebsite: false,
      autoPublishLinkedIn: false,
      scheduleCron: '30 3 * * *',
      scheduleDisplay: '9:00 AM IST',
      topics: [
        'Artificial Intelligence & Tools',
        'Web Development & JavaScript Frameworks',
        'Software Engineering & Developer Tools',
        'Cybersecurity & Technology Security',
        'Startups & IT Industry Developments',
      ],
      lookbackHours: 24,
      aiProvider: 'gemini',
      aiModel: 'gemini-3.8-flash',
      seasonalMode: 'auto',
      seasonalManualTheme: 'autumn',
      weatherCity: 'Delhi, India',
      weatherLatitude: 28.6139,
      weatherLongitude: 77.2090,
      isSeasonalEnabled: true,
      contentMix: {
        tech_news: 4,
        deep_analysis: 1,
        office_humour_meme: 2,
        event_roundup: 0,
      },
      currentContentType: 'tech_news',
      updatedAt: new Date().toISOString(),
    };
  }

  const r = rows[0];
  return {
    id: r.id,
    isEnabled: Boolean(r.is_enabled),
    autoGenerate: Boolean(r.auto_generate),
    autoPublishWebsite: Boolean(r.auto_publish_website),
    autoPublishLinkedIn: Boolean(r.auto_publish_linkedin),
    scheduleCron: r.schedule_cron || '30 3 * * *',
    scheduleDisplay: r.schedule_display || '9:00 AM IST',
    topics: Array.isArray(r.topics) ? r.topics : [],
    lookbackHours: r.lookback_hours || 24,
    aiProvider: r.ai_provider || 'gemini',
    aiModel: r.ai_model || 'gemini-3.8-flash',
    seasonalMode: r.seasonal_mode || 'auto',
    seasonalManualTheme: r.seasonal_manual_theme || 'autumn',
    weatherCity: r.weather_city || 'Delhi, India',
    weatherLatitude: r.weather_latitude ? Number(r.weather_latitude) : 28.6139,
    weatherLongitude: r.weather_longitude ? Number(r.weather_longitude) : 77.2090,
    isSeasonalEnabled: r.is_seasonal_enabled !== undefined ? Boolean(r.is_seasonal_enabled) : true,
    contentMix: r.content_mix || {
      tech_news: 4,
      deep_analysis: 1,
      office_humour_meme: 2,
      event_roundup: 0,
    },
    currentContentType: r.current_content_type || 'tech_news',
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
  };
}

export async function updateDailyNewsSettings(
  updates: Partial<DailyNewsSettings>
): Promise<DailyNewsSettings> {
  const current = await getDailyNewsSettings();

  const isEnabled = updates.isEnabled !== undefined ? updates.isEnabled : current.isEnabled;
  const autoGenerate = updates.autoGenerate !== undefined ? updates.autoGenerate : current.autoGenerate;
  const autoPublishWebsite =
    updates.autoPublishWebsite !== undefined ? updates.autoPublishWebsite : current.autoPublishWebsite;
  const autoPublishLinkedIn =
    updates.autoPublishLinkedIn !== undefined ? updates.autoPublishLinkedIn : current.autoPublishLinkedIn;
  const scheduleCron = updates.scheduleCron || current.scheduleCron;
  const scheduleDisplay = updates.scheduleDisplay || current.scheduleDisplay;
  const topics = updates.topics || current.topics;
  const lookbackHours = updates.lookbackHours || current.lookbackHours;
  const aiProvider = updates.aiProvider || current.aiProvider;
  const aiModel = updates.aiModel || current.aiModel;
  const seasonalMode = updates.seasonalMode || current.seasonalMode || 'auto';
  const seasonalManualTheme = updates.seasonalManualTheme || current.seasonalManualTheme || 'autumn';
  const weatherCity = updates.weatherCity || current.weatherCity || 'Delhi, India';
  const weatherLatitude = updates.weatherLatitude !== undefined ? updates.weatherLatitude : current.weatherLatitude;
  const weatherLongitude = updates.weatherLongitude !== undefined ? updates.weatherLongitude : current.weatherLongitude;
  const isSeasonalEnabled =
    updates.isSeasonalEnabled !== undefined ? updates.isSeasonalEnabled : current.isSeasonalEnabled;
  const contentMix = updates.contentMix || current.contentMix;
  const currentContentType = updates.currentContentType || current.currentContentType || 'tech_news';

  await query(
    `
    UPDATE daily_news_settings
    SET
      is_enabled = $1,
      auto_generate = $2,
      auto_publish_website = $3,
      auto_publish_linkedin = $4,
      schedule_cron = $5,
      schedule_display = $6,
      topics = $7,
      lookback_hours = $8,
      ai_provider = $9,
      ai_model = $10,
      seasonal_mode = $11,
      seasonal_manual_theme = $12,
      weather_city = $13,
      weather_latitude = $14,
      weather_longitude = $15,
      is_seasonal_enabled = $16,
      content_mix = $17,
      current_content_type = $18,
      updated_at = NOW()
    WHERE id = $19;
    `,
    [
      isEnabled,
      autoGenerate,
      autoPublishWebsite,
      autoPublishLinkedIn,
      scheduleCron,
      scheduleDisplay,
      topics,
      lookbackHours,
      aiProvider,
      aiModel,
      seasonalMode,
      seasonalManualTheme,
      weatherCity,
      weatherLatitude,
      weatherLongitude,
      isSeasonalEnabled,
      JSON.stringify(contentMix),
      currentContentType,
      current.id,
    ]
  );

  return getDailyNewsSettings();
}

// ============================================================================
// 2. Sources Operations
// ============================================================================

export async function getDailyNewsSources(onlyActive = false): Promise<DailyNewsSource[]> {
  const text = onlyActive
    ? `SELECT * FROM daily_news_sources WHERE is_active = true ORDER BY priority ASC, name ASC;`
    : `SELECT * FROM daily_news_sources ORDER BY is_active DESC, priority ASC, name ASC;`;

  const rows = await query(text);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    url: r.url,
    feedType: r.feed_type,
    category: r.category,
    region: r.region || 'Global',
    language: r.language || 'en',
    topic: r.topic || 'Artificial Intelligence',
    priority: r.priority || 1,
    isActive: Boolean(r.is_active),
    lastFetchedAt: r.last_fetched_at ? new Date(r.last_fetched_at).toISOString() : null,
    lastStatus: r.last_status || 'pending',
    errorMessage: r.error_message || null,
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
  }));
}

export async function addDailyNewsSource(data: {
  name: string;
  url: string;
  category?: string;
  region?: string;
  language?: string;
  topic?: string;
  priority?: number;
  feedType?: 'rss' | 'atom' | 'api';
}): Promise<DailyNewsSource> {
  const rows = await query(
    `
    INSERT INTO daily_news_sources (name, url, category, region, language, topic, priority, feed_type, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
    RETURNING *;
    `,
    [
      data.name.trim(),
      data.url.trim(),
      data.category || 'Technology & AI',
      data.region || 'Global',
      data.language || 'en',
      data.topic || 'Artificial Intelligence',
      data.priority || 1,
      data.feedType || 'rss',
    ]
  );

  const r = rows[0];
  return {
    id: r.id,
    name: r.name,
    url: r.url,
    feedType: r.feed_type,
    category: r.category,
    region: r.region || 'Global',
    language: r.language || 'en',
    topic: r.topic || 'Artificial Intelligence',
    priority: r.priority || 1,
    isActive: Boolean(r.is_active),
    lastFetchedAt: null,
    lastStatus: 'pending',
    errorMessage: null,
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
  };
}

export async function updateDailyNewsSource(
  id: number,
  updates: Partial<DailyNewsSource>
): Promise<boolean> {
  const fields: string[] = [];
  const params: any[] = [];
  let pIdx = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${pIdx++}`);
    params.push(updates.name.trim());
  }
  if (updates.url !== undefined) {
    fields.push(`url = $${pIdx++}`);
    params.push(updates.url.trim());
  }
  if (updates.category !== undefined) {
    fields.push(`category = $${pIdx++}`);
    params.push(updates.category);
  }
  if (updates.region !== undefined) {
    fields.push(`region = $${pIdx++}`);
    params.push(updates.region);
  }
  if (updates.language !== undefined) {
    fields.push(`language = $${pIdx++}`);
    params.push(updates.language);
  }
  if (updates.topic !== undefined) {
    fields.push(`topic = $${pIdx++}`);
    params.push(updates.topic);
  }
  if (updates.priority !== undefined) {
    fields.push(`priority = $${pIdx++}`);
    params.push(updates.priority);
  }
  if (updates.isActive !== undefined) {
    fields.push(`is_active = $${pIdx++}`);
    params.push(updates.isActive);
  }
  if (updates.lastStatus !== undefined) {
    fields.push(`last_status = $${pIdx++}`);
    params.push(updates.lastStatus);
  }
  if (updates.errorMessage !== undefined) {
    fields.push(`error_message = $${pIdx++}`);
    params.push(updates.errorMessage);
  }
  if (updates.lastFetchedAt !== undefined) {
    fields.push(`last_fetched_at = $${pIdx++}`);
    params.push(updates.lastFetchedAt ? new Date(updates.lastFetchedAt) : null);
  }

  if (fields.length === 0) return true;

  fields.push(`updated_at = NOW()`);
  params.push(id);

  await query(
    `UPDATE daily_news_sources SET ${fields.join(', ')} WHERE id = $${pIdx};`,
    params
  );
  return true;
}

export async function deleteDailyNewsSource(id: number): Promise<boolean> {
  await query(`DELETE FROM daily_news_sources WHERE id = $1;`, [id]);
  return true;
}

export async function deleteDailyNewsSourcesBulk(ids: number[]): Promise<boolean> {
  if (ids.length === 0) return true;
  await query(`DELETE FROM daily_news_sources WHERE id = ANY($1::int[]);`, [ids]);
  return true;
}

export async function deleteDailyRunsBulk(ids: number[]): Promise<boolean> {
  if (ids.length === 0) return true;
  await query(`DELETE FROM daily_news_runs WHERE id = ANY($1::int[]);`, [ids]);
  return true;
}

// ============================================================================
// 3. News Items & Canonical Deduplication
// ============================================================================

export function computeUrlHash(url: string): string {
  // Normalize URL by lowercasing hostname, stripping trackers and trailing slash
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    // Strip common tracking parameters
    const trackers = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'ref',
      'fbclid',
      'gclid',
    ];
    trackers.forEach((t) => parsed.searchParams.delete(t));
    const cleanUrl = parsed.toString().replace(/\/$/, '');
    return crypto.createHash('sha256').update(cleanUrl).digest('hex');
  } catch {
    return crypto.createHash('sha256').update(url.trim().toLowerCase()).digest('hex');
  }
}

export async function saveDiscoveredNewsItems(
  items: {
    sourceId?: number;
    sourceName: string;
    headline: string;
    url: string;
    summary?: string;
    publishedAt?: Date | null;
  }[]
): Promise<{ inserted: number; duplicates: number }> {
  let inserted = 0;
  let duplicates = 0;

  const validItems = items.filter((item) => item.headline && item.url);
  if (validItems.length === 0) return { inserted: 0, duplicates: 0 };

  const CHUNK_SIZE = 50;
  for (let i = 0; i < validItems.length; i += CHUNK_SIZE) {
    const chunk = validItems.slice(i, i + CHUNK_SIZE);
    const valuePlaceholders: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    for (const item of chunk) {
      const urlHash = computeUrlHash(item.url);
      const pubDate = item.publishedAt ? item.publishedAt.toISOString() : new Date().toISOString();

      valuePlaceholders.push(
        `($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`
      );
      params.push(
        item.sourceId || null,
        item.sourceName,
        item.headline.trim(),
        item.url.trim(),
        urlHash,
        item.summary?.trim() || '',
        pubDate
      );
    }

    try {
      const sql = `
        INSERT INTO daily_news_items (
          source_id,
          source_name,
          headline,
          url,
          url_hash,
          summary,
          published_at
        ) VALUES ${valuePlaceholders.join(', ')}
        ON CONFLICT (url_hash) DO NOTHING
        RETURNING id;
      `;
      const res = await query(sql, params);
      const insertedCount = res ? res.length : 0;
      inserted += insertedCount;
      duplicates += chunk.length - insertedCount;
    } catch (err) {
      console.warn('[db] Batch insert error, falling back to sequential item inserts:', err);
      for (const item of chunk) {
        try {
          const urlHash = computeUrlHash(item.url);
          const pubDate = item.publishedAt ? item.publishedAt.toISOString() : new Date().toISOString();
          const singleRes = await query(
            `
            INSERT INTO daily_news_items (
              source_id,
              source_name,
              headline,
              url,
              url_hash,
              summary,
              published_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (url_hash) DO NOTHING
            RETURNING id;
            `,
            [
              item.sourceId || null,
              item.sourceName,
              item.headline.trim(),
              item.url.trim(),
              urlHash,
              item.summary?.trim() || '',
              pubDate,
            ]
          );
          if (singleRes && singleRes.length > 0) {
            inserted++;
          } else {
            duplicates++;
          }
        } catch {
          duplicates++;
        }
      }
    }
  }

  return { inserted, duplicates };
}

export async function getUnusedRecentNewsItems(lookbackHours = 24): Promise<NormalizedNewsItem[]> {
  const cutoff = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString();

  const rows = await query(
    `
    SELECT * FROM daily_news_items
    WHERE is_used = false
      AND (published_at >= $1 OR discovered_at >= $1)
    ORDER BY published_at DESC
    LIMIT 40;
    `,
    [cutoff]
  );

  return rows.map((r) => ({
    id: r.id,
    sourceId: r.source_id,
    sourceName: r.source_name,
    headline: r.headline,
    url: r.url,
    urlHash: r.url_hash,
    summary: r.summary || '',
    publishedAt: new Date(r.published_at).toISOString(),
    discoveredAt: new Date(r.discovered_at).toISOString(),
    isUsed: Boolean(r.is_used),
    usedInRunId: r.used_in_run_id,
  }));
}

export async function markNewsItemsUsed(itemIds: number[], runId: number): Promise<void> {
  if (!itemIds || itemIds.length === 0) return;
  await query(
    `UPDATE daily_news_items SET is_used = true, used_in_run_id = $1 WHERE id = ANY($2::int[]);`,
    [runId, itemIds]
  );
}

// ============================================================================
// 4. Daily News Runs (Idempotency & Execution State Machine)
// ============================================================================

export async function getDailyRunByDate(dateStr: string): Promise<DailyNewsRunRecord | null> {
  const rows = await query(
    `SELECT * FROM daily_news_runs WHERE run_date = $1 ORDER BY id DESC LIMIT 1;`,
    [dateStr]
  );
  if (!rows || rows.length === 0) return null;
  const run = mapRunRow(rows[0]);

  // If a previous execution remained stuck in 'running' for over 3 minutes (past serverless timeout), auto-expire it
  if (run.status === 'running' && run.startedAt) {
    const startedMs = new Date(run.startedAt).getTime();
    if (Date.now() - startedMs > 3 * 60 * 1000) {
      await updateDailyRun(run.id, {
        status: 'failed',
        errorDetails: {
          stage: 'timeout',
          message: 'Process execution timed out or was terminated abruptly. Automatically expired to release execution lock.',
          timestamp: new Date().toISOString(),
        },
        completedAt: new Date().toISOString(),
      });
      run.status = 'failed';
    }
  }

  return run;
}

export async function getDailyRunById(id: number): Promise<DailyNewsRunRecord | null> {
  const rows = await query(`SELECT * FROM daily_news_runs WHERE id = $1 LIMIT 1;`, [id]);
  if (!rows || rows.length === 0) return null;
  return mapRunRow(rows[0]);
}

export async function getRecentDailyRuns(limit = 15): Promise<DailyNewsRunRecord[]> {
  const rows = await query(
    `SELECT * FROM daily_news_runs ORDER BY id DESC LIMIT $1;`,
    [limit]
  );
  return rows.map(mapRunRow);
}

export async function createDailyRun(params: {
  runDate: string; // YYYY-MM-DD
  triggerType: 'scheduled' | 'manual_run' | 'preview';
}): Promise<DailyNewsRunRecord> {
  // If preview, or if testing, we generate a unique timestamped run date if needed
  const dateKey = params.triggerType === 'preview' ? `${params.runDate}-${Date.now()}` : params.runDate;

  const rows = await query(
    `
    INSERT INTO daily_news_runs (
      run_date,
      trigger_type,
      status,
      website_status,
      linkedin_status,
      started_at
    ) VALUES ($1, $2, 'running', 'pending', 'pending', NOW())
    RETURNING *;
    `,
    [dateKey, params.triggerType]
  );

  return mapRunRow(rows[0]);
}

export async function updateDailyRun(
  runId: number,
  updates: Partial<DailyNewsRunRecord>
): Promise<DailyNewsRunRecord> {
  const fields: string[] = [];
  const params: any[] = [];
  let pIdx = 1;

  if (updates.status !== undefined) {
    fields.push(`status = $${pIdx++}`);
    params.push(updates.status);
  }
  if (updates.sourcesChecked !== undefined) {
    fields.push(`sources_checked = $${pIdx++}`);
    params.push(updates.sourcesChecked);
  }
  if (updates.itemsDiscovered !== undefined) {
    fields.push(`items_discovered = $${pIdx++}`);
    params.push(updates.itemsDiscovered);
  }
  if (updates.duplicatesSkipped !== undefined) {
    fields.push(`duplicates_skipped = $${pIdx++}`);
    params.push(updates.duplicatesSkipped);
  }
  if (updates.selectedItems !== undefined) {
    fields.push(`selected_items = $${pIdx++}`);
    params.push(JSON.stringify(updates.selectedItems));
  }
  if (updates.articleTitle !== undefined) {
    fields.push(`article_title = $${pIdx++}`);
    params.push(sanitizeEmDashes(updates.articleTitle));
  }
  if (updates.articleSlug !== undefined) {
    fields.push(`article_slug = $${pIdx++}`);
    params.push(updates.articleSlug);
  }
  if (updates.articleExcerpt !== undefined) {
    fields.push(`article_excerpt = $${pIdx++}`);
    params.push(sanitizeEmDashes(updates.articleExcerpt));
  }
  if (updates.articleContent !== undefined) {
    fields.push(`article_content = $${pIdx++}`);
    params.push(JSON.stringify(sanitizeAiContent(updates.articleContent)));
  }
  if (updates.linkedinCommentary !== undefined) {
    fields.push(`linkedin_commentary = $${pIdx++}`);
    params.push(sanitizeEmDashes(updates.linkedinCommentary));
  }
  if (updates.postId !== undefined) {
    fields.push(`post_id = $${pIdx++}`);
    params.push(updates.postId);
  }
  if (updates.websiteStatus !== undefined) {
    fields.push(`website_status = $${pIdx++}`);
    params.push(updates.websiteStatus);
  }
  if (updates.linkedinStatus !== undefined) {
    fields.push(`linkedin_status = $${pIdx++}`);
    params.push(updates.linkedinStatus);
  }
  if (updates.linkedinPostUrn !== undefined) {
    fields.push(`linkedin_post_urn = $${pIdx++}`);
    params.push(updates.linkedinPostUrn);
  }
  if (updates.linkedinShareUrl !== undefined) {
    fields.push(`linkedin_share_url = $${pIdx++}`);
    params.push(updates.linkedinShareUrl);
  }
  if (updates.errorDetails !== undefined) {
    fields.push(`error_details = $${pIdx++}`);
    params.push(JSON.stringify(updates.errorDetails));
  }
  if (updates.completedAt !== undefined) {
    fields.push(`completed_at = $${pIdx++}`);
    params.push(updates.completedAt ? new Date(updates.completedAt) : new Date());
  }

  params.push(runId);
  const rows = await query(
    `UPDATE daily_news_runs SET ${fields.join(', ')} WHERE id = $${pIdx} RETURNING *;`,
    params
  );

  return mapRunRow(rows[0]);
}

function mapRunRow(r: any): DailyNewsRunRecord {
  return {
    id: r.id,
    runDate: typeof r.run_date === 'string' ? r.run_date : new Date(r.run_date).toISOString().split('T')[0],
    status: r.status as RunStatus,
    triggerType: r.trigger_type,
    sourcesChecked: r.sources_checked || 0,
    itemsDiscovered: r.items_discovered || 0,
    duplicatesSkipped: r.duplicates_skipped || 0,
    selectedItems: r.selected_items || [],
    articleTitle: r.article_title || undefined,
    articleSlug: r.article_slug || undefined,
    articleExcerpt: r.article_excerpt || undefined,
    articleContent: r.article_content || undefined,
    linkedinCommentary: r.linkedin_commentary || undefined,
    postId: r.post_id || null,
    websiteStatus: r.website_status as WebsiteStatus,
    linkedinStatus: r.linkedin_status as LinkedInStatus,
    linkedinPostUrn: r.linkedin_post_urn || null,
    linkedinShareUrl: r.linkedin_share_url || null,
    errorDetails: r.error_details || null,
    startedAt: new Date(r.started_at).toISOString(),
    completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : null,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

