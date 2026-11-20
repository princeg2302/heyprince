import { DiscoveryProvider, DiscoverySearchParams, DiscoveryResult, DiscoveredBusinessRecord, extractDomain } from './types';

export function mapCategoryToOsmTag(cat: string): { key: string; value: string } {
  const lower = cat.toLowerCase();
  if (lower.includes('software') || lower.includes('it services') || lower.includes('tech') || lower.includes('computer')) {
    return { key: 'office', value: 'it' };
  }
  if (lower.includes('startup') || lower.includes('coworking')) {
    return { key: 'amenity', value: 'coworking_space' };
  }
  if (lower.includes('agency') || lower.includes('marketing') || lower.includes('creative') || lower.includes('consulting')) {
    return { key: 'office', value: 'company' };
  }
  if (lower.includes('dental') || lower.includes('dentist')) {
    return { key: 'amenity', value: 'dentist' };
  }
  if (lower.includes('clinic') || lower.includes('health') || lower.includes('doctor') || lower.includes('medical')) {
    return { key: 'amenity', value: 'clinic' };
  }
  if (lower.includes('education') || lower.includes('coaching') || lower.includes('school') || lower.includes('institute')) {
    return { key: 'amenity', value: 'school' };
  }
  if (lower.includes('real estate') || lower.includes('construction') || lower.includes('architect')) {
    return { key: 'office', value: 'estate_agent' };
  }
  if (lower.includes('manufacturing') || lower.includes('industrial') || lower.includes('factory')) {
    return { key: 'industrial', value: '*' };
  }
  if (lower.includes('hotel') || lower.includes('hospitality') || lower.includes('resort') || lower.includes('travel')) {
    return { key: 'tourism', value: 'hotel' };
  }
  if (lower.includes('ecommerce') || lower.includes('retail') || lower.includes('store') || lower.includes('shop') || lower.includes('d2c')) {
    return { key: 'shop', value: '*' };
  }
  if (lower.includes('law') || lower.includes('legal') || lower.includes('finance') || lower.includes('accounting') || lower.includes('professional')) {
    return { key: 'office', value: 'lawyer' };
  }
  if (lower.includes('restaurant') || lower.includes('cafe')) {
    return { key: 'amenity', value: 'restaurant' };
  }
  return { key: 'office', value: 'company' };
}

export function getSearchKeywords(category: string): string[] {
  const lower = category.toLowerCase();
  if (lower.includes('it services') || lower.includes('software') || lower.includes('cloud') || lower.includes('tech consulting')) {
    return ['software company', 'IT services', 'technology consulting', 'cloud solutions', 'web development agency'];
  }
  if (lower.includes('startup') || lower.includes('newly launched')) {
    return ['startup tech', 'incubator', 'coworking space', 'digital agency', 'software labs'];
  }
  if (lower.includes('ecommerce') || lower.includes('d2c') || lower.includes('retail')) {
    return ['ecommerce brand', 'clothing boutique', 'retail store', 'consumer goods', 'specialty store'];
  }
  if (lower.includes('health') || lower.includes('clinic') || lower.includes('dental') || lower.includes('medical')) {
    return ['dental clinic', 'medical center', 'health clinic', 'physiotherapy clinic', 'diagnostic center'];
  }
  if (lower.includes('education') || lower.includes('coaching') || lower.includes('institute')) {
    return ['coaching institute', 'training academy', 'learning center', 'language school', 'tutoring academy'];
  }
  if (lower.includes('real estate') || lower.includes('construction') || lower.includes('architect')) {
    return ['real estate agency', 'property developers', 'architectural studio', 'construction company', 'interior design firm'];
  }
  if (lower.includes('manufacturing') || lower.includes('industrial')) {
    return ['manufacturing company', 'industrial machinery', 'automation systems', 'logistics warehouse', 'fabrication plant'];
  }
  if (lower.includes('hotel') || lower.includes('hospitality') || lower.includes('travel')) {
    return ['boutique hotel', 'luxury resort', 'travel agency', 'tour operator', 'hospitality suites'];
  }
  if (lower.includes('agency') || lower.includes('marketing') || lower.includes('creative')) {
    return ['marketing agency', 'digital advertising agency', 'creative design studio', 'PR communications', 'SEO consulting'];
  }
  if (lower.includes('law') || lower.includes('finance') || lower.includes('consulting') || lower.includes('professional')) {
    return ['law firm', 'corporate legal consultants', 'chartered accountants', 'wealth management', 'financial advisory'];
  }
  if (lower.includes('outdated') || lower.includes('speed') || lower.includes('web development')) {
    return ['local business', 'commercial services', 'consulting office', 'equipment supplier'];
  }
  const cleaned = category.replace(/&/g, ' ').replace(/[^\w\s]/g, '').trim();
  return [cleaned, `${cleaned} company`, `${cleaned} services`];
}

export class OpenStreetMapDiscoveryAdapter implements DiscoveryProvider {
  name = 'openstreetmap';

  private mapCategoryToOsmTag(cat: string): { key: string; value: string } {
    return mapCategoryToOsmTag(cat);
  }

  private getSearchKeywords(category: string): string[] {
    return getSearchKeywords(category);
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
