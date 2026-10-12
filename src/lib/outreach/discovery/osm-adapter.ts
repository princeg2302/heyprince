import { DiscoveryProvider, DiscoverySearchParams, DiscoveryResult, DiscoveredBusinessRecord, extractDomain } from './types';

export class OpenStreetMapDiscoveryAdapter implements DiscoveryProvider {
  name = 'openstreetmap';

  private mapCategoryToOsmTag(cat: string): { key: string; value: string } {
    const lower = cat.toLowerCase();
    if (lower.includes('restaurant')) return { key: 'amenity', value: 'restaurant' };
    if (lower.includes('cafe') || lower.includes('coffee')) return { key: 'amenity', value: 'cafe' };
    if (lower.includes('hotel') || lower.includes('hospitality')) return { key: 'tourism', value: 'hotel' };
    if (lower.includes('retail') || lower.includes('store') || lower.includes('shop')) return { key: 'shop', value: '*' };
    if (lower.includes('agency') || lower.includes('consulting') || lower.includes('tech')) return { key: 'office', value: '*' };
    if (lower.includes('clinic') || lower.includes('dental') || lower.includes('health')) return { key: 'amenity', value: 'dentist' };
    if (lower.includes('salon') || lower.includes('spa')) return { key: 'shop', value: 'beauty' };
    return { key: 'amenity', value: 'restaurant' };
  }

  async search(params: DiscoverySearchParams): Promise<DiscoveryResult> {
    const limit = Math.min(params.limit || 20, 50);
    const { key, value } = this.mapCategoryToOsmTag(params.category);

    const safeCity = params.city.replace(/["'\\]/g, '').trim();

    // Overpass QL Query looking for city bounds
    const tagFilter = value === '*' ? `["${key}"]` : `["${key}"="${value}"]`;
    const overpassQuery = `
      [out:json][timeout:15];
      area["name"="${safeCity}"]->.searchArea;
      (
        node${tagFilter}(area.searchArea)["name"];
        way${tagFilter}(area.searchArea)["name"];
      );
      out tags center ${limit};
    `;

    const endpoint = 'https://overpass-api.de/api/interpreter';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'HeyPrince-LeadDiscovery/1.0 (it@heyprince.in)',
        },
        body: `data=${encodeURIComponent(overpassQuery)}`,
        signal: AbortSignal.timeout(12000),
      });

      if (!response.ok) {
        throw new Error(`OpenStreetMap Overpass API responded with HTTP ${response.status}`);
      }

      const json = await response.json();
      const elements = json.elements || [];

      const records: DiscoveredBusinessRecord[] = [];

      for (const el of elements) {
        const tags = el.tags || {};
        const name = tags.name || tags['name:en'];
        if (!name) continue;

        const websiteUrl = tags.website || tags['contact:website'] || tags.url || null;
        const { domain, normalizedDomain } = extractDomain(websiteUrl);

        const phone = tags.phone || tags['contact:phone'] || null;
        const email = tags.email || tags['contact:email'] || null;

        const street = tags['addr:street'] ? `${tags['addr:housenumber'] || ''} ${tags['addr:street']}`.trim() : null;
        const postalCode = tags['addr:postcode'] || null;
        const address = street ? `${street}, ${safeCity}` : tags['addr:full'] || safeCity;

        const lat = el.lat || el.center?.lat || null;
        const lon = el.lon || el.center?.lon || null;

        records.push({
          sourceProvider: 'openstreetmap',
          sourceProviderId: `osm_${el.type}_${el.id}`,
          name: name.trim(),
          websiteUrl,
          domain,
          normalizedDomain,
          phone,
          email,
          countryCode: params.countryCode.toUpperCase(),
          region: params.region || null,
          city: safeCity,
          address,
          postalCode,
          latitude: lat ? parseFloat(lat) : null,
          longitude: lon ? parseFloat(lon) : null,
          category: params.category,
          industry: tags[key] || params.category,
          metadata: {
            osmType: el.type,
            osmId: el.id,
            cuisine: tags.cuisine,
            brand: tags.brand,
            openingHours: tags.opening_hours,
          },
        });
      }

      return {
        records,
        totalFound: records.length,
        hasMore: false,
      };
    } catch (err: any) {
      console.warn(`[OpenStreetMapDiscoveryAdapter] Query failed for ${safeCity}: ${err.message}.`);
      return {
        records: [],
        totalFound: 0,
        hasMore: false,
      };
    }
  }
}

