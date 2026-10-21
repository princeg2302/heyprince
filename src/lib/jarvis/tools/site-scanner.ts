import { JarvisTool, ToolResult } from './types';

interface SiteScannerInput {
  scanType?: 'core_routes' | 'sitemap' | 'all';
}

interface RouteScanResult {
  route: string;
  status: number;
  ok: boolean;
  latencyMs: number;
  error?: string;
}

interface SiteScannerOutput {
  siteUrl: string;
  routesChecked: RouteScanResult[];
  averageLatencyMs: number;
  healthyRoutes: number;
  failedRoutes: number;
  sitemapAvailable: boolean;
  robotsTxtAvailable: boolean;
}

const CORE_MONITOR_ROUTES = [
  '/',
  '/about',
  '/services',
  '/insights',
  '/contact',
  '/gaming-zone',
  '/sitemap.xml',
  '/robots.txt',
];

export const siteScannerTool: JarvisTool<SiteScannerInput, SiteScannerOutput> = {
  name: 'site_scanner',
  label: 'HeyPrince.in Website Diagnostic Scanner',
  description:
    'Conducts automated live diagnostic sweeps across all core HeyPrince.in pages, verifying sitemaps, robots.txt, HTTP response codes, and average latency.',
  permissionLevel: 'safe_auto',
  parameters: {
    type: 'object',
    properties: {
      scanType: {
        type: 'string',
        description: 'Scope of scan: "core_routes", "sitemap", or "all". Default is "all".',
        enum: ['core_routes', 'sitemap', 'all'],
      },
    },
  },
  execute: async () => {
    const startTime = Date.now();
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://heyprince.in').replace(/\/$/, '');
    const results: RouteScanResult[] = [];

    let totalLatency = 0;
    let healthyCount = 0;
    let sitemapOk = false;
    let robotsOk = false;

    // Run parallel ping batches
    const checks = CORE_MONITOR_ROUTES.map(async (route) => {
      const pingStart = Date.now();
      const target = `${siteUrl}${route}`;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(target, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'User-Agent': 'HeyPrince-JARVIS-SiteScanner/2.0' },
        });
        clearTimeout(timeout);

        const latency = Date.now() - pingStart;
        if (route === '/sitemap.xml' && res.ok) sitemapOk = true;
        if (route === '/robots.txt' && res.ok) robotsOk = true;

        if (res.ok) healthyCount++;
        totalLatency += latency;

        return {
          route,
          status: res.status,
          ok: res.ok,
          latencyMs: latency,
        };
      } catch (err: any) {
        const latency = Date.now() - pingStart;
        return {
          route,
          status: 0,
          ok: false,
          latencyMs: latency,
          error: err?.message || 'Timeout / Unreachable',
        };
      }
    });

    const routeResults = await Promise.all(checks);
    const avgLatency = Math.round(totalLatency / (routeResults.length || 1));
    const failedCount = routeResults.length - healthyCount;

    const data: SiteScannerOutput = {
      siteUrl,
      routesChecked: routeResults,
      averageLatencyMs: avgLatency,
      healthyRoutes: healthyCount,
      failedRoutes: failedCount,
      sitemapAvailable: sitemapOk,
      robotsTxtAvailable: robotsOk,
    };

    const overallStatus = failedCount === 0 ? 'Nominal' : `${failedCount} routes degraded`;
    const summary = `Website scan complete: ${healthyCount}/${routeResults.length} routes online (Avg Latency: ${avgLatency}ms, Sitemap: ${sitemapOk ? 'OK' : 'FAIL'}, Robots.txt: ${robotsOk ? 'OK' : 'FAIL'}). Overall health: ${overallStatus}.`;

    return {
      toolName: 'site_scanner',
      success: healthyCount > 0,
      data,
      summary,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  },
};
