import { DiscoveryProvider, DiscoverySearchParams, DiscoveryResult } from './types';
import { OpenStreetMapDiscoveryAdapter } from './osm-adapter';
import { MockDiscoveryAdapter } from './mock-adapter';
import {
  createDiscoveryJob,
  updateDiscoveryJob,
  upsertBusiness,
  upsertContact,
  findBusinessByDomain,
} from '../db';
import { DiscoveryJobEntity } from '../types';

export class DiscoveryService {
  private providers: Map<string, DiscoveryProvider> = new Map();

  constructor() {
    this.registerProvider(new OpenStreetMapDiscoveryAdapter());
    this.registerProvider(new MockDiscoveryAdapter());
  }

  public registerProvider(provider: DiscoveryProvider): void {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  public getProvider(name: string): DiscoveryProvider {
    const p = this.providers.get(name.toLowerCase());
    if (!p) {
      throw new Error(`Discovery provider '${name}' is not registered. Available: ${Array.from(this.providers.keys()).join(', ')}`);
    }
    return p;
  }

  /**
   * Runs an end-to-end discovery job, deduplicates records, and stores businesses and contacts
   */
  public async executeJob(jobInput: {
    provider?: string;
    countryCode: string;
    city: string;
    category: string;
    region?: string;
    limit?: number;
    triggerSource?: 'manual' | 'automated';
  }): Promise<{
    job: DiscoveryJobEntity;
    totalFound: number;
    totalInserted: number;
    totalDuplicates: number;
  }> {
    const providerName = (jobInput.provider || 'openstreetmap').toLowerCase();
    const provider = this.getProvider(providerName);
    const triggerSource = jobInput.triggerSource || 'manual';

    // 1. Create Job record in database
    const job = await createDiscoveryJob({
      provider: providerName,
      country_code: jobInput.countryCode,
      region: jobInput.region || null,
      city: jobInput.city,
      category: jobInput.category,
      query: triggerSource === 'automated' ? 'automated_daily_scout' : 'manual_scan',
    });

    await updateDiscoveryJob(job.id, {
      status: 'RUNNING',
      started_at: new Date().toISOString(),
    });

    try {
      // 2. Fetch raw records from adapter
      const result: DiscoveryResult = await provider.search({
        countryCode: jobInput.countryCode,
        city: jobInput.city,
        category: jobInput.category,
        region: jobInput.region,
        limit: jobInput.limit || 20,
      });

      let insertedCount = 0;
      let duplicateCount = 0;

      // 3. Process & Deduplicate each discovered business
      for (const record of result.records) {
        // Strict Deduplication: If domain is already known, skip immediately
        if (record.normalizedDomain) {
          const existingDomain = await findBusinessByDomain(record.normalizedDomain);
          if (existingDomain) {
            duplicateCount++;
            continue;
          }
        }

        const phoneVal = record.phone || (record.metadata as any)?.phone || null;
        const hasWebsite = Boolean(record.websiteUrl || record.domain);
        const hasEmail = Boolean(record.email && record.email.includes('@'));
        const hasPhone = Boolean(phoneVal && String(phoneVal).replace(/[^0-9]/g, '').length >= 8);
        const isQualified = hasWebsite || hasEmail || hasPhone;

        const { business, isNew } = await upsertBusiness({
          name: record.name,
          domain: record.domain,
          normalized_domain: record.normalizedDomain,
          website_url: record.websiteUrl,
          country_code: record.countryCode,
          region: record.region,
          city: record.city,
          address: record.address,
          postal_code: record.postalCode,
          latitude: record.latitude,
          longitude: record.longitude,
          industry: record.industry,
          category: record.category,
          source_provider: record.sourceProvider,
          source_provider_id: record.sourceProviderId,
          metadata: {
            ...record.metadata,
            phone: phoneVal,
            discovery_source: triggerSource,
            discovery_date: new Date().toISOString(),
            is_qualified: isQualified,
            has_website: hasWebsite,
            has_email: hasEmail,
            has_phone: hasPhone,
          },
          status: 'DISCOVERED',
        });

        if (isNew) {
          insertedCount++;
        } else {
          duplicateCount++;
        }

        // If public contact email was provided directly with the business listing
        if (record.email && record.email.includes('@')) {
          await upsertContact({
            business_id: business.id,
            email: record.email,
            raw_email: record.email,
            phone: record.phone,
            source_url: record.websiteUrl || 'business_directory',
            provenance: `${record.sourceProvider}_listing`,
            verification_status: 'UNKNOWN',
          });
        }
      }

      // 4. Mark Job Completed
      const completedJob = await updateDiscoveryJob(job.id, {
        status: 'COMPLETED',
        total_found: result.totalFound,
        total_inserted: insertedCount,
        total_duplicates: duplicateCount,
        completed_at: new Date().toISOString(),
      });

      return {
        job: completedJob,
        totalFound: result.totalFound,
        totalInserted: insertedCount,
        totalDuplicates: duplicateCount,
      };
    } catch (err: any) {
      console.error(`[DiscoveryService] Job #${job.id} failed:`, err);
      const failedJob = await updateDiscoveryJob(job.id, {
        status: 'FAILED',
        error_message: err.message || 'Unknown provider failure',
        completed_at: new Date().toISOString(),
      });

      return {
        job: failedJob,
        totalFound: 0,
        totalInserted: 0,
        totalDuplicates: 0,
      };
    }
  }
}

export const discoveryService = new DiscoveryService();

