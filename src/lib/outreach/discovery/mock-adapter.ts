import { DiscoveryProvider, DiscoverySearchParams, DiscoveryResult, DiscoveredBusinessRecord, extractDomain } from './types';

export class MockDiscoveryAdapter implements DiscoveryProvider {
  name = 'mock';

  async search(params: DiscoverySearchParams): Promise<DiscoveryResult> {
    const city = params.city || 'Austin';
    const country = params.countryCode.toUpperCase() || 'US';
    const cat = params.category || 'Restaurants';

    const samplePool = [
      {
        id: 'mock_1',
        name: `${city} Artisan Roast & Coffee`,
        url: 'https://artisanroast-austin.example.com',
        phone: '+1 512-555-0192',
        email: 'contact@artisanroast-austin.example.com',
        address: `104 Congress Ave, ${city}`,
        category: 'Cafe & Roastery',
      },
      {
        id: 'mock_2',
        name: `Summit Boutique Hotel & Suites`,
        url: 'https://summitboutique-hotel.example.com',
        phone: '+1 512-555-0144',
        email: 'reservations@summitboutique-hotel.example.com',
        address: `450 River Walk, ${city}`,
        category: 'Boutique Hotel',
      },
      {
        id: 'mock_3',
        name: `Vanguard Growth Marketing Agency`,
        url: 'https://vanguardgrowth.example.com',
        phone: '+1 512-555-0188',
        email: 'hello@vanguardgrowth.example.com',
        address: `800 Brazos St, ${city}`,
        category: 'Digital Agency',
      },
      {
        id: 'mock_4',
        name: `Urban Dental & Orthodontics Care`,
        url: 'https://urbandentalcare.example.com',
        phone: '+1 512-555-0120',
        email: 'info@urbandentalcare.example.com',
        address: `1200 S Lamar Blvd, ${city}`,
        category: 'Healthcare Clinic',
      },
      {
        id: 'mock_5',
        name: `Apex Precision Auto Repair`,
        url: 'https://apexautorepair.example.com',
        phone: '+1 512-555-0177',
        email: 'service@apexautorepair.example.com',
        address: `2300 Airport Blvd, ${city}`,
        category: 'Local Automotive Service',
      },
    ];

    const records: DiscoveredBusinessRecord[] = samplePool.map((item) => {
      const { domain, normalizedDomain } = extractDomain(item.url);
      return {
        sourceProvider: 'mock',
        sourceProviderId: `${item.id}_${city.toLowerCase()}`,
        name: item.name,
        websiteUrl: item.url,
        domain,
        normalizedDomain,
        phone: item.phone,
        email: item.email,
        countryCode: country,
        region: params.region || 'Texas',
        city,
        address: item.address,
        postalCode: '78701',
        latitude: 30.2672,
        longitude: -97.7431,
        category: cat,
        industry: item.category,
        metadata: {
          testFixture: true,
          generatedAt: new Date().toISOString(),
        },
      };
    });

    return {
      records,
      totalFound: records.length,
      hasMore: false,
    };
  }
}
