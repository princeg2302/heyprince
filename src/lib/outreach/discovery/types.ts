export interface DiscoveredBusinessRecord {
  sourceProvider: string;
  sourceProviderId: string;
  name: string;
  websiteUrl: string | null;
  domain: string | null;
  normalizedDomain: string | null;
  phone: string | null;
  email: string | null;
  countryCode: string;
  region: string | null;
  city: string | null;
  address: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  category: string;
  industry: string;
  metadata: Record<string, any>;
}

export interface DiscoverySearchParams {
  countryCode: string;
  city: string;
  category: string;
  region?: string;
  limit?: number;
  cursor?: Record<string, any>;
}

export interface DiscoveryResult {
  records: DiscoveredBusinessRecord[];
  nextCursor?: Record<string, any>;
  hasMore: boolean;
  totalFound: number;
}

export interface DiscoveryProvider {
  name: string;
  search(params: DiscoverySearchParams): Promise<DiscoveryResult>;
}

export function extractDomain(urlStr?: string | null): { domain: string | null; normalizedDomain: string | null } {
  if (!urlStr || !urlStr.trim()) return { domain: null, normalizedDomain: null };
  try {
    let clean = urlStr.trim();
    if (!/^https?:\/\//i.test(clean)) {
      clean = 'https://' + clean;
    }
    const parsed = new URL(clean);
    const host = parsed.hostname.toLowerCase();
    const normalized = host.replace(/^www\./i, '');
    return { domain: host, normalizedDomain: normalized };
  } catch {
    return { domain: null, normalizedDomain: null };
  }
}
