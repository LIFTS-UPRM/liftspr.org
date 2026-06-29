const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '..', 'dist');
const baseUrl = 'https://liftspr.org';
const defaultImage = `${baseUrl}/images/logo/Logo.png`;
const today = new Date().toISOString().slice(0, 10);

const routes = [
  {
    path: '/',
    title: 'LIFTS | Near-Space Research & High-Altitude Balloon Missions',
    description: 'LIFTS is a student-led near-space research program at UPRM conducting high-altitude balloon missions, payload development, and CubeSat research from Puerto Rico.',
    heading: 'Launch Initiatives for Technologies in Space',
    summary: 'LIFTS gives UPRM students a hands-on path into aerospace research through high-altitude balloon missions, mission operations, payload development, and CubeSat research.',
    priority: '1.0',
    changefreq: 'weekly',
  },
  {
    path: '/missions',
    title: 'High-Altitude Balloon & CubeSat Missions | LIFTS',
    description: 'Explore LIFTS missions, including NEXO, ASCENT, and the UPRM CubeSat development program.',
    heading: 'LIFTS Missions',
    summary: 'LIFTS missions include the completed NEXO eclipse balloon flight, the upcoming ASCENT Puerto Rico balloon mission, and a long-range CubeSat development program.',
    priority: '0.9',
    changefreq: 'weekly',
  },
  {
    path: '/launches',
    title: 'Launch Schedule | LIFTS',
    description: 'Follow upcoming and completed LIFTS launches, flight milestones, and mission operations updates.',
    heading: 'Launch Schedule',
    summary: 'The LIFTS launch schedule tracks upcoming high-altitude balloon missions, completed flights, and milestones that move student-led aerospace work forward.',
    priority: '0.8',
    changefreq: 'weekly',
  },
  {
    path: '/updates',
    title: 'Mission Updates | LIFTS',
    description: 'Read LIFTS mission notes, program milestones, and development updates from the UPRM aerospace team.',
    heading: 'Mission Updates',
    summary: 'LIFTS updates cover ASCENT mission planning, CubeSat subsystem studies, NEXO recovery lessons, and progress from the UPRM mission team.',
    priority: '0.8',
    changefreq: 'weekly',
  },
  {
    path: '/careers',
    title: 'Join the LIFTS Team | Student Aerospace Roles at UPRM',
    description: 'Students can join LIFTS as payload engineers, flight software developers, operations coordinators, and outreach contributors.',
    heading: 'Join the LIFTS Team',
    summary: 'Students can contribute to LIFTS through payload engineering, flight software, operations coordination, communications, outreach, and research support.',
    priority: '0.8',
    changefreq: 'monthly',
    faq: true,
  },
  {
    path: '/about',
    title: 'About LIFTS | Launch Initiatives for Technologies in Space',
    description: 'Learn about LIFTS, a UPRM student aerospace research organization building near-space missions and CubeSat capability from Puerto Rico.',
    heading: 'About LIFTS',
    summary: 'LIFTS is a student aerospace research organization at UPRM building practical aerospace capability from Puerto Rico through mission-driven engineering.',
    priority: '0.9',
    changefreq: 'monthly',
  },
  {
    path: '/contact',
    title: 'Contact LIFTS | Partnerships, Media & Student Interest',
    description: 'Contact LIFTS for student interest, mission support, media requests, sponsorships, and aerospace research collaboration.',
    heading: 'Contact LIFTS',
    summary: 'Students, sponsors, media, and research collaborators can contact LIFTS at lifts@uprm.edu for mission support, partnerships, and team interest.',
    priority: '0.8',
    changefreq: 'monthly',
    faq: true,
  },
  {
    path: '/contributors',
    title: 'Contributors & Supporters | LIFTS',
    description: 'Meet the university, research, aerospace, and mission partners supporting LIFTS near-space work.',
    heading: 'LIFTS Contributors and Supporters',
    summary: 'LIFTS grows through support from UPRM, Puerto Rico Space Grant Consortium, Nationwide Eclipse Ballooning Project, Collins Aerospace, and Montana State University.',
    priority: '0.7',
    changefreq: 'monthly',
  },
  {
    path: '/nexo',
    title: 'NEXO Mission | LIFTS High-Altitude Balloon Flight',
    description: 'NEXO was the first LIFTS high-altitude balloon mission, launched during the 2024 total solar eclipse and recovered intact near Tyler, Texas.',
    heading: 'NEXO Mission',
    summary: 'NEXO launched during the 2024 total solar eclipse, reached approximately 95,000 feet, tracked for about 4.5 hours, and was recovered intact near Tyler, Texas.',
    priority: '0.8',
    changefreq: 'monthly',
    mission: 'NEXO',
  },
  {
    path: '/ascent',
    title: 'ASCENT Mission | LIFTS Puerto Rico High-Altitude Balloon',
    description: 'ASCENT is a Puerto Rico-based LIFTS high-altitude balloon mission targeting a 100,000+ foot flight with multiple scientific payload modules.',
    heading: 'ASCENT Mission',
    summary: 'ASCENT is an upcoming Puerto Rico high-altitude balloon mission targeting a 100,000+ foot flight profile with five payload modules in a 2.5 kg payload envelope.',
    priority: '0.9',
    changefreq: 'weekly',
    mission: 'ASCENT',
  },
  {
    path: '/cubesat',
    title: 'CubeSat Program | LIFTS UPRM Satellite Development',
    description: 'The LIFTS CubeSat program is developing toward a student-led 1U satellite mission at UPRM.',
    heading: 'CubeSat Program',
    summary: 'The LIFTS CubeSat program is developing power, communications, flight software, structures, and payload subsystem experience toward a future 1U student satellite.',
    priority: '0.8',
    changefreq: 'monthly',
    mission: 'CubeSat Program',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy | LIFTS',
    description: 'Privacy information for the LIFTS website, contact forms, newsletter, and member accounts.',
    heading: 'Privacy Policy',
    summary: 'The LIFTS privacy policy explains how the organization handles contact messages, newsletter subscriptions, member accounts, service providers, and data rights.',
    priority: '0.3',
    changefreq: 'yearly',
  },
];

