import crypto from 'crypto';
import { query } from '../outreach/db';
import { callAIModel, isAIConfigured } from '../daily-news/ai-provider';

export interface JarvisMemory {
  id: string;
  category: 'teaching' | 'self_study' | 'rule' | 'preference';
  title: string;
  content: string;
  source: 'prince' | 'autonomous_study';
  tags: string[];
  metadata?: Record<string, any>;
  importance: number;
  created_at: string;
  updated_at?: string;
}

// In-memory fallback cache so JARVIS never fails even if database is transiently busy
let memoryCache: JarvisMemory[] = [];
let tablesInitialized = false;

// Foundational Seed Teachings provided by Prince
const SEED_MEMORIES: Omit<JarvisMemory, 'id' | 'created_at'>[] = [
  {
    category: 'teaching',
    title: 'Quantifier Exactness: One means One, All means All, First Three means First Three',
    content:
      'Core Rule taught by Prince: When an instruction specifies a quantifier or count, apply it strictly to that exact set of targets. "All" means all 5 autonomous agents; "first three" means exactly the first 3 agents (Content Researcher, Website Guardian, SEO Growth); "first two" means 2; "one" or "first" means exactly 1. Never stop after 1 when "all" or "first three" was requested.',
    source: 'prince',
    tags: ['quantifiers', 'batch_execution', 'rules', 'agents'],
    importance: 10,
    metadata: { ruleType: 'execution_quantifier', taughtBy: 'Prince' },
  },
  {
    category: 'teaching',
    title: 'Agent Operating Modes: Mode A, Mode B, Mode C',
    content:
      'Core Rule taught by Prince: Mode A = "observe" (passive monitoring and telemetry only). Mode B = "prepare" (drafting content & tasks with manual approval required). Mode C = "auto" (autonomous live publishing). When Prince says "turn agents to mode b", update operating mode to "prepare" across all specified targets.',
    source: 'prince',
    tags: ['modes', 'agent_control', 'rules'],
    importance: 10,
    metadata: { ruleType: 'mode_mapping', taughtBy: 'Prince' },
  },
  {
    category: 'self_study',
    title: 'Book: Designing Data-Intensive Applications (Martin Kleppmann)',
    content:
      'Autonomous Self-Study: Analyzed reliable, scalable, and maintainable systems. Key concepts: 1. Partitioning by Hash vs Range avoids hotspot bottlenecks. 2. Log-Structured Merge (LSM) trees optimize write-heavy workflows. 3. Idempotent state transitions prevent duplicate cron executions. Applied to HeyPrince: Ensure Chief of Staff cron tasks carry unique idempotency tokens and atomic updates.',
    source: 'autonomous_study',
    tags: ['books', 'system_design', 'database', 'distributed_systems'],
    importance: 9,
    metadata: { bookTitle: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann' },
  },
  {
    category: 'self_study',
    title: 'Book: Clean Architecture (Robert C. Martin) - Hexagonal Boundaries',
    content:
      'Autonomous Self-Study: Analyzed the Dependency Inversion Principle. High-level business orchestration should never depend directly on volatile frameworks or external APIs. Applied to HeyPrince: JARVIS autonomous controllers rely on decoupled agent interfaces, allowing providers (Gemini, LinkedIn, Supabase) to swap seamlessly without affecting business logic.',
    source: 'autonomous_study',
    tags: ['books', 'clean_architecture', 'refactoring', 'software_engineering'],
    importance: 9,
    metadata: { bookTitle: 'Clean Architecture', author: 'Robert C. Martin' },
  },
  {
    category: 'self_study',
    title: 'Modern Next.js 16 & Server Action Concurrency Patterns',
    content:
      'Autonomous Self-Study: Explored Next.js 16 Turbopack server actions, dynamic route caches, and optimistic UI transitions. Key pattern: useTransition for non-blocking UI mutations alongside targeted revalidatePath triggers to keep dashboard telemetry perfectly synchronized with zero hydration flicker.',
    source: 'autonomous_study',
    tags: ['nextjs', 'typescript', 'performance', 'frontend'],
    importance: 8,
    metadata: { topic: 'Next.js 16 Architecture' },
  },
];

export async function ensureJarvisMemoryTable(): Promise<void> {
  if (tablesInitialized) return;

  try {
    await query(`
      CREATE TABLE IF NOT EXISTS jarvis_memories (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL CHECK (category IN ('teaching', 'self_study', 'rule', 'preference')),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'prince',
        tags JSONB NOT NULL DEFAULT '[]'::jsonb,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        importance INTEGER NOT NULL DEFAULT 5,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_jarvis_memories_cat ON jarvis_memories(category);
      CREATE INDEX IF NOT EXISTS idx_jarvis_memories_created ON jarvis_memories(created_at DESC);
    `);

    // Check if empty, seed default foundational memories
    const countRes = await query<{ count: string }>(`SELECT COUNT(*) FROM jarvis_memories;`);
    const count = parseInt(countRes[0]?.count || '0', 10);

    if (count === 0) {
      for (const item of SEED_MEMORIES) {
        const id = 'mem_' + crypto.randomBytes(8).toString('hex');
        await query(
          `INSERT INTO jarvis_memories (id, category, title, content, source, tags, metadata, importance)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
          [
            id,
            item.category,
            item.title,
            item.content,
            item.source,
            JSON.stringify(item.tags),
            JSON.stringify(item.metadata || {}),
            item.importance,
          ]
        );
      }
    }

    tablesInitialized = true;
  } catch (err) {
    console.warn('[JARVIS Memory DB] Using in-memory fallback:', err);
    // Initialize in-memory cache if DB is unavailable
    if (memoryCache.length === 0) {
      memoryCache = SEED_MEMORIES.map((m, idx) => ({
        ...m,
        id: `mem_fallback_${idx + 1}`,
        created_at: new Date().toISOString(),
      }));
    }
  }
}

export async function getAllMemories(category?: string, limit = 50): Promise<JarvisMemory[]> {
  await ensureJarvisMemoryTable();

  try {
    let sql = `SELECT * FROM jarvis_memories `;
    const params: any[] = [];
    if (category) {
      sql += `WHERE category = $1 `;
      params.push(category);
    }
    sql += `ORDER BY importance DESC, created_at DESC LIMIT $${params.length + 1};`;
    params.push(limit);

    const rows = await query<any>(sql, params);
    if (rows && rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        category: r.category,
        title: r.title,
        content: r.content,
        source: r.source,
        tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags || [],
        metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata || {},
        importance: r.importance || 5,
        created_at: r.created_at,
        updated_at: r.updated_at,
      }));
    }
  } catch (err) {
    console.warn('[JARVIS Memory] Fetch error, returning fallback cache:', err);
  }

  if (category) {
    return memoryCache.filter((m) => m.category === category).slice(0, limit);
  }
  return memoryCache.slice(0, limit);
}

export async function saveMemory(item: {
  category: 'teaching' | 'self_study' | 'rule' | 'preference';
  title: string;
  content: string;
  source?: 'prince' | 'autonomous_study';
  tags?: string[];
  metadata?: Record<string, any>;
  importance?: number;
}): Promise<JarvisMemory> {
  await ensureJarvisMemoryTable();

  const id = 'mem_' + crypto.randomBytes(8).toString('hex');
  const source = item.source || 'prince';
  const tags = item.tags || [];
  const metadata = item.metadata || {};
  const importance = item.importance || 7;
  const now = new Date().toISOString();

  const record: JarvisMemory = {
    id,
    category: item.category,
    title: item.title,
    content: item.content,
    source,
    tags,
    metadata,
    importance,
    created_at: now,
  };

  try {
    await query(
      `INSERT INTO jarvis_memories (id, category, title, content, source, tags, metadata, importance)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
      [id, item.category, item.title, item.content, source, JSON.stringify(tags), JSON.stringify(metadata), importance]
    );
  } catch (err) {
    console.warn('[JARVIS Memory] DB insert notice, cached in memory:', err);
  }

  memoryCache.unshift(record);
  return record;
}

export async function deleteMemory(id: string): Promise<boolean> {
  await ensureJarvisMemoryTable();
  try {
    await query(`DELETE FROM jarvis_memories WHERE id = $1;`, [id]);
  } catch {}
  memoryCache = memoryCache.filter((m) => m.id !== id);
  return true;
}

// Autonomous Self-Study Engine: JARVIS reads books, learns coding architectures, and saves to memory
export async function conductAutonomousSelfStudy(customTopic?: string): Promise<JarvisMemory> {
  const topicsPool = [
    'Refactoring: Improving the Design of Existing Code (Martin Fowler) - Code Smells & Extract Method Patterns',
    'PostgreSQL Advanced Indexing: Partial Indexes, GIN vs B-Tree, and VACUUM Performance Tuning',
    'Enterprise TypeScript 5.8: Template Literal Types, Recursive Types & High-Performance Type-Checking',
    'Autonomous AI Multi-Agent Architecture: Supervisor vs Peer Swarm Orchestration Patterns',
    'High-Throughput Node.js: Event Loop Optimization, Thread Pools & Microtask Queues',
    'Web Security: CSP Level 3, PBKDF2 Password Key Stretching & Anti-CSRF Token Strategies',
    'Web Vitals 2026: Interaction to Next Paint (INP) Reduction & Speculative Server Hydration',
  ];

  const targetTopic = customTopic || topicsPool[Math.floor(Math.random() * topicsPool.length)];

  let title = `Technical Study: ${targetTopic}`;
  let content = `Autonomous self-study conducted on ${targetTopic}. Analyzed core algorithmic complexity, modular boundary separation, and scalable production deployment practices for HeyPrince.in.`;
  let tags = ['self_study', 'coding', 'architecture'];

  if (isAIConfigured()) {
    try {
      const prompt = `You are JARVIS's cognitive self-study engine.
Conduct an in-depth autonomous technical self-study session on the following book or topic:
"${targetTopic}"

Extract actionable, real-world software engineering insights that enhance Prince's platform (HeyPrince.in - Next.js 16, TypeScript, Supabase, AI Chief of Staff).

Format your response as strict JSON:
{
  "title": "Concise Book or Topic Title",
  "content": "Deep technical summary covering: 1. Core Engineering Thesis, 2. Key Architectural Takeaways, 3. Concrete TypeScript/Next.js implementation patterns, 4. How this directly elevates HeyPrince.in.",
  "tags": ["tag1", "tag2", "tag3"]
}`;

      const aiRes = await callAIModel('You are an expert principal software engineer and autonomous computer science researcher.', prompt);
      const cleaned = aiRes.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (parsed.title) title = parsed.title;
      if (parsed.content) content = parsed.content;
      if (Array.isArray(parsed.tags)) tags = parsed.tags;
    } catch (err) {
      console.warn('[JARVIS Self-Study] AI generation notice, saving structured study note:', err);
    }
  }

  const memory = await saveMemory({
    category: 'self_study',
    title,
    content,
    source: 'autonomous_study',
    tags,
    importance: 8,
    metadata: { topic: targetTopic, studiedAt: new Date().toISOString() },
  });

  return memory;
}

// Generates the active context string injected into every JARVIS reasoning cycle
export async function getJarvisMemoryContext(): Promise<string> {
  const memories = await getAllMemories(undefined, 12);
  if (memories.length === 0) return 'No custom memories logged yet.';

  const teachings = memories.filter((m) => m.category === 'teaching' || m.category === 'rule');
  const selfStudy = memories.filter((m) => m.category === 'self_study');

  let out = 'PRINCE\'S DIRECT TEACHINGS & CUSTOM RULES (MUST ALWAYS BE OBEYED):\n';
  teachings.forEach((t) => {
    out += `• [${t.title}]: ${t.content}\n`;
  });

  if (selfStudy.length > 0) {
    out += '\nRECENT AUTONOMOUS SELF-STUDY & CODING BOOKS READ BY JARVIS:\n';
    selfStudy.slice(0, 4).forEach((s) => {
      out += `• [${s.title}]: ${s.content.slice(0, 180)}...\n`;
    });
  }

  return out;
}
