import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ContentProvider, useSiteData } from './lib/content.jsx';
import './styles/main.css';
import './styles/react.css';

const AdminApp = React.lazy(() => import('./admin/AdminApp.jsx'));

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
    description: 'LIFTS is a student-led near-space research program at UPRM conducting high-altitude balloon missions and CubeSat development.',
    component: HomePage,
  },
  {
    path: '/missions',
    aliases: ['/missions.html'],
    title: 'Missions | LIFTS',
    description: 'Explore LIFTS high-altitude balloon missions and CubeSat development work.',
    component: MissionsPage,
  },
  {
    path: '/launches',
    aliases: ['/launches.html'],
    title: 'Launches | LIFTS',
    description: 'Track upcoming and completed LIFTS launches.',
    component: LaunchesPage,
  },
  {
    path: '/updates',
    aliases: ['/updates.html'],
    title: 'Updates | LIFTS',
    description: 'News and updates from the LIFTS mission team.',
    component: UpdatesPage,
  },
  {
    path: '/careers',
    aliases: ['/careers.html'],
    title: 'Careers | LIFTS',
    description: 'Join LIFTS and help build near-space research missions at UPRM.',
    component: CareersPage,
  },
  {
    path: '/about',
    aliases: ['/about.html'],
    title: 'About | LIFTS',
    description: 'Learn about LIFTS, a student aerospace research organization at UPRM.',
    component: AboutPage,
  },
  {
    path: '/contact',
    aliases: ['/contact.html'],
    title: 'Contact | LIFTS',
    description: 'Contact LIFTS for student interest, media, partnerships, and mission support.',
    component: ContactPage,
  },
  {
    path: '/contributors',
    aliases: ['/contributors.html'],
    title: 'Contributors | LIFTS',
    description: 'Meet the partners and contributors supporting LIFTS missions.',
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
    title: 'NEXO Mission | LIFTS',
    description: 'NEXO was the first LIFTS high-altitude balloon mission.',
    component: () => <MissionDetailPage missionId="nexo" />,
  },
  {
    path: '/ascent',
    aliases: ['/ascent.html'],
    title: 'ASCENT Mission | LIFTS',
    description: 'ASCENT is the next LIFTS high-altitude balloon mission.',
    component: () => <MissionDetailPage missionId="ascent" />,
  },
  {
    path: '/cubesat',
    aliases: ['/cubesat.html'],
    title: 'CubeSat Program | LIFTS',
    description: 'The LIFTS CubeSat program is developing toward a student-led satellite mission.',
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
  return routes[0];
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
    setCanonical(`https://liftspr.org${route.path === '/' ? '/' : route.path}`);
  }, [route, isAdmin]);

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

function setCanonical(href) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
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
              <a href={`mailto:${siteData.contact.general_email}`} className="footer-link">{siteData.contact.general_email}</a>
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
          <img className="hero-title" src="/images/logo/lifts-logo-white.svg" alt="LIFTS Logo White Monochrome" />
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

function MissionCard({ mission, compact = false }) {
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
        {!compact ? <Link to={`/${mission.slug}`} className="btn btn-ghost">View Mission</Link> : null}
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
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = form.elements.email.value.trim();
    const message = form.elements.message.value.trim();
    if (!email.includes('@') || !message) {
      setError('Please enter a valid email and message.');
      return;
    }
    setError('');
    setSubmitted(true);
    form.reset();
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
            <form className="contact-form" data-validate onSubmit={handleSubmit}>
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
              {error ? <p className="form-error">{error}</p> : null}
              {submitted ? <p className="form-success">Thanks. Please send this message directly by email if you need a reply quickly.</p> : null}
              <button className="btn btn-primary" type="submit">Send Message</button>
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
  return (
    <>
      <PageHero
        label="Privacy"
        title="Privacy Policy"
        subtitle="How this website handles basic visitor and contact information."
      />
      <section className="section">
        <div className="container container-narrow">
          <div className="legal-content">
            <h2>Information We Collect</h2>
            <p>This website is a static informational site. If you contact LIFTS, the information you provide is used to respond to your message and coordinate relevant team activity.</p>
            <h2>Third-Party Services</h2>
            <p>The site may link to external services such as Instagram, LinkedIn, YouTube, and partner websites. Those services have their own privacy practices.</p>
            <h2>Contact</h2>
            <p>Questions about this policy can be sent to <a href={`mailto:${siteData.contact.general_email}`}>{siteData.contact.general_email}</a>.</p>
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
  const [submitted, setSubmitted] = useState(false);
  return (
    <section className="section section-dark">
      <div className="container container-narrow">
        <SectionHeader label="Stay Updated" title="Follow Mission Progress" subtitle="Use the contact form for now while the team evaluates a dedicated newsletter backend." />
        <form className="newsletter-form" onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
        }}>
          <div className="form-group">
            <label className="form-label" htmlFor="newsletter-email">Email</label>
            <input className="form-input" id="newsletter-email" type="email" required />
          </div>
          {submitted ? <p className="form-success">Thanks. Newsletter capture is noted for future backend integration.</p> : null}
          <button className="btn btn-primary" type="submit">Register Interest</button>
        </form>
      </div>
    </section>
  );
}

createRoot(document.getElementById('root')).render(
  <ContentProvider>
    <App />
  </ContentProvider>
);
