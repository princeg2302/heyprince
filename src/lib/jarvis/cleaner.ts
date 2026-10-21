/**
 * JARVIS Text & Speech Sanitizer
 * Strips raw JSON formatting, speaker keys, markdown fences, and metadata
 * ensuring JARVIS only ever speaks and displays clean, natural prose.
 */

export function extractCleanSpokenText(raw: string | undefined | null): string {
  if (!raw) return '';
  let str = String(raw).trim();

  // 1. Remove markdown code blocks like ```json ... ``` or ``` ... ```
  str = str.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // 2. If wrapped in JSON braces or contains JSON structure, try parsing
  if (str.startsWith('{') && str.endsWith('}')) {
    try {
      const parsed = JSON.parse(str);
      if (typeof parsed === 'object' && parsed !== null) {
        const candidate =
          parsed.briefing ||
          parsed.reply ||
          parsed.message ||
          parsed.text ||
          parsed.summary ||
          parsed.content ||
          parsed.response;
        if (typeof candidate === 'string' && candidate.trim()) {
          str = candidate.trim();
        } else {
          // Fallback to first non-empty string property
          for (const key of Object.keys(parsed)) {
            if (typeof parsed[key] === 'string' && parsed[key].trim().length > 10) {
              str = parsed[key].trim();
              break;
            }
          }
        }
      }
    } catch {
      // JSON parse failed, proceed to regex extraction below
    }
  }

  // 3. Fallback regex if string contains JSON-like fields even if malformed or surrounded by other text
  if (str.includes('"briefing"') || str.includes('"reply"') || str.includes('"message"')) {
    const match = str.match(/"(?:briefing|reply|message|summary|text)"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
    if (match && match[1]) {
      try {
        str = JSON.parse(`"${match[1]}"`);
      } catch {
        str = match[1].replace(/\\"/g, '"');
      }
    }
  }

  // 4. Strip any stray JSON envelope remnants if left over (e.g. { "speaker": "JARVIS" ... })
  if (str.startsWith('{') && str.includes('"briefing"')) {
    str = str.replace(/^{.*?"briefing"\s*:\s*"/i, '').replace(/"\s*}\s*$/i, '');
  }

  // 5. Clean up markdown bold/italics/backticks for clean speech synthesis & display
  str = str
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return str;
}

