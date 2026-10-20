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

  private getSearchKeywords(category: string): string[] {
    const lower = category.toLowerCase();
    if (lower.includes('restaurant') || lower.includes('cafe')) {
      return ['restaurants', 'cafes', 'bistros', 'bakeries'];
    }
    if (lower.includes('hotel') || lower.includes('lodging')) {
      return ['hotels', 'boutique hotels', 'resorts'];
    }
    if (lower.includes('agency') || lower.includes('tech') || lower.includes('consulting')) {
      return ['marketing agency', 'software company', 'consulting'];
    }
    if (lower.includes('health') || lower.includes('clinic') || lower.includes('dental')) {
      return ['dentist', 'dental clinic', 'medical center', 'health clinic'];
    }
    if (lower.includes('retail') || lower.includes('store') || lower.includes('shop')) {
      return ['boutique', 'bookstore', 'supermarket', 'specialty shop'];
    }
    if (lower.includes('auto') || lower.includes('car')) {
      return ['car repair', 'auto service', 'mechanic'];
    }
    const cleaned = category.replace(/&/g, ' ').replace(/[^\w\s]/g, '').trim();
    return [cleaned];
  }

  async search(params: DiscoverySearchParams): Promise<DiscoveryResult> {
    const limit = Math.min(params.limit || 20, 50);
    const safeCity = params.city.replace(/["'\\]/g, '').trim();
    const records: DiscoveredBusinessRecord[] = [];
    const seenIds = new Set<string>();

    // --------------------------------------------------------------------------
    // Strategy 1: OpenStreetMap Nominatim Search (Fast, High Availability, No 504s)
    // --------------------------------------------------------------------------
    try {
      const keywords = this.getSearchKeywords(params.category);
      const searchQueries: string[] = [];

      for (const kw of keywords) {
        searchQueries.push(`${kw} in ${safeCity}, ${params.countryCode}`);
        searchQueries.push(`${kw} in ${safeCity}`);
      }

      for (const queryStr of searchQueries) {
        if (records.length >= limit) break;

        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          queryStr
        )}&format=json&addressdetails=1&extratags=1&limit=${limit}`;

        const nomRes = await fetch(nominatimUrl, {
          headers: {
            'User-Agent': 'HeyPrince-LeadDiscovery/1.0 (contact@heyprince.in)',
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(8000),
        });

        if (!nomRes.ok) continue;

        const nomData = await nomRes.json();
        if (!Array.isArray(nomData)) continue;

        for (const item of nomData) {
          if (records.length >= limit) break;

          const osmId = `osm_${item.osm_type || 'node'}_${item.osm_id || item.place_id}`;
          if (seenIds.has(osmId)) continue;
          seenIds.add(osmId);

          const name = item.name || item.display_name?.split(',')[0];
          if (!name || name.trim().length === 0) continue;

          const extra = item.extratags || {};
          const addr = item.address || {};

          // Extract website & contact
          const rawWebsite =
            extra.website ||
            extra['contact:website'] ||
            extra.url ||
            null;

          const { domain, normalizedDomain } = extractDomain(rawWebsite);

          const phone = extra.phone || extra['contact:phone'] || null;
          const email = extra.email || extra['contact:email'] || null;

          // Address assembly
          const street = addr.road ? `${addr.house_number || ''} ${addr.road}`.trim() : null;
          const cityFound = addr.city || addr.town || addr.village || safeCity;
          const fullAddress = street ? `${street}, ${cityFound}` : item.display_name || safeCity;

          records.push({
            sourceProvider: 'openstreetmap',
            sourceProviderId: osmId,
            name: name.trim(),
            websiteUrl: rawWebsite,
            domain,
            normalizedDomain,
            phone,
            email,
            countryCode: (addr.country_code || params.countryCode).toUpperCase(),
            region: addr.state || params.region || null,
            city: cityFound,
            address: fullAddress,
            postalCode: addr.postcode || null,
            latitude: item.lat ? parseFloat(item.lat) : null,
            longitude: item.lon ? parseFloat(item.lon) : null,
            category: params.category,
            industry: item.type || item.class || params.category,
            metadata: {
              osmType: item.osm_type,
              osmId: item.osm_id,
              placeRank: item.place_rank,
              importance: item.importance,
              cuisine: extra.cuisine,
              brand: extra.brand,
              openingHours: extra.opening_hours,
            },
          });
        }
      }
    } catch (nomErr: any) {
      console.warn(`[OpenStreetMapDiscoveryAdapter] Nominatim query error: ${nomErr.message}`);
    }

    // --------------------------------------------------------------------------
    // Strategy 2: If Nominatim produced results, return immediately
    // --------------------------------------------------------------------------
    if (records.length > 0) {
      return {
        records,
        totalFound: records.length,
        hasMore: false,
      };
    }

    // --------------------------------------------------------------------------
    // Strategy 3: Overpass QL Fallback (with multiple mirror endpoints)
    // --------------------------------------------------------------------------
    const { key, value } = this.mapCategoryToOsmTag(params.category);
    const tagFilter = value === '*' ? `["${key}"]` : `["${key}"="${value}"]`;
    const overpassQuery = `
      [out:json][timeout:10];
      area["name"="${safeCity}"]->.searchArea;
      (
        node${tagFilter}(area.searchArea)["name"];
        way${tagFilter}(area.searchArea)["name"];
      );
      out tags center ${limit};
    `;

    const overpassMirrors = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
      'https://overpass.private.coffee/api/interpreter',
    ];

    for (const endpoint of overpassMirrors) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'HeyPrince-LeadDiscovery/1.0 (contact@heyprince.in)',
          },
          body: `data=${encodeURIComponent(overpassQuery)}`,
          signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) continue;

        const json = await response.json();
        const elements = json.elements || [];

        for (const el of elements) {
          const tags = el.tags || {};
          const name = tags.name || tags['name:en'];
          if (!name) continue;

          const osmId = `osm_${el.type}_${el.id}`;
          if (seenIds.has(osmId)) continue;
          seenIds.add(osmId);

          const websiteUrl = tags.website || tags['contact:website'] || tags.url || null;
          const { domain, normalizedDomain } = extractDomain(websiteUrl);

          const phone = tags.phone || tags['contact:phone'] || null;
          const email = tags.email || tags['contact:email'] || null;

          const street = tags['addr:street']
            ? `${tags['addr:housenumber'] || ''} ${tags['addr:street']}`.trim()
            : null;
          const postalCode = tags['addr:postcode'] || null;
          const address = street ? `${street}, ${safeCity}` : tags['addr:full'] || safeCity;

          const lat = el.lat || el.center?.lat || null;
          const lon = el.lon || el.center?.lon || null;

          records.push({
            sourceProvider: 'openstreetmap',
            sourceProviderId: osmId,
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

        if (records.length > 0) break;
      } catch {
        // Try next mirror
      }
    }

    return {
      records,
      totalFound: records.length,
      hasMore: false,
    };
  }
}
