import { query } from './outreach/db';

export interface SocialLinkItem {
  id?: number;
  platform: 'linkedin' | 'instagram' | 'whatsapp' | 'github' | 'twitter' | 'youtube' | string;
  url: string;
  label: string;
  is_active: boolean;
  updated_at?: string;
}

export const DEFAULT_SOCIAL_LINKS: Record<string, string> = {
  linkedin: 'https://www.linkedin.com/in/mr-goyal/',
  instagram: 'https://www.instagram.com/heyprince.in/',
  whatsapp: 'https://wa.me/919120900010',
  github: 'https://github.com/princeg2302',
  twitter: '',
  youtube: '',
};

export async function getAllSocialLinks(): Promise<SocialLinkItem[]> {
  try {
    const rows = await query<SocialLinkItem>(
      `SELECT * FROM site_social_links ORDER BY id ASC;`
    );
    if (rows && rows.length > 0) {
      return rows;
    }
  } catch (err) {
    console.warn('[getAllSocialLinks] Database read failed, using fallbacks:', err);
  }

  // Fallback defaults
  return [
    { platform: 'linkedin', url: DEFAULT_SOCIAL_LINKS.linkedin, label: 'LinkedIn', is_active: true },
    { platform: 'instagram', url: DEFAULT_SOCIAL_LINKS.instagram, label: 'Instagram', is_active: true },
    { platform: 'whatsapp', url: DEFAULT_SOCIAL_LINKS.whatsapp, label: 'WhatsApp', is_active: true },
    { platform: 'github', url: DEFAULT_SOCIAL_LINKS.github, label: 'GitHub', is_active: true },
    { platform: 'twitter', url: '', label: 'Twitter / X', is_active: false },
    { platform: 'youtube', url: '', label: 'YouTube', is_active: false },
  ];
}

export async function updateSocialLink(platform: string, url: string, is_active: boolean): Promise<boolean> {
  await query(
    `INSERT INTO site_social_links (platform, url, label, is_active, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (platform) DO UPDATE SET
       url = EXCLUDED.url,
       is_active = EXCLUDED.is_active,
       updated_at = NOW();`,
    [platform, url.trim(), platform.charAt(0).toUpperCase() + platform.slice(1), is_active]
  );
  return true;
}

export async function updateMultipleSocialLinks(links: { platform: string; url: string; is_active: boolean }[]): Promise<boolean> {
  for (const item of links) {
    await updateSocialLink(item.platform, item.url, item.is_active);
  }
  return true;
}