const faqItems = [
  {
    question: 'Who can join LIFTS?',
    answer: 'Students interested in aerospace, electronics, software, operations, outreach, and research are welcome to connect with the team.',
  },
  {
    question: 'Do I need prior aerospace experience?',
    answer: 'No. LIFTS is built around learning by doing, mentorship, and hands-on mission work.',
  },
  {
    question: 'How can sponsors or collaborators reach the team?',
    answer: 'Use the contact page or email lifts@uprm.edu to discuss mission support, partnerships, media, or technical collaboration.',
  },
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function routeUrl(routePath) {
  return `${baseUrl}${routePath === '/' ? '/' : routePath}`;
}

function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'LIFTS',
    legalName: 'Launch Initiatives for Technologies in Space',
    description: 'Student-led near-space research program at the University of Puerto Rico at Mayaguez conducting high-altitude balloon missions, payload development, and CubeSat research.',
    url: `${baseUrl}/`,
    logo: defaultImage,
    foundingDate: '2024-01',
    email: 'lifts@uprm.edu',
    parentOrganization: {
      '@type': 'CollegeOrUniversity',
      name: 'University of Puerto Rico at Mayaguez',
      url: 'https://www.uprm.edu/',
    },
    areaServed: {
      '@type': 'Place',
      name: 'Puerto Rico',
    },
    sameAs: [
      'https://www.instagram.com/liftspr.uprm/',
      'https://www.linkedin.com/company/liftsuprm',
      'https://www.youtube.com/@LIFTS_UPRM',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'lifts@uprm.edu',
      contactType: 'general inquiries',
      areaServed: 'PR',
      availableLanguage: ['English', 'Spanish'],
    },
  };
}

