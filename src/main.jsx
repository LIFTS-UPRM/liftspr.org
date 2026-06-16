import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ContentProvider, useSiteData } from './lib/content.jsx';
import { supabase } from './lib/supabaseClient.js';
import './styles/main.css';
import './styles/react.css';

const AdminApp = React.lazy(() => import('./admin/AdminApp.jsx'));
const SITE_URL = 'https://liftspr.org';
const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/images/logo/lifts-logo.svg`;

// The admin-edited contact cards are the single source of truth for contact
// emails. The footer and Privacy page show the first card (the primary
// contact), so changing it in the dashboard updates every place it appears.
function primaryContactEmail(contact) {
  return contact?.cards?.[0]?.value || 'lifts@upr.edu';
}

const legacyRedirectParam = new URLSearchParams(window.location.search).get('p');
if (legacyRedirectParam) {
  window.history.replaceState({}, '', decodeURIComponent(legacyRedirectParam));
}

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Missions', path: '/missions' },
  { label: 'Launches', path: '/launches' },
  { label: 'Updates', path: '/updates' },
  { label: 'Careers', path: '/careers' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
];

const routes = [
  {
    path: '/',
    aliases: ['/index.html'],
    title: 'LIFTS | Near-Space Research & High-Altitude Balloon Missions',
    description: 'LIFTS is a student-led near-space research program at UPRM conducting high-altitude balloon missions, payload development, and CubeSat research from Puerto Rico.',
    component: HomePage,
  },
  {
    path: '/missions',
    aliases: ['/missions.html'],
    title: 'High-Altitude Balloon & CubeSat Missions | LIFTS',
    description: 'Explore LIFTS missions, including NEXO, ASCENT, and the UPRM CubeSat development program.',
    component: MissionsPage,
  },
  {
    path: '/launches',
    aliases: ['/launches.html'],
    title: 'Launch Schedule | LIFTS',
    description: 'Follow upcoming and completed LIFTS launches, flight milestones, and mission operations updates.',
    component: LaunchesPage,
  },
  {
    path: '/updates',
    aliases: ['/updates.html'],
    title: 'Mission Updates | LIFTS',
    description: 'Read LIFTS mission notes, program milestones, and development updates from the UPRM aerospace team.',
    component: UpdatesPage,
  },
  {
    path: '/careers',
    aliases: ['/careers.html'],
    title: 'Join the LIFTS Team | Student Aerospace Roles at UPRM',
    description: 'Students can join LIFTS as payload engineers, flight software developers, operations coordinators, and outreach contributors.',
    faq: true,
    component: CareersPage,
  },
  {
    path: '/about',
    aliases: ['/about.html'],
    title: 'About LIFTS | Launch Initiatives for Technologies in Space',
    description: 'Learn about LIFTS, a UPRM student aerospace research organization building near-space missions and CubeSat capability from Puerto Rico.',
    component: AboutPage,
  },
  {
    path: '/contact',
    aliases: ['/contact.html'],
    title: 'Contact LIFTS | Partnerships, Media & Student Interest',
    description: 'Contact LIFTS for student interest, mission support, media requests, sponsorships, and aerospace research collaboration.',
    faq: true,
    component: ContactPage,
  },
  {
    path: '/contributors',
    aliases: ['/contributors.html'],
    title: 'Contributors & Supporters | LIFTS',
    description: 'Meet the university, research, aerospace, and mission partners supporting LIFTS near-space work.',
    component: ContributorsPage,
  },
  {
    path: '/privacy',
    aliases: ['/privacy.html'],
    title: 'Privacy | LIFTS',
    description: 'Privacy information for the LIFTS website.',
    component: PrivacyPage,
  },
  {
    path: '/nexo',
    aliases: ['/nexo.html'],
    title: 'NEXO Mission | LIFTS High-Altitude Balloon Flight',
    description: 'NEXO was the first LIFTS high-altitude balloon mission, launched during the 2024 total solar eclipse and recovered intact near Tyler, Texas.',
    schemaType: 'Article',
    component: () => <MissionDetailPage missionId="nexo" />,
  },
  {
    path: '/ascent',
    aliases: ['/ascent.html'],
    title: 'ASCENT Mission | LIFTS Puerto Rico High-Altitude Balloon',
    description: 'ASCENT is a Puerto Rico-based LIFTS high-altitude balloon mission targeting a 100,000+ foot flight with multiple scientific payload modules.',
    schemaType: 'Article',
    component: () => <MissionDetailPage missionId="ascent" />,
  },
  {
    path: '/cubesat',
    aliases: ['/cubesat.html'],
    title: 'CubeSat Program | LIFTS UPRM Satellite Development',
    description: 'The LIFTS CubeSat program is developing toward a student-led 1U satellite mission at UPRM.',
    schemaType: 'Article',
    component: () => <MissionDetailPage missionId="cubesat" />,
  },
];

function normalizePath(path) {
  if (!path || path === '/index.html') return '/';
  return path.length > 1 ? path.replace(/\/$/, '') : path;
}

function resolveRoute(pathname, siteData) {
  const current = normalizePath(pathname);
  const found = routes.find((route) => route.path === current || route.aliases.includes(current));
  if (found) return found;

  // Missions created from the admin panel get their detail page automatically.
  const slug = current.slice(1);
  const mission = siteData.missions?.[slug];
  if (mission) {
    return {
      path: current,
      title: `${mission.name} | LIFTS`,
      description: mission.summary || `${mission.name} mission by LIFTS.`,
      component: () => <MissionDetailPage missionId={slug} />,
    };
  }
  return {
    path: current,
    title: 'Page Not Found | LIFTS',
    description: 'The requested LIFTS page could not be found.',
    notFound: true,
    component: NotFoundPage,
  };
}

function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function App() {
  const siteData = useSiteData();
  const [pathname, setPathname] = useState(window.location.pathname);
  const [mobileOpen, setMobileOpen] = useState(false);
  const route = useMemo(() => resolveRoute(pathname, siteData), [pathname, siteData]);
  const Page = route.component;
  const isAdmin = normalizePath(pathname).startsWith('/admin');

  useEffect(() => {
    const handleRoute = () => {
      setPathname(window.location.pathname);
      setMobileOpen(false);
    };
    window.addEventListener('popstate', handleRoute);
    return () => window.removeEventListener('popstate', handleRoute);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      document.title = 'Content Panel | LIFTS';
      return;
    }
    document.title = route.title;
    setMeta('description', route.description);
    setMeta('robots', route.notFound ? 'noindex' : 'index,follow');
    const canonical = `${SITE_URL}${route.path === '/' ? '/' : route.path}`;
    setCanonical(canonical);
    setSocialMeta(route, canonical);
    setStructuredData(route, siteData, canonical);
  }, [route, isAdmin, siteData]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  if (isAdmin) {
    return (
      <Suspense fallback={<div style={{ minHeight: '100vh', background: '#000' }} />}>
        <AdminApp />
      </Suspense>
    );
  }

  return (
    <>
      <Header activePath={route.path} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <MobileNav activePath={route.path} mobileOpen={mobileOpen} />
      <main>
        <Page />
      </main>
      <Footer />
    </>
  );
}

function setMeta(name, content) {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setMetaProperty(property, content) {
  setMetaAttribute('property', property, content);
}

function setMetaAttribute(attribute, value, content) {
  let tag = document.querySelector(`meta[${attribute}="${value}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, value);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setCanonical(href) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function setSocialMeta(route, canonical) {
  const image = route.image || DEFAULT_SOCIAL_IMAGE;
  setMetaProperty('og:type', 'website');
  setMetaProperty('og:site_name', 'LIFTS');
  setMetaProperty('og:title', route.title);
  setMetaProperty('og:description', route.description);
  setMetaProperty('og:url', canonical);
  setMetaProperty('og:image', image);
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', route.title);
  setMeta('twitter:description', route.description);
  setMeta('twitter:image', image);
}

