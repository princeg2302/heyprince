import { callAIModel } from './ai-provider';
import { supabase, createMediaRecord } from '@/lib/admin-db';
import { query } from '@/lib/outreach/db';
import { computeBufferHash, recordMediaContentHash } from '@/lib/deduplication';
import { GeneratedArticleSection, GeneratedContentPayload } from './types';

export interface GeneratedMemePackage {
  title: string;
  slug: string;
  excerpt: string;
  categoryName: string;
  readMins: string;
  tags: string[];
  imageUrl: string;
  mediaId?: number;
  sections: GeneratedArticleSection[];
  linkedinPost: string;
  seoTitle: string;
  seoDescription: string;
}

const INDIAN_OFFICE_THEMES = [
  {
    theme: 'The "Quick 2-Minute Sync" on Slack/Teams',
    setup: 'Manager: "Hey, do you have 2 quick minutes?"',
    punchline: 'Narrator: It was 5:45 PM on a Friday. The call ended at 7:30 PM with 14 new action items.',
    context: 'Every Indian tech professional knows that a "quick 2-minute sync" is never 2 minutes. It is a full retrospective, architectural redesign, and life therapy session combined.',
  },
  {
    theme: 'Friday 5:30 PM Production Deployment',
    setup: 'Product Manager: "It\'s just a 1-line text change, deploy it now before the weekend!"',
    punchline: 'Database: *Connection pool exhausted*. CI/CD: *Pipeline failed*. Weekend: *Cancelled*.',
    context: 'Deploying to production on Friday evening in an Indian IT setup is an extreme sport that tests your emotional resilience and hotfix abilities.',
  },
  {
    theme: 'The Cutting Chai Architectural Breakthrough',
    setup: 'Engineering Team: Spends 4 hours in meeting room arguing over Microservices vs Monolith.',
    punchline: 'Senior Dev & Junior Dev: Solve the entire database bottleneck in 6 minutes at the office tapri over cutting chai and samosa.',
    context: 'More software architecture breakthroughs have happened at the local tea tapri outside Cyber Hub and Whitefield than in all whiteboard meeting rooms combined.',
  },
  {
    theme: 'Monday Morning Standup Status',
    setup: 'Scrum Master: "Prince, what did you work on over the weekend?"',
    punchline: 'Developer: "I successfully resisted the urge to check Slack. Today I will be continuing what I said I was doing on Friday."',
    context: 'The universal art of phrasing "I had a personal life for 48 hours" into enterprise agile sprint velocity terminology.',
  },
  {
    theme: 'Estimating Software Tasks',
    setup: 'Client: "How long will this feature take?" Developer: "About 2 days."',
    punchline: 'Day 14: Currently debugging a legacy third-party library written in 2011 by an engineer who now runs an organic farm in Himachal.',
    context: 'Software estimation is not mathematics; it is optimistic speculative fiction influenced by hopeful caffeine intake.',
  },
  {
    theme: 'The "Per My Previous Email" Diplomatic Dance',
    setup: 'Corporate: "As per my previous email..."',
    punchline: 'Translation: "I literally answered this with screenshots, bullet points, and highlighted text 42 minutes ago, but reading is apparently optional."',
    context: 'The exquisite passive-aggressive poetry of Indian corporate email exchanges where polite greetings conceal intense debugging fury.',
  },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .slice(0, 45)
    .replace(/^-+|-+$/g, '');
}

/**
 * Creates a high-resolution, dark glassmorphism SVG meme graphic card
 */
