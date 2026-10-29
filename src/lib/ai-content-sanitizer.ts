/**
 * Centralized Global AI Content Filter: Em Dash Sanitizer
 * 
 * Replaces Unicode em dash characters (—, U+2014) from AI-generated outputs
 * using linguistically and grammatically appropriate contextual replacements
 * (commas, colons, semicolons, full stops, or standard hyphens), while preserving
 * code blocks, inline code, URLs, HTML tags, Markdown structures, and formatting.
 */

// Contextual replacement helper for text outside of code/HTML/URLs
function replaceEmDashContextually(text: string): string {
  if (!text || !text.includes('—')) {
    return text;
  }

  let result = text;

  // 1. Prefix list markers or attributions at beginning of line
  // e.g., "^— item" -> "- item" or "^— Albert Einstein" -> "- Albert Einstein"
  result = result.replace(/(^|\n)\s*—\s*/g, '$1- ');

  // 2. Numeric / Date / Page ranges: "2024—2026" or "10—15" -> "2024-2026"
  result = result.replace(/(\d+)\s*—\s*(\d+)/g, '$1-$2');

  // 3. Attribution after quotes or sentence endings: '"Quote" — Author' or 'Sentence. — Author' -> '- Author'
  result = result.replace(/(["'”\.\!\?])\s*—\s*([A-Z][a-z])/g, '$1 - $2');

  // 4. Title / Subtitle patterns: "Headline — Subtitle" -> "Headline: Subtitle"
  // Matches markdown headers or multi-word title prefixes followed by a capitalized subtitle or number
  result = result.replace(/^((?:#{1,6}\s+)?[A-Z0-9][^:.\n—]*\s+[^:.\n—]{2,60})\s*—\s*([A-Z0-9])/gm, (match, prefix, nextChar) => {
    return `${prefix.trim()}: ${nextChar}`;
  });

  // 5. Parenthetical pairs: "word — clause — word" -> "word, clause, word"
  // Look for two em dashes within a single sentence
  result = result.replace(/([^.!?\n]+?)\s*—\s*([^.!?\n—]+?)\s*—\s*([^.!?\n]+)/g, (match, pre, middle, post) => {
    const trimmedPre = pre.trimEnd();
    const trimmedMid = middle.trim();
    const trimmedPost = post.trimStart();
    // If pre already ends with a comma, don't double comma
    const preSep = trimmedPre.endsWith(',') ? ' ' : ', ';
    return `${trimmedPre}${preSep}${trimmedMid}, ${trimmedPost}`;
  });

  // 6. Explanatory continuation: "The reality is simple — speed matters" -> "The reality is simple: speed matters"
  result = result.replace(/\b(namely|specifically|simple|clear|obvious|key|result|truth|fact|rule|note|takeaway)\s*—\s*/gi, '$1: ');

  // 8. General clause break: "technology — an important driver" -> "technology, an important driver"
  result = result.replace(/([^\s,;:.!?])\s*—\s*([^\s])/g, (match, before, after) => {
    if (before === ',' || before === ':' || before === ';') {
      return `${before} ${after}`;
    }
    return `${before}, ${after}`;
  });

  // 9. Any remaining standalone em dashes surrounded by whitespace: "word — word" -> "word, word" or "word - word"
  result = result.replace(/\s+—\s+/g, ', ');

  // 10. Trailing em dash at end of sentence or clause: "word—." or "word—" -> "word."
  result = result.replace(/\s*—\s*([.!?])/g, '$1');
  result = result.replace(/\s*—\s*$/gm, '');

  // 11. Catch-all for any lone em dashes: replace with comma or hyphen
  result = result.replace(/—/g, '-');

  // 12. Normalize accidental double spaces or comma anomalies
  result = result
    .replace(/,\s*,/g, ',')
    .replace(/,\s*\./g, '.')
    .replace(/:\s*:/g, ':')
    .replace(/ +/g, ' ')
    .replace(/ ,/g, ',');

  return result;
}

/**
 * Strips em dashes from a string while preserving:
 * - Fenced code blocks (``` ... ```)
 * - Inline code blocks (` ... `)
 * - HTML tags and attributes (<...>)
 * - URLs (https://... or http://...)
 */
export function sanitizeEmDashes(content: string): string {
  if (!content || typeof content !== 'string') return content;
  if (!content.includes('—')) return content;

  // Placeholder map to protect sensitive formatting
  const tokens: string[] = [];
  const makeToken = (val: string) => {
    const idx = tokens.length;
    tokens.push(val);
    return `___HP_AI_PROTECTED_TOKEN_${idx}___`;
  };

  let protectedText = content;

  // 1. Protect multi-line fenced code blocks
  protectedText = protectedText.replace(/```[\s\S]*?```/g, (match) => makeToken(match));

  // 2. Protect inline code `...`
  protectedText = protectedText.replace(/`[^`\n]+`/g, (match) => makeToken(match));

  // 3. Protect HTML tags <...>
  protectedText = protectedText.replace(/<[^>]+>/g, (match) => makeToken(match));

  // 4. Protect URLs
  protectedText = protectedText.replace(/https?:\/\/[^\s<>)"]+/g, (match) => makeToken(match));

  // Now perform contextual replacement on clean text
  let processed = replaceEmDashContextually(protectedText);

  // Restore protected tokens
  for (let i = 0; i < tokens.length; i++) {
    const token = `___HP_AI_PROTECTED_TOKEN_${i}___`;
    processed = processed.replace(token, tokens[i]);
  }

  return processed;
}

/**
 * Universal Recursive AI Content Sanitizer
 * Recursively inspects and sanitizes strings, arrays, and object properties.
 * Safe for JSON payloads, database entities, articles, drafts, and messages.
 */
export function sanitizeAiContent<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    return sanitizeEmDashes(input) as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeAiContent(item)) as unknown as T;
  }

  if (typeof input === 'object') {
    // Avoid modifying instances like Dates, Buffers, Regexps
    if (input instanceof Date || input instanceof RegExp || Buffer.isBuffer(input)) {
      return input;
    }

    const copy: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      copy[key] = sanitizeAiContent(value);
    }
    return copy as T;
  }

  return input;
}

/**
 * Standard AI Prompt Directive to instruct models not to output em dashes.
 */
export const NO_EM_DASH_INSTRUCTION =
  'IMPORTANT PUNCTUATION RULE: Do NOT use em dashes (—). Use standard commas, colons, semicolons, or simple hyphens instead.';
