import { query } from './outreach/db';

export interface SiteVisibilitySettings {
  services_and_contact_enabled: boolean;
  updated_at?: string;
}

// In-memory fallback and cache with 10s TTL
let cachedSettings: SiteVisibilitySettings = {
  services_and_contact_enabled: true,
};
let lastFetched = 0;

export async function getSiteVisibilitySettings(): Promise<SiteVisibilitySettings> {
  const now = Date.now();
  if (now - lastFetched < 10000) {
    return cachedSettings;
  }

  try {
    // Ensure table exists
    await query(`
      CREATE TABLE IF NOT EXISTS site_feature_flags (
        key VARCHAR(100) PRIMARY KEY,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    const rows = await query<{ key: string; enabled: boolean }>(
      `SELECT key, enabled FROM site_feature_flags WHERE key = 'services_and_contact';`
    );

    if (rows && rows.length > 0) {
      cachedSettings = {
        services_and_contact_enabled: Boolean(rows[0].enabled),
      };
    } else {
      await query(
        `INSERT INTO site_feature_flags (key, enabled, updated_at)
         VALUES ('services_and_contact', true, NOW())
         ON CONFLICT (key) DO NOTHING;`
      );
      cachedSettings = { services_and_contact_enabled: true };
    }
    lastFetched = now;
  } catch (err) {
    console.warn('[getSiteVisibilitySettings] Database read error, using cache:', err);
  }

  return cachedSettings;
}

export async function setSiteVisibilitySettings(enabled: boolean): Promise<SiteVisibilitySettings> {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS site_feature_flags (
        key VARCHAR(100) PRIMARY KEY,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await query(
      `INSERT INTO site_feature_flags (key, enabled, updated_at)
       VALUES ('services_and_contact', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET
         enabled = EXCLUDED.enabled,
         updated_at = NOW();`,
      [enabled]
    );

    cachedSettings = { services_and_contact_enabled: enabled };
    lastFetched = Date.now();
  } catch (err) {
    console.error('[setSiteVisibilitySettings] Error updating feature flag:', err);
    throw err;
  }

  return cachedSettings;
}

