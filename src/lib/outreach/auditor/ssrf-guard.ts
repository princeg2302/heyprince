import dns from 'dns/promises';
import net from 'net';

/**
 * Checks if an IPv4 string falls into private, loopback, link-local, or cloud metadata ranges
 */
export function isForbiddenIPv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed IP is rejected
  }

  const [b0, b1, b2, b3] = parts;

  // 0.0.0.0/8 (Current network)
  if (b0 === 0) return true;

  // 127.0.0.0/8 (Loopback / Localhost)
  if (b0 === 127) return true;

  // 10.0.0.0/8 (Private Network RFC 1918)
  if (b0 === 10) return true;

  // 172.16.0.0/12 (Private Network RFC 1918)
  if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;

  // 192.168.0.0/16 (Private Network RFC 1918)
  if (b0 === 192 && b1 === 168) return true;

  // 169.254.0.0/16 (Link-Local & Cloud Metadata: 169.254.169.254)
  if (b0 === 169 && b1 === 254) return true;

  // 100.64.0.0/10 (Shared Address Space / CGNAT)
  if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;

  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (b0 === 192 && b1 === 0 && b2 === 0) return true;

  // 192.0.2.0/24 (TEST-NET-1)
  if (b0 === 192 && b1 === 0 && b2 === 2) return true;

  // 198.51.100.0/24 (TEST-NET-2)
  if (b0 === 198 && b1 === 51 && b2 === 100) return true;

  // 203.0.113.0/24 (TEST-NET-3)
  if (b0 === 203 && b1 === 0 && b2 === 113) return true;

  // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
  if (b0 >= 224) return true;

  // 255.255.255.255 (Broadcast)
  if (b0 === 255 && b1 === 255 && b2 === 255 && b3 === 255) return true;

  return false;
}

/**
 * Checks if an IPv6 string is loopback, unique local, link-local, or IPv4-mapped
 */
export function isForbiddenIPv6(ip: string): boolean {
  const norm = ip.toLowerCase().trim();

  // ::1 (Loopback) or :: (Unspecified)
  if (norm === '::1' || norm === '::') return true;

  // fe80::/10 (Link-Local)
  if (norm.startsWith('fe8') || norm.startsWith('fe9') || norm.startsWith('fea') || norm.startsWith('feb')) {
    return true;
  }

  // fc00::/7 (Unique Local Address)
  if (norm.startsWith('fc') || norm.startsWith('fd')) {
    return true;
  }

  // IPv4-mapped IPv6 (::ffff:127.0.0.1 or ::ffff:7f00:1)
  if (norm.includes('::ffff:')) {
    const v4Part = norm.split('::ffff:')[1];
    if (net.isIPv4(v4Part) && isForbiddenIPv4(v4Part)) {
      return true;
    }
  }

  return false;
}

export function isForbiddenIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    return isForbiddenIPv4(ip);
  }
  if (net.isIPv6(ip)) {
    return isForbiddenIPv6(ip);
  }
  return true; // If not valid IP, treat as unsafe
}

/**
 * Resolves a hostname to IP addresses and guarantees none point to forbidden internal/cloud ranges.
 * Throws an explicit SSRF error if any resolved IP address is forbidden.
 */
export async function validateUrlForSsrf(targetUrl: string): Promise<{
  safeUrl: URL;
  resolvedIps: string[];
}> {
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    throw new Error(`SSRF Guard: Malformed URL '${targetUrl}'`);
  }

  // 1. Only allow HTTP and HTTPS protocols
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`SSRF Guard: Protocol '${parsed.protocol}' is forbidden. Only HTTP/HTTPS permitted.`);
  }

  const hostname = parsed.hostname.toLowerCase();

  // 2. Reject obvious dangerous hostnames
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === 'metadata.google.internal'
  ) {
    throw new Error(`SSRF Guard: Prohibited hostname '${hostname}'`);
  }

  // 3. If hostname is directly an IP address
  if (net.isIP(hostname)) {
    if (isForbiddenIp(hostname)) {
      throw new Error(`SSRF Guard: Direct IP address '${hostname}' points to a forbidden network range.`);
    }
    return { safeUrl: parsed, resolvedIps: [hostname] };
  }

  // 4. Resolve DNS records and verify all resolved IPs
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      throw new Error(`SSRF Guard: Unable to resolve hostname '${hostname}'`);
    }

    const resolvedIps = addresses.map((a) => a.address);

    for (const addr of addresses) {
      if (isForbiddenIp(addr.address)) {
        throw new Error(
          `SSRF Guard: Hostname '${hostname}' resolved to forbidden IP '${addr.address}'. Access blocked.`
        );
      }
    }

    return { safeUrl: parsed, resolvedIps };
  } catch (err: any) {
    if (err.message?.includes('SSRF Guard:')) throw err;
    throw new Error(`SSRF Guard DNS lookup failed for '${hostname}': ${err.message}`);
  }
}

