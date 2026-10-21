import { JarvisTool, ToolResult } from './types';

interface HttpInspectorInput {
  url: string;
  method?: 'GET' | 'HEAD';
}

interface HttpInspectorOutput {
  url: string;
  status: number;
  statusText: string;
  ok: boolean;
  responseTimeMs: number;
  contentType: string | null;
  server?: string | null;
  cacheControl?: string | null;
  redirected: boolean;
}

export const httpInspectorTool: JarvisTool<HttpInspectorInput, HttpInspectorOutput> = {
  name: 'http_inspector',
  label: 'Live HTTP & Endpoint Diagnostic',
  description:
    'Performs a live HTTP request to any target route or endpoint, measuring response latency, status codes, headers, and connectivity health.',
  permissionLevel: 'safe_auto',
  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to test (e.g. "https://heyprince.in/", "/services", "https://api.github.com"). Relative URLs are resolved against heyprince.in.',
      },
      method: {
        type: 'string',
        description: 'HTTP method to use (GET or HEAD). Default is GET.',
        enum: ['GET', 'HEAD'],
      },
    },
    required: ['url'],
  },
  execute: async (input) => {
    const startTime = Date.now();
    let targetUrl = input.url?.trim() || 'https://heyprince.in/';

    if (targetUrl.startsWith('/')) {
      const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://heyprince.in';
      targetUrl = `${origin.replace(/\/$/, '')}${targetUrl}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(targetUrl, {
        method: input.method || 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'HeyPrince-JARVIS-Guardian/2.0 (Health Monitor)',
        },
      });
      clearTimeout(timeoutId);

      const responseTimeMs = Date.now() - startTime;
      const data: HttpInspectorOutput = {
        url: targetUrl,
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        responseTimeMs,
        contentType: res.headers.get('content-type'),
        server: res.headers.get('server'),
        cacheControl: res.headers.get('cache-control'),
        redirected: res.redirected,
      };

      const summary = res.ok
        ? `HTTP ${res.status} OK for ${targetUrl} in ${responseTimeMs}ms.`
        : `HTTP ${res.status} ${res.statusText} warning for ${targetUrl} (took ${responseTimeMs}ms).`;

      return {
        toolName: 'http_inspector',
        success: res.ok,
        data,
        summary,
        durationMs: responseTimeMs,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      return {
        toolName: 'http_inspector',
        success: false,
        error: err?.message || 'Network unreachable',
        summary: `HTTP test failed for ${targetUrl}: ${err?.message || 'Connection error'}.`,
        durationMs,
        timestamp: new Date().toISOString(),
      };
    }
  },
};