function schemaFor(route) {
  const graph = [
    organizationSchema(),
    {
      '@type': 'WebSite',
      '@id': `${baseUrl}/#website`,
      url: `${baseUrl}/`,
      name: 'LIFTS',
      description: routes[0].description,
      publisher: { '@type': 'Organization', name: 'LIFTS' },
    },
    {
      '@type': 'WebPage',
      '@id': `${routeUrl(route.path)}#webpage`,
      url: routeUrl(route.path),
      name: route.title,
      description: route.description,
      isPartOf: { '@id': `${baseUrl}/#website` },
      about: { '@type': 'Organization', name: 'LIFTS' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
        ...(route.path === '/' ? [] : [{ '@type': 'ListItem', position: 2, name: route.title.replace(' | LIFTS', ''), item: routeUrl(route.path) }]),
      ],
    },
  ];

  if (route.faq) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faqItems.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    });
  }

  if (route.mission) {
    graph.push({
      '@type': 'Article',
      headline: route.title,
      description: route.description,
      author: { '@type': 'Organization', name: 'LIFTS' },
      publisher: { '@type': 'Organization', name: 'LIFTS', logo: { '@type': 'ImageObject', url: defaultImage } },
      mainEntityOfPage: routeUrl(route.path),
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

function metaBlock(route) {
  const url = routeUrl(route.path);
  const schema = JSON.stringify(schemaFor(route));
  return `<!-- SEO_META_START -->
    <meta name="description" content="${escapeHtml(route.description)}" />
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="${escapeHtml(url)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="LIFTS" />
    <meta property="og:title" content="${escapeHtml(route.title)}" />
    <meta property="og:description" content="${escapeHtml(route.description)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:image" content="${escapeHtml(defaultImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(route.title)}" />
    <meta name="twitter:description" content="${escapeHtml(route.description)}" />
    <meta name="twitter:image" content="${escapeHtml(defaultImage)}" />
    <script type="application/ld+json" id="structured-data">${schema.replace(/</g, '\\u003c')}</script>
    <!-- SEO_META_END -->`;
}

function renderRoute(baseHtml, route) {
  let html = baseHtml.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(route.title)}</title>`);
  if (/<!-- SEO_META_START -->[\s\S]*?<!-- SEO_META_END -->/.test(html)) {
    html = html.replace(/<!-- SEO_META_START -->[\s\S]*?<!-- SEO_META_END -->/, metaBlock(route));
  } else {
    html = html.replace('</head>', `${metaBlock(route)}\n  </head>`);
  }
  html = html.replace('<div id="root"></div>', `<div id="root"></div>
    <noscript>
      <main>
        <h1>${escapeHtml(route.heading || route.title)}</h1>
        <p>${escapeHtml(route.summary || route.description)}</p>
        <nav aria-label="Primary pages">
          <a href="/">Home</a>
          <a href="/missions">Missions</a>
          <a href="/launches">Launches</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        </nav>
      </main>
    </noscript>`);
  return html;
}

function writeRoute(baseHtml, route) {
  const html = renderRoute(baseHtml, route);
  if (route.path === '/') {
    fs.writeFileSync(path.join(distDir, 'index.html'), html);
    return;
  }

  const clean = route.path.replace(/^\//, '');
  const routeDir = path.join(distDir, clean);
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, 'index.html'), html);
  fs.writeFileSync(path.join(distDir, `${clean}.html`), html);
}

function writeSitemap() {
  const urls = routes.map((route) => `  <url>
    <loc>${routeUrl(route.path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n');

  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`);
}

function writeRobots() {
  fs.writeFileSync(path.join(distDir, 'robots.txt'), `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`);
}

const baseHtmlPath = path.join(distDir, 'index.html');
if (!fs.existsSync(baseHtmlPath)) {
  throw new Error(`Missing ${baseHtmlPath}. Run vite build before generating SEO pages.`);
}

const baseHtml = fs.readFileSync(baseHtmlPath, 'utf8');
routes.forEach((route) => writeRoute(baseHtml, route));
writeSitemap();
writeRobots();

console.log(`Generated ${routes.length} SEO route pages, sitemap.xml, and robots.txt`);
