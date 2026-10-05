import config from '@payload-config';
import { getPayload } from 'payload';
import { servicesList } from '../data/servicesData';
import { articlesList } from '../data/siteContent';

export async function runSeed() {
  console.log('🌱 [Seed] Initializing Payload CMS instance...');
  const payload = await getPayload({ config });

  // 1. Seed Default Admin User
  const existingUsers = await payload.find({
    collection: 'users',
    limit: 1,
  });

  if (existingUsers.totalDocs === 0) {
    console.log('👤 [Seed] Creating initial admin user (it@heyprince.in)...');
    await payload.create({
      collection: 'users',
      data: {
        name: 'Prince',
        email: 'it@heyprince.in',
        password: process.env.PAYLOAD_ADMIN_PASSWORD || 'HeyPrinceAdmin2026!',
        role: 'admin',
      },
    });
    console.log('✅ [Seed] Admin user created successfully.');
  } else {
    console.log('ℹ️ [Seed] Users already present in database. Skipping user creation.');
  }

  // 2. Seed Categories
  const categoryMap = new Map<string, number>();
  const categoriesToSeed = [
    { title: 'Artificial Intelligence & Automation', slug: 'ai-automation' },
    { title: 'Content Management Systems', slug: 'cms-development' },
    { title: 'Frontend Engineering', slug: 'frontend-engineering' },
    { title: 'Backend Architecture', slug: 'backend-architecture' },
    { title: 'Data & Backend Automation', slug: 'data-automation' },
    { title: 'Search Engine Optimization', slug: 'seo-optimization' },
    { title: 'Design & Visual Strategy', slug: 'design-visual-strategy' },
    { title: 'Freelancing & Career', slug: 'freelancing-career' },
    { title: 'Business Strategy', slug: 'business-strategy' },
    { title: 'Web Engineering', slug: 'web-engineering' },
    { title: 'Tech Trends & Innovation', slug: 'tech-trends-innovation' },
  ];

  console.log('🏷️ [Seed] Seeding categories...');
  for (const cat of categoriesToSeed) {
    const existing = await payload.find({
      collection: 'categories',
      where: { slug: { equals: cat.slug } },
      limit: 1,
    });

    if (existing.totalDocs > 0) {
      categoryMap.set(cat.title, Number(existing.docs[0].id));
    } else {
      const created = await payload.create({
        collection: 'categories',
        data: {
          title: cat.title,
          slug: cat.slug,
          description: `Services and insights related to ${cat.title}.`,
        },
      });
      categoryMap.set(cat.title, Number(created.id));
    }
  }
  console.log(`✅ [Seed] Categories synchronized (${categoriesToSeed.length} total).`);

  // 3. Seed Services
  console.log('⚡ [Seed] Seeding services...');
  for (let i = 0; i < servicesList.length; i++) {
    const s = servicesList[i];
    const existingService = await payload.find({
      collection: 'services',
      where: { slug: { equals: s.slug } },
      limit: 1,
    });

    if (existingService.totalDocs === 0) {
      const matchedCategoryId = categoryMap.get(s.category);

      await payload.create({
        collection: 'services',
        data: {
          title: s.title,
          slug: s.slug,
          shortTitle: s.shortTitle,
          tagline: s.tagline,
          category: matchedCategoryId !== undefined ? matchedCategoryId : null,
          categoryName: s.category,
          cardTheme: s.cardTheme,
          isFeatured: s.isFeatured || false,
          featuredBadge: s.featuredBadge,
          iconName: s.iconName,
          shortDescription: s.heroDescription,
          heroDescription: s.heroDescription,
          description: s.overview.join('\n\n'),
          overview: s.overview.map((p) => ({ paragraph: p })),
          deliverables: s.deliverables.map((d) => ({ title: d.title, desc: d.desc })),
          techStack: s.techStack.map((t) => ({ name: t })),
          process: s.process.map((p) => ({ step: p.step, title: p.title, desc: p.desc })),
          highlights: s.highlights.map((h) => ({ text: h })),
          faqs: s.faqs.map((f) => ({ q: f.q, a: f.a })),
          pricingType: 'custom',
          published: true,
          sortOrder: i,
          seoTitle: s.metaTitle,
          seoDescription: s.metaDescription,
        },
      });
      console.log(`  + Seeded Service: ${s.title}`);
    } else {
      console.log(`  • Service already exists: ${s.slug}`);
    }
  }
  console.log('✅ [Seed] Services synchronized.');

  // 4. Seed Posts / Insights
  console.log('📝 [Seed] Seeding posts/insights...');
  for (const a of articlesList) {
    const existingPost = await payload.find({
      collection: 'posts',
      where: { slug: { equals: a.slug } },
      limit: 1,
    });

    if (existingPost.totalDocs === 0) {
      const matchedCategoryId = categoryMap.get(a.category);

      await payload.create({
        collection: 'posts',
        data: {
          title: a.title,
          slug: a.slug,
          excerpt: a.description,
          readMins: a.readMins,
          coverImage: a.image,
          category: matchedCategoryId !== undefined ? matchedCategoryId : null,
          categoryName: a.category,
          author: {
            name: a.author.name,
            role: a.author.role,
            avatar: a.author.avatar,
          },
          tags: a.tags.map((t) => ({ tag: t })),
          sections: a.sections.map((sec) => ({
            heading: sec.heading,
            paragraphs: sec.paragraphs.map((p) => ({ text: p })),
            bulletPoints: sec.bulletPoints?.map((bp) => ({ point: bp })) || [],
            quote: sec.quote || '',
            proTip: sec.proTip || '',
          })),
          publishedAt: new Date(a.date || '2026-02-01').toISOString(),
          status: 'published',
          seoTitle: `${a.title} | Prince — Tech Partner`,
          seoDescription: a.description,
          canonical: `https://heyprince.in/insights/${a.slug}/`,
        },
      });
      console.log(`  + Seeded Post: ${a.title}`);
    } else {
      console.log(`  • Post already exists: ${a.slug}`);
    }
  }
  console.log('✅ [Seed] Posts synchronized.');

  console.log('🎉 [Seed] Full database seed finished successfully!');
}

// Execute directly if run as a script
if (process.argv[1]?.includes('seed')) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ [Seed] Error during database seeding:', err);
      process.exit(1);
    });
}