function createMemeSvgCard(setup: string, punchline: string, theme: string): string {
  const cleanSetup = setup.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const cleanPunchline = punchline.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const cleanTheme = theme.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  return `<svg width="1200" height="675" viewBox="0 0 1200 675" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0b10" />
      <stop offset="50%" stop-color="#11131c" />
      <stop offset="100%" stop-color="#18141f" />
    </linearGradient>
    <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="50%" stop-color="#ec4899" />
      <stop offset="100%" stop-color="#6366f1" />
    </linearGradient>
    <filter id="cardGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="15" stdDeviation="25" flood-color="#000000" flood-opacity="0.8" />
      <feDropShadow dx="0" dy="0" stdDeviation="30" flood-color="#f59e0b" flood-opacity="0.15" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="675" fill="url(#bgGrad)" />

  <!-- Subtle Grid Lines -->
  <g stroke="rgba(255, 255, 255, 0.04)" stroke-width="1">
    <line x1="0" y1="135" x2="1200" y2="135" />
    <line x1="0" y1="270" x2="1200" y2="270" />
    <line x1="0" y1="405" x2="1200" y2="405" />
    <line x1="0" y1="540" x2="1200" y2="540" />
    <line x1="240" y1="0" x2="240" y2="675" />
    <line x1="480" y1="0" x2="480" y2="675" />
    <line x1="720" y1="0" x2="720" y2="675" />
    <line x1="960" y1="0" x2="960" y2="675" />
  </g>

  <!-- Main Card Container -->
  <g filter="url(#cardGlow)">
    <rect x="100" y="70" width="1000" height="535" rx="24" fill="#0f1118" stroke="rgba(245, 158, 11, 0.3)" stroke-width="2" />
  </g>

  <!-- Terminal Window Bar -->
  <rect x="100" y="70" width="1000" height="55" rx="24" fill="rgba(255, 255, 255, 0.03)" />
  <circle cx="140" cy="98" r="7" fill="#ef4444" />
  <circle cx="165" cy="98" r="7" fill="#f59e0b" />
  <circle cx="190" cy="98" r="7" fill="#10b981" />

  <text x="600" y="103" text-anchor="middle" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" letter-spacing="1">
    HEYPRINCE // INDIAN WORKPLACE CHRONICLES ☕
  </text>

  <!-- Tag Pill -->
  <rect x="150" y="155" width="220" height="32" rx="16" fill="rgba(245, 158, 11, 0.15)" stroke="rgba(245, 158, 11, 0.4)" stroke-width="1" />
  <text x="260" y="176" text-anchor="middle" fill="#fbbf24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700">
    ${cleanTheme.slice(0, 24)}
  </text>

  <!-- Setup Box -->
  <g>
    <rect x="150" y="210" width="900" height="135" rx="16" fill="rgba(255, 255, 255, 0.04)" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1" />
    <text x="180" y="250" fill="#f8fafc" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="700">
      ${cleanSetup.slice(0, 65)}
    </text>
    <text x="180" y="290" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="500">
      ${cleanSetup.length > 65 ? cleanSetup.slice(65, 130) : 'The universal tech dilemma we all pretend is manageable.'}
    </text>
  </g>

  <!-- Punchline Box with glowing gradient border -->
  <g>
    <rect x="150" y="375" width="900" height="155" rx="16" fill="rgba(245, 158, 11, 0.08)" stroke="url(#neonGrad)" stroke-width="2" />
    <text x="180" y="425" fill="#fde68a" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="23" font-weight="800">
      ${cleanPunchline.slice(0, 60)}
    </text>
    <text x="180" y="465" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="600">
      ${cleanPunchline.slice(60, 130)}
    </text>
    <text x="180" y="500" fill="#cbd5e1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-style="italic">
      ${cleanPunchline.length > 130 ? cleanPunchline.slice(130, 200) : '— A true story verified by 100% of engineering teams.'}
    </text>
  </g>

  <!-- Footer Watermark -->
  <text x="150" y="575" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600">
    heyprince.in/insights • Tech Culture &amp; Engineering Realities
  </text>
  <text x="1050" y="575" text-anchor="end" fill="#f59e0b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700">
    #RelatableTech #IndianITLife
  </text>
</svg>`;
}

/**
 * Generates an original Indian workplace humour article and graphic card
 */