function setStructuredData(route, siteData, canonical) {
  let script = document.getElementById('structured-data');
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'structured-data';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(buildStructuredData(route, siteData, canonical));
}

function buildStructuredData(route, siteData, canonical) {
  const organization = {
    '@type': 'Organization',
    name: siteData.organization.name,
    legalName: siteData.organization.full_name,
    description: siteData.organization.description,
    url: `${SITE_URL}/`,
    logo: DEFAULT_SOCIAL_IMAGE,
    foundingDate: '2024-01',
    email: siteData.organization.email,
    parentOrganization: {
      '@type': 'CollegeOrUniversity',
      name: siteData.organization.institution,
      url: 'https://www.uprm.edu/',
    },
    areaServed: {
      '@type': 'Place',
      name: 'Puerto Rico',
    },
    sameAs: [
      siteData.social.instagram_url,
      siteData.social.linkedin_url,
      siteData.social.youtube_url,
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: siteData.organization.email,
      contactType: 'general inquiries',
      areaServed: 'PR',
      availableLanguage: ['English', 'Spanish'],
    },
  };

  const graph = [
    organization,
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: siteData.organization.name,
      description: routes[0].description,
      publisher: { '@type': 'Organization', name: siteData.organization.name },
    },
    {
      '@type': 'WebPage',
      '@id': `${canonical}#webpage`,
      url: canonical,
      name: route.title,
      description: route.description,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: { '@type': 'Organization', name: siteData.organization.name },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        ...(route.path === '/' ? [] : [{ '@type': 'ListItem', position: 2, name: route.title.replace(' | LIFTS', ''), item: canonical }]),
      ],
    },
  ];

  if (route.faq) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: siteData.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    });
  }

  if (route.schemaType === 'Article') {
    graph.push({
      '@type': 'Article',
      headline: route.title,
      description: route.description,
      author: { '@type': 'Organization', name: siteData.organization.name },
      publisher: {
        '@type': 'Organization',
        name: siteData.organization.name,
        logo: { '@type': 'ImageObject', url: DEFAULT_SOCIAL_IMAGE },
      },
      mainEntityOfPage: canonical,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

function Link({ to, className, children, ...props }) {
  return (
    <a
      href={to}
      className={className}
      onClick={(event) => {
        const isPlainClick = !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
        if (isPlainClick) {
          event.preventDefault();
          navigate(to);
        }
      }}
      {...props}
    >
      {children}
    </a>
  );
}

function Header({ activePath, mobileOpen, setMobileOpen }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`} id="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <img src="/images/logo/lifts-logo.svg" alt="LIFTS Logo" />
        </Link>

        <nav className="nav-desktop">
          <div className="nav-links">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} className={`nav-link ${activePath === item.path ? 'active' : ''}`}>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="nav-cta">
            <Link to="/contact" className="btn btn-secondary btn-sm">Support a Mission</Link>
          </div>
        </nav>

        <button
          className={`nav-toggle ${mobileOpen ? 'active' : ''}`}
          id="navToggle"
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((value) => !value)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
}

function MobileNav({ activePath, mobileOpen }) {
  return (
    <nav className={`nav-mobile ${mobileOpen ? 'active' : ''}`} id="navMobile">
      {navItems.map((item) => (
        <Link key={item.path} to={item.path} className={`nav-link ${activePath === item.path ? 'active' : ''}`}>
          {item.label}
        </Link>
      ))}
      <Link to="/contact" className="btn btn-primary nav-mobile-cta">Support a Mission</Link>
    </nav>
  );
}

function Footer() {
  const siteData = useSiteData();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <img className="footer-logo" src="/images/logo/lifts-logo-white.svg" alt="LIFTS" />
            <p className="footer-description">{siteData.organization.description}</p>
          </div>
          <div className="footer-column">
            <h4>Explore</h4>
            <div className="footer-links">
              {navItems.slice(1, 5).map((item) => (
                <Link key={item.path} to={item.path} className="footer-link">{item.label}</Link>
              ))}
            </div>
          </div>
          <div className="footer-column">
            <h4>Connect</h4>
            <div className="footer-links">
              <a href={siteData.social.instagram_url} className="footer-link">Instagram</a>
              <a href={siteData.social.linkedin_url} className="footer-link">LinkedIn</a>
              <a href={siteData.social.youtube_url} className="footer-link">YouTube</a>
            </div>
          </div>
          <div className="footer-column">
            <h4>Contact</h4>
            <div className="footer-links">
              <a href={`mailto:${primaryContactEmail(siteData.contact)}`} className="footer-link">{primaryContactEmail(siteData.contact)}</a>
              <Link to="/contributors" className="footer-link">Contributors</Link>
              <Link to="/privacy" className="footer-link">Privacy</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copyright">© {new Date().getFullYear()} {siteData.organization.name}. All rights reserved.</p>
          <div className="footer-legal">
            <Link to="/privacy">Privacy</Link>
            <Link to="/contact">Contact</Link>
            <a href="/admin">Member Login</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Hero({ title, subtitle, image, actions, logo = false, mission = false }) {
  return (
    <section className={`hero ${mission ? 'hero-mission' : ''}`}>
      <div className="hero-media">
        <img src={image} alt="" />
      </div>
      <div className="hero-overlay"></div>
      <div className="hero-content">
        {logo ? (
          <>
            <h1 className="sr-only">{title}</h1>
            <img className="hero-title" src="/images/logo/lifts-logo-white.svg" alt="LIFTS Logo White Monochrome" />
          </>
        ) : (
          <h1 className="hero-title">{title}</h1>
        )}
        <p className="hero-subtitle">{subtitle}</p>
        {actions ? <div className="hero-actions">{actions}</div> : null}
      </div>
      <div className="hero-scroll" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </section>
  );
}

function PageHero({ label, title, subtitle, image = '/images/backgrounds/hero-space.svg' }) {
  return (
    <section className="page-hero">
      <div className="page-hero-bg">
        <img src={image} alt="" />
      </div>
      <div className="page-hero-overlay"></div>
      <div className="page-hero-content">
        <span className="section-label">{label}</span>
        <h1 className="page-hero-title">{title}</h1>
        <p className="page-hero-subtitle">{subtitle}</p>
      </div>
    </section>
  );
}

function SectionHeader({ label, title, subtitle }) {
  return (
    <div className="section-header">
      {label ? <span className="section-label">{label}</span> : null}
      <h2 className="section-title">{title}</h2>
      {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
    </div>
  );
}

function Countdown({ targetDate }) {
  const [remaining, setRemaining] = useState(() => getRemaining(targetDate));

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(getRemaining(targetDate)), 1000);
    return () => window.clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="countdown" id="countdown" aria-label="Countdown to next mission">
      {[
        ['Days', remaining.days],
        ['Hours', remaining.hours],
        ['Minutes', remaining.minutes],
        ['Seconds', remaining.seconds],
      ].map(([label, value]) => (
        <div className="countdown-item" key={label}>
          <span className="countdown-value">{String(Math.max(value, 0)).padStart(2, '0')}</span>
          <span className="countdown-label">{label}</span>
        </div>
      ))}
    </div>
  );
}

function getRemaining(targetDate) {
  const total = Math.max(new Date(targetDate).getTime() - Date.now(), 0);
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / 1000 / 60) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}

function MissionCard({ mission }) {
  return (
    <article className="card">
      <div className="card-image">
        <img src={mission.image} alt={`${mission.name} mission`} />
      </div>
      <div className="card-content">
        <span className={`status-tag status-${mission.status}`}>{mission.status_display || mission.status}</span>
        <h3 className="card-title">{mission.name}</h3>
        <p className="card-label">{mission.date_display || mission.status_display} {mission.location ? `• ${mission.location}` : ''}</p>
        <p className="card-description">{mission.summary}</p>
        <Link to={`/${mission.slug}`} className="btn btn-ghost">View Mission</Link>
      </div>
    </article>
  );
}

function StatsGrid() {
  const siteData = useSiteData();
  const stats = [
    ['Missions Completed', siteData.stats.missions_completed],
    ['Max Altitude', siteData.stats.max_altitude_display],
    ['Team Members', siteData.team.member_count_display],
    ['Recovery Rate', siteData.stats.recovery_rate],
  ];

  return (
    <div className="stats-grid" id="statsGrid">
      {stats.map(([label, value]) => (
        <div className="stat-item" key={label}>
          <span className="stat-value">{value}</span>
          <span className="stat-label">{label}</span>
        </div>
      ))}
    </div>
  );
}

function HomePage() {
  const siteData = useSiteData();
  const missions = Object.values(siteData.missions);
  const featured = missions.find((mission) => mission.status === 'upcoming');

  return (
    <>
      <Hero
        title={siteData.organization.full_name}
        logo
        image="https://images.unsplash.com/photo-1661705969607-cde73828023d?q=80&w=2832&auto=format&fit=crop"
        subtitle={siteData.organization.tagline}
        actions={
          <>
            <Link to="/missions" className="btn btn-primary btn-lg">Explore Missions</Link>
            <Link to="/about" className="btn btn-secondary btn-lg">Learn More About LIFTS</Link>
          </>
        }
      />

      {featured ? (
        <section className="featured-event" id="nextMission">
          <div className="container">
            <div className="featured-event-content">
              <div className="featured-event-info">
                <span className="featured-event-label">Next Mission</span>
                <h2 className="featured-event-title">{featured.name} Mission</h2>
                <Countdown targetDate={featured.date_iso || featured.date} />
                <div className="featured-event-meta">
                  <Meta label="Date" value={featured.date_display} />
                  <Meta label="Location" value={featured.location} />
                  {featured.target_altitude_display ? (
                    <Meta label="Target Altitude" value={featured.target_altitude_display} />
                  ) : null}
                </div>
                <Link to={`/${featured.slug}`} className="btn btn-primary">View Mission Details</Link>
              </div>
              <div className="featured-event-image">
                <img src={featured.image} alt={`${featured.name} mission preparation`} />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section" id="missionHighlights">
        <div className="container">
          <SectionHeader
            label="Our Work"
            title="Mission Highlights"
            subtitle="Explore completed, upcoming, and in-progress missions pushing the boundaries of student-led near-space research."
          />
          <div className="scroll-container">
            {missions.map((mission) => (
              <div className="scroll-item" key={mission.slug}>
                <MissionCard mission={mission} />
              </div>
            ))}
          </div>
          <div className="text-center section-action">
            <Link to="/missions" className="btn btn-secondary">View All Missions</Link>
          </div>
        </div>
      </section>

      <section className="section section-dark">
        <div className="container">
          <StatsGrid />
        </div>
      </section>

      <AnswerSection />
      <ProgramsSection />
    </>
  );
}

function Meta({ label, value }) {
  return (
    <div className="featured-event-meta-item">
      <span className="featured-event-meta-label">{label}</span>
      <span className="featured-event-meta-value">{value}</span>
    </div>
  );
}

function MissionsPage() {
  const siteData = useSiteData();
  const [filter, setFilter] = useState('all');
  const missions = Object.values(siteData.missions);
  const filtered = filter === 'all' ? missions : missions.filter((mission) => mission.status === filter);

  return (
    <>
      <PageHero
        label="Missions"
        title="Near-Space Work, Built by Students"
        subtitle="From high-altitude balloon launches to future satellite systems, LIFTS turns aerospace learning into flight-tested work."
      />
      <section className="section">
        <div className="container">
          <div className="filter-bar">
            {['all', 'completed', 'upcoming', 'in-progress'].map((value) => (
              <button key={value} className={`filter-btn ${filter === value ? 'active' : ''}`} onClick={() => setFilter(value)}>
                {value === 'all' ? 'All' : value.replace('-', ' ')}
              </button>
            ))}
          </div>
          <div className="grid grid-3">
            {filtered.map((mission) => (
              <MissionCard mission={mission} key={mission.slug} />
            ))}
          </div>
        </div>
      </section>
      <section className="section section-dark">
        <div className="container">
          <StatsGrid />
        </div>
      </section>
    </>
  );
}

function LaunchesPage() {
  const siteData = useSiteData();
  return (
    <>
      <PageHero
        label="Launches"
        title="Launch Schedule"
        subtitle="Follow upcoming launches, completed flights, and the mission milestones that move LIFTS forward."
        image="/images/backgrounds/hero-launch.svg"
      />
      <section className="section">
        <div className="container container-content">
          <div className="launch-list">
            {siteData.launches.map((launch) => {
              const mission = siteData.missions[launch.mission];
              if (!mission) return null;
              return (
                <article className="launch-item" key={launch.mission}>
                  <div className="launch-date">
                    <span className="date-month">{mission.date_month}</span>
                    <span className="date-day">{mission.date_day}</span>
                    <span className="date-year">{mission.date_year}</span>
                  </div>
                  <div>
                    <h3 className="launch-name">{mission.name}</h3>
                    <p className="card-description">{mission.full_name}</p>
                    <p className="launch-location">{mission.location_full || mission.location} {mission.launch_time ? `— ${mission.launch_time}` : ''}</p>
                  </div>
                  <Link to={launch.path} className="btn btn-secondary">{launch.cta}</Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <section className="section section-dark">
        <div className="container">
          <StatsGrid />
        </div>
      </section>
    </>
  );
}

function MissionDetailPage({ missionId }) {
  const siteData = useSiteData();
  const mission = siteData.missions[missionId];
  if (!mission) return null;
  const specs = getMissionSpecs(missionId, mission);

  return (
    <>
      <Hero title={mission.name} subtitle={mission.full_name || mission.summary} image={mission.image} mission />
      <section className="section">
        <div className="container">
          <div className="grid grid-2 mission-detail-grid">
            <div>
              <span className={`status-tag status-${mission.status}`}>{mission.status_display || mission.status}</span>
              <h2 className="section-title mission-title">{mission.name}</h2>
              <p className="section-subtitle mission-summary">{mission.summary}</p>
              <div className="hero-actions mission-actions">
                <Link to="/missions" className="btn btn-secondary">All Missions</Link>
                <Link to="/contact" className="btn btn-primary">Support This Work</Link>
              </div>
            </div>
            <div className="stats-panel">
              {specs.map(([label, value]) => (
                <div className="stat-row" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section section-dark">
        <div className="container">
          <div className="grid grid-2">
            <InfoList title="Objectives" items={mission.objectives} />
            <InfoList title="Highlights" items={mission.highlights} />
          </div>
        </div>
      </section>
    </>
  );
}

function getMissionSpecs(missionId, mission) {
  if (missionId === 'nexo') {
    return [
      ['Date', mission.date_display],
      ['Location', `${mission.location_full} — ${mission.launch_time}`],
      ['Max Altitude', mission.max_altitude_display],
      ['Flight Duration', mission.flight_duration_tracked],
      ['Recovery', mission.recovery_info],
    ];
  }
  if (missionId === 'ascent') {
    return [
      ['Date', mission.date_display],
      ['Location', mission.location_full],
      ['Target Altitude', mission.target_altitude_display],
      ['Estimated Flight Time', mission.est_flight_time],
      ['Payload Mass', mission.payload_mass_display],
      ['Payloads', mission.payload_count_display],
    ];
  }
  if (missionId === 'cubesat') {
    return [
      ['Form Factor', mission.form_factor],
      ['Dimensions', mission.dimensions],
      ['Mass', mission.mass],
      ['Target Orbit', mission.target_orbit_altitude],
      ['Mission Life', mission.mission_life],
      ['Target Year', mission.target_year],
    ];
  }
  // Missions created from the admin panel: show whichever common specs exist.
  return [
    ['Date', mission.date_display],
    ['Location', mission.location_full || mission.location],
    ['Target Altitude', mission.target_altitude_display],
    ['Max Altitude', mission.max_altitude_display],
    ['Flight Duration', mission.flight_duration_tracked || mission.flight_duration],
    ['Recovery', mission.recovery_info],
  ].filter(([, value]) => value);
}

function InfoList({ title, items }) {
  if (!items?.length) return null;
  return (
    <div className="info-list">
      <h3 className="card-title">{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function UpdatesPage() {
  const siteData = useSiteData();
  return (
    <>
      <PageHero
        label="Updates"
        title="Mission Notes"
        subtitle="News, milestones, and development updates from the LIFTS team."
      />
      <section className="section">
        <div className="container">
          <div className="grid grid-3">
            {siteData.updates.map((update) => (
              <article className="news-card" key={update.id || update.title}>
                {update.image ? (
                  <div className="card-image">
                    <img src={update.image} alt="" />
                  </div>
                ) : null}
                <div className="news-card-content">
                  <div className="news-card-meta">{update.category} • {update.date}</div>
                  <h3 className="news-card-title">{update.title}</h3>
                  <p className="news-card-excerpt">{update.summary}</p>
                  {update.body ? <p className="news-card-excerpt">{update.body}</p> : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      {siteData.gallery?.length ? (
        <section className="section section-dark">
          <div className="container">
            <SectionHeader label="Gallery" title="From the Field" />
            <div className="grid grid-3">
              {siteData.gallery.map((item) => (
                <figure className="card" key={item.id || item.image_url} style={{ margin: 0 }}>
                  <div className="card-image">
                    <img src={item.image_url} alt={item.title || ''} />
                  </div>
                  <figcaption className="card-content">
                    {item.title ? <h3 className="card-title">{item.title}</h3> : null}
                    {item.caption ? <p className="card-description">{item.caption}</p> : null}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <NewsletterSection />
    </>
  );
}

function CareersPage() {
  const siteData = useSiteData();
  return (
    <>
      <PageHero
        label="Careers"
        title="Join the Team"
        subtitle="LIFTS needs students who want to build, test, document, operate, and communicate real aerospace missions."
      />
      <section className="section">
        <div className="container">
          <div className="grid grid-2">
            {siteData.careers.map((role) => (
              <article className="job-card" key={role.title}>
                <div className="job-card-header">
                  <div>
                    <h3 className="job-card-title">{role.title}</h3>
                    <p className="job-card-department">{role.team}</p>
                  </div>
                  <span className="job-card-type">Student Role</span>
                </div>
                <p className="job-card-description">{role.description}</p>
                <Link to="/contact" className="btn btn-ghost">Apply Interest</Link>
              </article>
            ))}
          </div>
        </div>
      </section>
      <FaqSection />
    </>
  );
}

function AboutPage() {
  const siteData = useSiteData();
  return (
    <>
      <PageHero
        label="About"
        title={siteData.organization.full_name}
        subtitle={siteData.organization.description}
      />
      <section className="section">
        <div className="container container-content">
          <SectionHeader
            label="Our Why"
            title="Building Space Capability From Puerto Rico"
            subtitle="LIFTS gives students a practical path from classroom fundamentals to flight operations, research payloads, and satellite systems."
          />
          <div className="grid grid-3">
            <ValueCard title="Research" description="Design experiments, collect flight data, and learn through mission-driven engineering." />
            <ValueCard title="Operations" description="Practice launch readiness, tracking, recovery, safety, and field coordination." />
            <ValueCard title="Community" description="Create aerospace opportunities for students at UPRM and collaborators across Puerto Rico." />
          </div>
        </div>
      </section>
      <ProgramsSection />
    </>
  );
}

function ProgramsSection() {
  const siteData = useSiteData();
  return (
    <section className="section">
      <div className="container">
        <SectionHeader label="Programs" title="A Practical Aerospace Pipeline" subtitle="Each program builds technical depth while supporting the next mission." />
        <div className="grid grid-3">
          {siteData.programs.map((program) => (
            <article className="tech-card" key={program.name}>
              <h3 className="tech-card-title">{program.name}</h3>
              <p className="tech-card-description">{program.description}</p>
              <div className="program-facts">
                {program.facts.map((fact) => <span key={fact}>{fact}</span>)}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AnswerSection() {
  const siteData = useSiteData();
  const answers = [
    {
      question: 'What is LIFTS?',
      answer: `${siteData.organization.full_name} is a student-led near-space research organization at UPRM. The team designs, builds, launches, tracks, and recovers high-altitude balloon payloads while developing the technical foundation for future CubeSat work from Puerto Rico.`,
    },
    {
      question: 'What missions does LIFTS work on?',
      answer: 'LIFTS works on high-altitude balloon missions, mission operations, payload development, and CubeSat research. Current programs include the completed NEXO eclipse balloon flight, the upcoming ASCENT Puerto Rico balloon mission, and a long-range 1U CubeSat development path.',
    },
    {
      question: 'How can students, sponsors, or collaborators connect with LIFTS?',
      answer: `Students and collaborators can contact LIFTS at ${siteData.organization.email}. The team welcomes interest in aerospace engineering, electronics, flight software, mission operations, outreach, sponsorship, media, and research collaboration.`,
    },
  ];

  return (
    <section className="section answer-section">
      <div className="container">
        <SectionHeader
          label="Quick Answers"
          title="Near-Space Research at UPRM"
          subtitle="Concise answers for students, partners, search snippets, and AI-powered discovery."
        />
        <div className="grid grid-3">
          {answers.map((item) => (
            <article className="answer-card" key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ValueCard({ title, description }) {
  return (
    <article className="card value-card">
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        <p className="card-description">{description}</p>
      </div>
    </article>
  );
}

function ContactPage() {
  const siteData = useSiteData();
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const topic = form.elements.topic.value.trim();
    const message = form.elements.message.value.trim();
    if (!name || !email.includes('@') || !message) {
      setError('Please enter your name, a valid email, and a message.');
      setStatus('error');
      return;
    }
    setError('');
    setStatus('sending');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('contact', {
        body: { name, email, topic, message },
      });
      if (fnError || data?.error) {
        setError(data?.error || 'Something went wrong. Please try again or email us directly.');
        setStatus('error');
      } else {
        setStatus('done');
        form.reset();
      }
    } catch {
      setError('Something went wrong. Please try again or email us directly.');
      setStatus('error');
    }
  }

  return (
    <>
      <PageHero
        label="Contact"
        title="Connect With LIFTS"
        subtitle="Reach out about joining, supporting a mission, media, or collaboration."
      />
      <section className="section">
        <div className="container">
          <div className="grid grid-2">
            <div className="contact-info-list">
              {siteData.contact.cards.map((card) => (
                <div className="contact-info-item" key={card.title}>
                  <h4>{card.title}</h4>
                  <p><a href={`mailto:${card.value}`}>{card.value}</a></p>
                  <p>{card.description}</p>
                </div>
              ))}
            </div>
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="name">Name</label>
                <input className="form-input" id="name" name="name" required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email</label>
                <input className="form-input" id="email" name="email" type="email" required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="topic">Topic</label>
                <select className="form-select" id="topic" name="topic">
                  <option>Joining LIFTS</option>
                  <option>Mission support</option>
                  <option>Media</option>
                  <option>Partnership</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="message">Message</label>
                <textarea className="form-textarea" id="message" name="message" rows="6" required></textarea>
              </div>
              {status === 'error' && error ? <p className="form-error">{error}</p> : null}
              {status === 'done' ? <p className="form-success">Thanks for reaching out. Your message was sent to the LIFTS team and we&rsquo;ll reply to the email you provided.</p> : null}
              <button className="btn btn-primary" type="submit" disabled={status === 'sending' || status === 'done'}>
                {status === 'sending' ? 'Sending…' : status === 'done' ? 'Message Sent' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </section>
      <FaqSection />
    </>
  );
}

function ContributorsPage() {
  const siteData = useSiteData();
  return (
    <>
      <PageHero
        label="Contributors"
        title="Partners and Supporters"
        subtitle="LIFTS grows through university support, research collaboration, sponsors, and mission partners."
      />
      <section className="section">
        <div className="container">
          <div className="logo-grid">
            {siteData.contributors.map((contributor) => (
              <article className="logo-card" key={contributor.name}>
                <img src={contributor.logo} alt={contributor.name} />
                <h3>{contributor.name}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section section-dark">
        <div className="container">
          <SectionHeader label="Documents" title="Contributor Resources" />
          <div className="grid grid-3">
            {siteData.documents.map((doc) => (
              <a className="card document-card" href={doc.path} key={doc.title}>
                <div className="card-content">
                  <h3 className="card-title">{doc.title}</h3>
                  <p className="card-description">Open resource</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function PrivacyPage() {
  const siteData = useSiteData();
  const email = primaryContactEmail(siteData.contact);
  return (
    <>
      <PageHero
        label="Privacy"
        title="Privacy Policy"
        subtitle="How LIFTS collects, uses, shares, and protects your personal information, and the rights you have over it."
      />
      <section className="section">
        <div className="container container-narrow">
          <div className="legal-content">
            <p className="legal-meta">Last updated: June 14, 2026</p>

            <h2>Introduction</h2>
            <p>This Privacy Policy explains how LIFTS ("LIFTS," "we," "us," or "our"), a student organization based at the University of Puerto Rico at Mayag&uuml;ez (UPRM), collects, uses, discloses, and safeguards personal information when you visit this website, contact us, subscribe to our newsletter, or hold a member account. It also describes the choices and rights available to you.</p>
            <p>We are committed to handling personal information responsibly and in line with applicable data protection laws, including the EU and UK General Data Protection Regulation (GDPR), the California Consumer Privacy Act as amended by the California Privacy Rights Act (CCPA/CPRA), the California Online Privacy Protection Act (CalOPPA), Canada&rsquo;s Personal Information Protection and Electronic Documents Act (PIPEDA), and Australia&rsquo;s Privacy Act 1988 and the Australian Privacy Principles (APPs).</p>
            <p>If you do not agree with this Policy, please do not use the website or submit personal information to us.</p>

            <h2>Who Is Responsible for Your Information</h2>
            <p>LIFTS is the controller responsible for the personal information described in this Policy. For any privacy question or to exercise your rights, contact us at <a href={`mailto:${email}`}>{email}</a>. We do not currently operate in a jurisdiction that requires a designated Data Protection Officer or local representative; the contact above handles all privacy requests.</p>

            <h2>Information We Collect</h2>
            <h3>Information you provide to us</h3>
            <ul>
              <li><strong>Contact details and messages.</strong> When you email us or use the contact form, we receive the information you choose to share, such as your name, email address, the topic you select, and the contents of your message.</li>
              <li><strong>Newsletter subscriptions.</strong> If you subscribe to our newsletter, we collect your email address in order to send you updates.</li>
              <li><strong>Member accounts.</strong> If you are a LIFTS member with access to the member area, we process account information such as your name, email address, role, and related membership details.</li>
            </ul>
            <h3>Information collected automatically</h3>
            <ul>
              <li><strong>Technical and usage data.</strong> Like most websites, our hosting and backend providers automatically record limited technical information in server logs, which may include your IP address, browser and device type, referring pages, and the date and time of your request. This information helps us keep the site secure and operational.</li>
              <li><strong>Local storage for sign-in.</strong> The member area uses your browser&rsquo;s local storage to keep you signed in during a session. We do not use advertising or third-party analytics cookies on the public website.</li>
            </ul>
            <p>We do not knowingly collect special categories of sensitive personal information, and we ask that you not send such information to us.</p>

            <h2>How We Use Your Information</h2>
            <ul>
              <li>To respond to your inquiries and communicate with you.</li>
              <li>To send the newsletter and other updates you have requested.</li>
              <li>To create and administer member accounts and coordinate team activity.</li>
              <li>To operate, maintain, secure, and improve the website.</li>
              <li>To comply with legal obligations and protect our rights and the rights of others.</li>
            </ul>
            <p>We do not use your personal information to make automated decisions that produce legal or similarly significant effects about you.</p>

            <h2>Legal Bases for Processing (GDPR / UK GDPR)</h2>
            <p>If you are in the European Economic Area, the United Kingdom, or another region with similar laws, we rely on the following legal bases:</p>
            <ul>
              <li><strong>Consent</strong> &mdash; for example, when you subscribe to our newsletter. You may withdraw consent at any time.</li>
              <li><strong>Performance of, or steps toward, a relationship</strong> &mdash; for example, administering your member account.</li>
              <li><strong>Legitimate interests</strong> &mdash; such as responding to your messages, keeping the site secure, and operating our organization, where those interests are not overridden by your rights.</li>
              <li><strong>Legal obligation</strong> &mdash; where we must process information to comply with the law.</li>
            </ul>

            <h2>How We Share Information</h2>
            <p>We do not sell your personal information, and we do not share it for cross-context behavioral advertising or targeted advertising. We disclose personal information only in these limited circumstances:</p>
            <ul>
              <li><strong>Service providers.</strong> We use trusted vendors that process information on our behalf, including Supabase (database, authentication, and serverless functions), Resend (newsletter delivery and list management), and GitHub Pages (website hosting). These providers are bound by contract to use the information only to provide services to us.</li>
              <li><strong>Legal and safety reasons.</strong> We may disclose information if required by law or to protect the rights, safety, or property of LIFTS, our members, or others.</li>
              <li><strong>Organizational changes.</strong> Information may be transferred in connection with a reorganization of the student organization or its programs.</li>
            </ul>

            <h2>International Data Transfers</h2>
            <p>Our service providers may store and process information in the United States and other countries that may have data protection laws different from those in your jurisdiction. Where required, we rely on appropriate safeguards, such as standard contractual clauses, to protect information transferred internationally.</p>

            <h2>Data Retention</h2>
            <p>We keep personal information only for as long as necessary for the purposes described in this Policy. Newsletter email addresses are retained until you unsubscribe; contact correspondence is kept as long as needed to address your request; and member account information is retained for the duration of your membership and a reasonable period afterward, unless a longer period is required by law.</p>

            <h2>Data Security</h2>
            <p>We use reasonable technical and organizational measures to protect personal information against unauthorized access, loss, or misuse. No method of transmission or storage is completely secure, however, and we cannot guarantee absolute security.</p>

            <h2>Cookies, Do Not Track, and Global Privacy Control</h2>
            <p>The public website does not use tracking or advertising cookies, and we do not permit third parties to collect personally identifiable information about your online activities across different websites when you use our site. Because we do not track you across third-party sites, browser &ldquo;Do Not Track&rdquo; and Global Privacy Control signals have no third-party tracking to disable; we honor recognized opt-out preference signals to the extent they apply to our processing.</p>

            <h2>Your Privacy Rights</h2>
            <p>Depending on where you live, you may have some or all of the rights below. We will not discriminate against you for exercising them.</p>
            <h3>EEA / UK (GDPR)</h3>
            <ul>
              <li>Access a copy of your personal information.</li>
              <li>Rectify inaccurate or incomplete information.</li>
              <li>Erase your information ("right to be forgotten").</li>
              <li>Restrict or object to processing, including direct marketing.</li>
              <li>Data portability.</li>
              <li>Withdraw consent at any time, without affecting prior processing.</li>
              <li>Lodge a complaint with your local data protection supervisory authority.</li>
            </ul>
            <h3>California (CCPA / CPRA)</h3>
            <ul>
              <li>Know what personal information we collect, use, and disclose.</li>
              <li>Access and obtain a copy of your personal information.</li>
              <li>Correct inaccurate personal information.</li>
              <li>Delete personal information, subject to legal exceptions.</li>
              <li>Opt out of the sale or sharing of personal information &mdash; note that we do not sell or share personal information.</li>
              <li>Limit the use of sensitive personal information &mdash; we do not use sensitive personal information for purposes that require this option.</li>
              <li>Designate an authorized agent to make a request on your behalf.</li>
            </ul>
            <p>California residents may also request, once per year, information about disclosures to third parties for their direct marketing purposes under California&rsquo;s "Shine the Light" law. We do not share personal information for third-party direct marketing.</p>
            <h3>Canada (PIPEDA)</h3>
            <ul>
              <li>Access the personal information we hold about you and request corrections.</li>
              <li>Withdraw consent, subject to legal or contractual limits.</li>
              <li>Challenge our compliance and complain to the Office of the Privacy Commissioner of Canada.</li>
            </ul>
            <h3>Australia (Privacy Act / APPs)</h3>
            <ul>
              <li>Access and seek correction of your personal information.</li>
              <li>Ask how we handle your information and raise a concern.</li>
              <li>Complain to the Office of the Australian Information Commissioner (OAIC) if you are not satisfied with our response.</li>
            </ul>
            <p>To exercise any of these rights, email us at <a href={`mailto:${email}`}>{email}</a>. We may need to verify your identity before acting on a request, and we will respond within the timeframe required by applicable law.</p>

            <h2>Children&rsquo;s Privacy</h2>
            <p>This website is intended for a general, university-aged audience and is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us so we can delete it.</p>

            <h2>Third-Party Links</h2>
            <p>Our site may link to external services such as Instagram, LinkedIn, YouTube, and partner websites. We are not responsible for the privacy practices of those services, and we encourage you to review their privacy policies.</p>

            <h2>Changes to This Policy</h2>
            <p>We may update this Policy from time to time. When we do, we will revise the &ldquo;Last updated&rdquo; date above, and for material changes we will provide a more prominent notice where appropriate. Your continued use of the website after an update means you accept the revised Policy.</p>

            <h2>Contact Us</h2>
            <p>If you have questions, concerns, or requests regarding this Policy or your personal information, contact LIFTS at <a href={`mailto:${email}`}>{email}</a>, University of Puerto Rico at Mayag&uuml;ez, Mayag&uuml;ez, Puerto Rico.</p>
          </div>
        </div>
      </section>
    </>
  );
}

function FaqSection() {
  const siteData = useSiteData();
  return (
    <section className="section section-dark">
      <div className="container container-content">
        <SectionHeader label="FAQ" title="Common Questions" />
        <div className="faq-list">
          {siteData.faqs.map((faq) => (
            <article className="faq-item" key={faq.question}>
              <h3 className="faq-question">{faq.question}</h3>
              <p className="faq-answer">{faq.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function NewsletterSection() {
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const email = event.currentTarget.elements['newsletter-email'].value.trim();
    setStatus('sending');
    try {
      const { data, error } = await supabase.functions.invoke('subscribe', { body: { email } });
      if (error || data?.error) {
        setErrorMessage(data?.error || 'Something went wrong. Please try again.');
        setStatus('error');
      } else {
        setStatus('done');
      }
    } catch {
      setErrorMessage('Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  return (
    <section className="section section-dark">
      <div className="container container-narrow">
        <SectionHeader label="Stay Updated" title="Follow Mission Progress" subtitle="Get launch announcements, mission results, and program news from the LIFTS team." />
        <form className="newsletter-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="newsletter-email">Email</label>
            <input className="form-input" id="newsletter-email" type="email" required disabled={status === 'done'} />
          </div>
          {status === 'done' ? <p className="form-success">You're on the list. Thanks for following LIFTS!</p> : null}
          {status === 'error' ? <p className="form-error">{errorMessage}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={status === 'sending' || status === 'done'}>
            {status === 'sending' ? 'Signing you up…' : status === 'done' ? 'Subscribed' : 'Register Interest'}
          </button>
        </form>
      </div>
    </section>
  );
}

function NotFoundPage() {
  return (
    <>
      <PageHero
        label="Page Not Found"
        title="404"
        subtitle="The page you are looking for does not exist or may have moved."
      />
      <section className="section not-found-section">
        <div className="container container-narrow">
          <div className="not-found-actions">
            <Link to="/" className="btn btn-primary">Return Home</Link>
            <Link to="/missions" className="btn btn-secondary">Explore Missions</Link>
            <Link to="/contact" className="btn btn-ghost">Contact LIFTS</Link>
          </div>
        </div>
      </section>
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <ContentProvider>
    <App />
  </ContentProvider>
);
