const http = require('http');

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function verify() {
  const homeHtml = await fetchPage('http://localhost:3000/');
  console.log('--- HOME PAGE SEO CHECK ---');
  console.log('Has Title:', homeHtml.includes('<title>'));
  console.log('Title text:', homeHtml.match(/<title>(.*?)<\/title>/)?.[1]);
  console.log('Has Anton font link:', homeHtml.includes('family=Anton'));
  console.log('Has Arboria font link:', homeHtml.includes('/fonts/arboria/arboria.css'));
  console.log('Has Futuru font link:', homeHtml.includes('/fonts/futuru/futuru.css'));
  console.log('Has JSON-LD:', homeHtml.includes('application/ld+json'));
  console.log('Has Canonical:', homeHtml.includes('rel="canonical"'));
  console.log('Has H1 Banner:', homeHtml.includes('<h1 class="banner-title">'));

  const contactHtml = await fetchPage('http://localhost:3000/contact');
  console.log('\n--- CONTACT PAGE SEO CHECK ---');
  console.log('Contact Title:', contactHtml.match(/<title>(.*?)<\/title>/)?.[1]);
  console.log('Contact Canonical:', contactHtml.includes('href="https://heyprince.in/contact/"'));

  const serviceHtml = await fetchPage('http://localhost:3000/services/ai-automation');
  console.log('\n--- SERVICE PAGE SEO CHECK ---');
  console.log('Service Title:', serviceHtml.match(/<title>(.*?)<\/title>/)?.[1]);
  console.log('Service Schema:', serviceHtml.includes('"@type":"Service"'));
  console.log('Service H1:', serviceHtml.includes('<h1 class="service-main-title">'));

  const blogHtml = await fetchPage('http://localhost:3000/blog/freelancing-tips-it-professionals-2026');
  console.log('\n--- BLOG PAGE SEO CHECK ---');
  console.log('Blog Title:', blogHtml.match(/<title>(.*?)<\/title>/)?.[1]);
  console.log('Blog Schema:', blogHtml.includes('"@type":"BlogPosting"'));
  console.log('Blog H1:', blogHtml.includes('<h1 class="blog-main-title">'));

  const sitemapXml = await fetchPage('http://localhost:3000/sitemap.xml');
  console.log('\n--- SITEMAP XML CHECK ---');
  console.log('Sitemap length:', sitemapXml.length);
  console.log('Sitemap contains /contact/:', sitemapXml.includes('https://heyprince.in/contact/'));
  console.log('Sitemap contains /services/ai-automation/:', sitemapXml.includes('https://heyprince.in/services/ai-automation/'));
  console.log('Sitemap contains /blog/choose-it-services-provider/:', sitemapXml.includes('https://heyprince.in/blog/choose-it-services-provider/'));

  const robotsTxt = await fetchPage('http://localhost:3000/robots.txt');
  console.log('\n--- ROBOTS TXT CHECK ---');
  console.log(robotsTxt.trim());
}

verify();