export async function generateOfficeHumourMeme(): Promise<GeneratedMemePackage> {
  // 1. Pick a theme that hasn't been published yet to ensure uniqueness
  let candidates = INDIAN_OFFICE_THEMES;
  try {
    const published = await query<{ slug: string; title: string }>(
      `SELECT slug, title FROM posts WHERE category_name = 'Workplace & Culture' OR cover_image LIKE '%.svg';`
    );
    const publishedSlugs = new Set(published.map((p) => p.slug));
    const publishedTitles = new Set(published.map((p) => p.title.toLowerCase()));

    const unused = INDIAN_OFFICE_THEMES.filter(
      (t) => !publishedSlugs.has(slugify(t.theme)) && !publishedTitles.has(t.theme.toLowerCase())
    );
    if (unused.length > 0) {
      candidates = unused;
    }
  } catch (err) {
    console.warn('[meme-generator] Could not query published themes:', err);
  }

  const selectedTheme = candidates[Math.floor(Math.random() * candidates.length)];
  const timestamp = Date.now();

  // 2. Generate SVG graphic card
  const svgContent = createMemeSvgCard(selectedTheme.setup, selectedTheme.punchline, selectedTheme.theme);
  const svgBuffer = Buffer.from(svgContent, 'utf-8');
  const filename = `meme-card-${timestamp}-${slugify(selectedTheme.theme)}.svg`;
  const contentHash = computeBufferHash(svgBuffer);

  let imageUrl = '';
  let mediaId: number | undefined;

  try {
    // Upload to Supabase Storage in 'media' bucket
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('media')
      .upload(filename, svgBuffer, {
        contentType: 'image/svg+xml',
        upsert: true,
      });

    if (!uploadErr && uploadData) {
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(filename);
      if (urlData?.publicUrl) {
        imageUrl = urlData.publicUrl;
      }
    }

    // Catalog in Supabase Media Vault
    const mediaRecord = await createMediaRecord({
      alt: `${selectedTheme.theme} - Indian Office Humour Card`,
      caption: `Relatable Tech Culture: ${selectedTheme.theme}`,
      filename,
      mime_type: 'image/svg+xml',
      filesize: svgBuffer.length,
      width: 1200,
      height: 675,
      url: imageUrl || `procedural-meme://${slugify(selectedTheme.theme)}`,
    });

    if (mediaRecord.success && mediaRecord.media) {
      mediaId = mediaRecord.media.id;
      await recordMediaContentHash(mediaId, contentHash, selectedTheme.theme);
    }
  } catch (storageErr) {
    console.warn('[meme-generator] Storage or Media Vault upload notice:', storageErr);
  }

  if (!imageUrl) {
    imageUrl = `https://muzbzrxwbanzsjvgtexp.supabase.co/storage/v1/object/public/media/${filename}`;
  }

  // 3. Ask AI to write the witty humanized breakdown & LinkedIn caption
  const systemPrompt = `You are Prince Goyal, a seasoned senior full-stack IT consultant and software engineer based in India.
Write a witty, highly relatable, intelligent, and professional office humour post about Indian tech workplace realities.
The tone should be charming, conversational, humorous, yet dignified and suitable for founders, engineering leaders, and developers.
Do NOT use generic corporate clichés. Use vivid, harmless desi office references like cutting chai, samosas, Cyber Hub / Whitefield commutes, sprint velocity debates, and Slack notification panic.
Always output pure valid JSON matching the schema.`;

  const userPrompt = `Topic: "${selectedTheme.theme}"
Setup: "${selectedTheme.setup}"
Punchline: "${selectedTheme.punchline}"
Context: "${selectedTheme.context}"

Generate a JSON object with this exact structure:
{
  "title": "A witty, catchy headline (50-80 chars)",
  "slug": "url-friendly-slug",
  "excerpt": "A sharp, funny 1-2 sentence hook (120-180 chars)",
  "readMins": "3 min read",
  "categoryName": "Workplace & Developer Humour",
  "tags": ["Workplace Culture", "Developer Life", "Indian Tech", "Engineering Humour"],
  "sections": [
    {
      "heading": "The Anatomy of the Situation",
      "paragraphs": [
        "First funny observation paragraph setting the stage...",
        "Second paragraph unpacking why everyone in tech relates to this..."
      ],
      "quote": "A hilarious one-liner quote summary",
      "proTip": "A tongue-in-cheek practical survival tip for developers and managers"
    },
    {
      "heading": "The Cutting Chai Reality Check",
      "paragraphs": [
        "Paragraph exploring how engineering teams actually navigate this...",
        "Paragraph offering a clever, positive takeaway on team camaraderie and communication..."
      ]
    }
  ],
  "linkedinPost": "A punchy, witty LinkedIn post (130-220 words) with a relatable opening hook, the funny situation, a smart takeaway for engineering managers and devs, a polite call to comment, and 4-5 relevant hashtags like #IndianTech #DeveloperLife #TechHumour #StartupCulture #HeyPrince",
  "seoTitle": "SEO title under 60 chars",
  "seoDescription": "Meta description under 155 chars"
}`;

  try {
    const aiResponse = await callAIModel(systemPrompt, userPrompt);
    const cleanedText = aiResponse.text.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
    const parsed = JSON.parse(cleanedText);

    return {
      title: parsed.title || selectedTheme.theme,
      slug: parsed.slug || `${slugify(selectedTheme.theme)}-${timestamp}`,
      excerpt: parsed.excerpt || selectedTheme.context,
      categoryName: parsed.categoryName || 'Workplace & Developer Humour',
      readMins: parsed.readMins || '3 min read',
      tags: parsed.tags || ['Workplace Culture', 'Developer Life', 'Indian Tech'],
      imageUrl,
      mediaId,
      sections: parsed.sections || [
        {
          heading: 'The Anatomy of the Situation',
          paragraphs: [selectedTheme.setup, selectedTheme.context],
          quote: selectedTheme.punchline,
          proTip: 'Never deploy to production at 5:30 PM on a Friday. Ever.',
        },
      ],
      linkedinPost: parsed.linkedinPost || `${selectedTheme.theme}\n\n${selectedTheme.setup}\n\n${selectedTheme.punchline}\n\nRead more relatable tech chronicles on HeyPrince:\nhttps://heyprince.in/insights/`,
      seoTitle: parsed.seoTitle || `${selectedTheme.theme} | HeyPrince`,
      seoDescription: parsed.seoDescription || selectedTheme.context,
    };
  } catch (aiErr) {
    console.warn('[meme-generator] AI generation fallback:', aiErr);

    // Reliable in-memory fallback if AI is unavailable
    const fallbackSlug = `${slugify(selectedTheme.theme)}-${timestamp}`;
    return {
      title: `The Untold Truth: ${selectedTheme.theme}`,
      slug: fallbackSlug,
      excerpt: selectedTheme.context,
      categoryName: 'Workplace & Developer Humour',
      readMins: '3 min read',
      tags: ['Workplace Culture', 'Developer Life', 'Indian Tech', 'Tech Humour'],
      imageUrl,
      mediaId,
      sections: [
        {
          heading: 'The Daily Standup Paradox',
          paragraphs: [
            selectedTheme.setup,
            selectedTheme.context,
            'In every Indian tech corridor from Bangalore to Gurgaon, some situations defy all sprint velocity metrics and agile sprint planning charts.',
          ],
          quote: selectedTheme.punchline,
          proTip: 'Always carry a notepad to a "quick 2-minute sync". You will need it for the next 45 minutes.',
        },
        {
          heading: 'The Chai Break Philosophy',
          paragraphs: [
            'Software engineering is 20% writing code, 30% debugging, and 50% wondering why the bug disappeared the exact moment someone stood behind your desk to watch you reproduce it.',
            'At the end of the day, our shared workplace quirks are what build great engineering camaraderie and keep teams laughing through high-stakes production deadlines.',
          ],
        },
      ],
      linkedinPost: `The most relatable phrase in Indian tech isn't "Production is down."\n\nIt's: "${selectedTheme.setup}"\n\n${selectedTheme.punchline}\n\nEvery developer, engineering manager, and founder has lived through this exact moment. What is your all-time favorite office moment that was supposed to take 2 minutes?\n\n#IndianTech #DeveloperLife #TechHumour #StartupCulture #HeyPrince`,
      seoTitle: `${selectedTheme.theme} - Indian Tech Culture`,
      seoDescription: selectedTheme.context,
    };
  }
}

