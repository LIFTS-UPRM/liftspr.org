import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, uploadImage } from '../lib/supabaseClient';
import '../styles/admin.css';

const STATUS_DISPLAY = {
  completed: 'Completed',
  upcoming: 'Upcoming',
  'in-progress': 'In Progress',
};

const POST_CATEGORIES = ['Mission Update', 'Program Update', 'Flight Result', 'Announcement', 'Outreach'];

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function deriveDateFields(dateStr) {
  if (!dateStr) return {};
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return { date: dateStr };
  const display = new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  return {
    date: dateStr,
    date_iso: `${dateStr}T00:00:00`,
    date_display: display,
    date_month: MONTHS[month - 1],
    date_day: String(day).padStart(2, '0'),
    date_year: String(year),
  };
}

// ---------------------------------------------------------------------------
// Site Info section definitions: drives the generic form builder below.
// Field types: text | textarea | number | image | lines | list
// ---------------------------------------------------------------------------
const SECTIONS = [
  {
    key: 'organization', label: 'Organization', kind: 'object',
    fields: [
      { name: 'name', label: 'Short Name' },
      { name: 'full_name', label: 'Full Name' },
      { name: 'tagline', label: 'Tagline (homepage hero)', type: 'textarea' },
      { name: 'description', label: 'Description (footer & about)', type: 'textarea' },
      { name: 'institution', label: 'Institution' },
      { name: 'email', label: 'Email' },
      { name: 'founded', label: 'Founded' },
    ],
  },
  {
    key: 'stats', label: 'Stats', kind: 'object',
    fields: [
      { name: 'missions_completed', label: 'Missions Completed', type: 'number' },
      { name: 'missions_planned', label: 'Missions Planned', type: 'number' },
      { name: 'max_altitude_ft', label: 'Max Altitude (ft)', type: 'number' },
      { name: 'max_altitude_display', label: 'Max Altitude (displayed)' },
      { name: 'recovery_rate', label: 'Recovery Rate (displayed)' },
    ],
  },
  {
    key: 'team', label: 'Team', kind: 'object',
    fields: [
      { name: 'member_count', label: 'Member Count', type: 'number' },
      { name: 'member_count_display', label: 'Member Count (displayed)' },
    ],
  },
  {
    key: 'programs', label: 'Programs', kind: 'list', itemLabel: (item) => item.name,
    fields: [
      { name: 'name', label: 'Program Name' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'facts', label: 'Quick Facts (one per line)', type: 'lines' },
    ],
  },
  {
    key: 'careers', label: 'Open Roles', kind: 'list', itemLabel: (item) => item.title,
    fields: [
      { name: 'title', label: 'Role Title' },
      { name: 'team', label: 'Team' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  {
    key: 'contributors', label: 'Contributors & Sponsors', kind: 'list', itemLabel: (item) => item.name,
    fields: [
      { name: 'name', label: 'Name' },
      { name: 'logo', label: 'Logo', type: 'image' },
    ],
  },
  {
    key: 'faqs', label: 'FAQ', kind: 'list', itemLabel: (item) => item.question,
    fields: [
      { name: 'question', label: 'Question' },
      { name: 'answer', label: 'Answer', type: 'textarea' },
    ],
  },
  {
    key: 'social', label: 'Social Links', kind: 'object',
    fields: [
      { name: 'instagram_url', label: 'Instagram URL' },
      { name: 'linkedin_url', label: 'LinkedIn URL' },
      { name: 'youtube_url', label: 'YouTube URL' },
      { name: 'instagram', label: 'Instagram Handle' },
      { name: 'linkedin', label: 'LinkedIn Name' },
      { name: 'youtube', label: 'YouTube Name' },
    ],
  },
  {
    key: 'contact', label: 'Contact', kind: 'object',
    fields: [
      { name: 'general_email', label: 'General Email' },
      { name: 'media_email', label: 'Media Email' },
      { name: 'info_email', label: 'Partnerships Email' },
      {
        name: 'cards', label: 'Contact Cards', type: 'list',
        fields: [
          { name: 'title', label: 'Title' },
          { name: 'value', label: 'Email' },
          { name: 'description', label: 'Description' },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Applying changes to the live tables (used by admin direct-saves and the
// approval queue). Editors never call this; RLS would reject them anyway.
// ---------------------------------------------------------------------------
async function applyChange({ target_type, target_key, action, payload }) {
  if (target_type === 'post') {
    if (action === 'create') return check(await supabase.from('posts').insert(payload));
    if (action === 'update') return check(await supabase.from('posts').update(payload).eq('id', target_key));
    if (action === 'delete') return check(await supabase.from('posts').delete().eq('id', target_key));
  }
  if (target_type === 'mission') {
    if (action === 'create') return check(await supabase.from('missions').insert(payload));
    if (action === 'update') return check(await supabase.from('missions').update(payload).eq('slug', target_key));
    if (action === 'delete') return check(await supabase.from('missions').delete().eq('slug', target_key));
  }
  if (target_type === 'site_content') {
    return check(await supabase.from('site_content').upsert({ key: target_key, data: payload, updated_at: new Date().toISOString() }));
  }
  if (target_type === 'gallery') {
    if (action === 'create') return check(await supabase.from('gallery').insert(payload));
    if (action === 'update') return check(await supabase.from('gallery').update(payload).eq('id', target_key));
    if (action === 'delete') return check(await supabase.from('gallery').delete().eq('id', target_key));
  }
  throw new Error(`Unknown change type: ${target_type}/${action}`);
}

function check({ error }) {
  if (error) throw error;
}

async function queueChange(change, userId) {
  check(await supabase.from('pending_changes').insert({
    target_type: change.target_type,
    target_key: change.target_key ?? null,
    action: change.action,
    payload: change.payload,
    summary: change.summary,
    submitted_by: userId,
  }));
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------
export default function AdminApp() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => setProfile(data));
  }, [session]);

  if (loading) return <div className="admin-shell"><p className="admin-muted">Loading…</p></div>;
  if (!session) return <AuthScreen />;
  if (!profile) return <div className="admin-shell"><p className="admin-muted">Loading profile…</p></div>;
  if (profile.role === 'pending') return <PendingScreen profile={profile} />;

  return <Panel profile={profile} />;
}

function AuthScreen() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name } },
        });
        if (error) throw error;
        setMessage({ ok: true, text: 'Account created. If email confirmation is required, check your inbox, then log in. An admin must approve your access before you can edit.' });
        setMode('login');
      }
    } catch (error) {
      setMessage({ ok: false, text: error.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-shell admin-center">
      <form className="admin-card admin-auth" onSubmit={handleSubmit}>
        <img src="/images/logo/lifts-logo-white.svg" alt="LIFTS" className="admin-auth-logo" />
        <h1>{mode === 'login' ? 'Member Login' : 'Request Access'}</h1>
        {mode === 'signup' && (
          <label className="admin-field">
            <span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
        )}
        <label className="admin-field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="admin-field">
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </label>
        {message && <p className={message.ok ? 'admin-success' : 'admin-error'}>{message.text}</p>}
        <button className="admin-btn admin-btn-primary" disabled={busy} type="submit">
          {busy ? 'Working…' : mode === 'login' ? 'Log In' : 'Create Account'}
        </button>
        <button
          type="button"
          className="admin-btn-link"
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(null); }}
        >
          {mode === 'login' ? 'New member? Request access' : 'Already have an account? Log in'}
        </button>
        <a className="admin-btn-link" href="/">← Back to site</a>
      </form>
    </div>
  );
}

function PendingScreen({ profile }) {
  return (
    <div className="admin-shell admin-center">
      <div className="admin-card admin-auth">
        <h1>Awaiting Approval</h1>
        <p className="admin-muted">
          Hi {profile.display_name || profile.email}. Your account exists but an admin has not granted you
          editor access yet. Ask a team admin to approve you from the Members tab.
        </p>
        <button className="admin-btn" onClick={() => supabase.auth.signOut()}>Sign Out</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------
const ICONS = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  posts: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h5" /></>,
  missions: <><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4z" /></>,
  site: <><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" /><path d="M1 14h6M9 8h6M17 16h6" /></>,
  gallery: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
  approvals: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4 12 14.01l-3-3" /></>,
  members: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
};

function Icon({ name }) {
  return (
    <svg className="admin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

function Panel({ profile }) {
  const isAdmin = profile.role === 'admin';
  const [tab, setTab] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [counts, setCounts] = useState({});

  const notify = useCallback((text, ok = true) => {
    setToast({ text, ok });
    window.setTimeout(() => setToast(null), 5000);
  }, []);

  const loadCounts = useCallback(async () => {
    const head = { count: 'exact', head: true };
    const [posts, missions, gallery, pending, members] = await Promise.all([
      supabase.from('posts').select('id', head),
      supabase.from('missions').select('id', head),
      supabase.from('gallery').select('id', head),
      supabase.from('pending_changes').select('id', head).eq('status', 'pending'),
      isAdmin ? supabase.from('profiles').select('id', head) : Promise.resolve({ count: null }),
    ]);
    setCounts({
      posts: posts.count, missions: missions.count, gallery: gallery.count,
      pending: pending.count, members: members.count,
    });
  }, [isAdmin]);

  useEffect(() => { loadCounts(); }, [loadCounts, tab]);

  // Admins write live content immediately; editors queue a change for review.
  const save = useCallback(async (change) => {
    if (isAdmin) {
      await applyChange(change);
      notify('Published. The live site updates immediately.');
    } else {
      await queueChange(change, profile.id);
      notify('Submitted for approval. An admin will review it.');
    }
  }, [isAdmin, profile.id, notify]);

  const nav = [
    ['dashboard', 'Dashboard', 'dashboard'],
    ['posts', 'Posts', 'posts'],
    ['missions', 'Missions', 'missions'],
    ['site', 'Site Info', 'site'],
    ['gallery', 'Gallery', 'gallery'],
    ['approvals', isAdmin ? 'Approvals' : 'My Submissions', 'approvals'],
    ...(isAdmin ? [['members', 'Members', 'members']] : []),
  ];

  const initials = (profile.display_name || profile.email || '?')
    .split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('');

  return (
    <div className="admin-shell admin-layout">
      <aside className="admin-sidebar">
        <a href="/" className="admin-logo" title="View live site">
          <img src="/images/logo/lifts-icon.svg" alt="LIFTS" />
          <span>Content Panel</span>
        </a>
        <nav className="admin-nav">
          {nav.map(([key, label, icon]) => (
            <button key={key} className={`admin-nav-item ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
              <Icon name={icon} />
              <span>{label}</span>
              {key === 'approvals' && counts.pending > 0 && (
                <span className="admin-badge">{counts.pending}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-avatar">{initials}</div>
          <div className="admin-user-meta">
            <strong>{profile.display_name || profile.email}</strong>
            <span className={`admin-role admin-role-${profile.role}`}>{profile.role}</span>
          </div>
          <button className="admin-btn admin-btn-sm" onClick={() => supabase.auth.signOut()} title="Sign out">↩</button>
        </div>
      </aside>
      <div className="admin-content">
        <main className="admin-main">
          {tab === 'dashboard' && <DashboardTab profile={profile} isAdmin={isAdmin} counts={counts} setTab={setTab} />}
          {tab === 'posts' && <PostsTab save={save} isAdmin={isAdmin} notify={notify} />}
          {tab === 'missions' && <MissionsTab save={save} isAdmin={isAdmin} notify={notify} />}
          {tab === 'site' && <SiteInfoTab save={save} notify={notify} />}
          {tab === 'gallery' && <GalleryTab save={save} isAdmin={isAdmin} notify={notify} />}
          {tab === 'approvals' && <ApprovalsTab isAdmin={isAdmin} profile={profile} notify={notify} />}
          {tab === 'members' && isAdmin && <MembersTab profile={profile} notify={notify} />}
        </main>
      </div>
      {toast && <div className={`admin-toast ${toast.ok ? '' : 'admin-toast-error'}`}>{toast.text}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard overview
// ---------------------------------------------------------------------------
function DashboardTab({ profile, isAdmin, counts, setTab }) {
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    supabase.from('pending_changes').select('*').eq('status', 'pending')
      .order('submitted_at', { ascending: false }).limit(5)
      .then(({ data }) => setRecent(data || []));
  }, []);

  const firstName = (profile.display_name || profile.email || '').split(/[\s@]+/)[0];
  const stats = [
    ['posts', 'Posts', counts.posts, 'posts'],
    ['missions', 'Missions', counts.missions, 'missions'],
    ['gallery', 'Photos', counts.gallery, 'gallery'],
    ['approvals', isAdmin ? 'Pending Review' : 'My Pending', counts.pending, 'approvals'],
    ...(isAdmin ? [['members', 'Members', counts.members, 'members']] : []),
  ];

  return (
    <section>
      <div className="admin-dash-head">
        <div>
          <h2>Welcome back, {firstName}</h2>
          <p className="admin-muted">
            {isAdmin
              ? 'Everything you publish here goes live on the site immediately.'
              : 'Your edits are sent to an admin for review before going live.'}
          </p>
        </div>
        <a className="admin-btn" href="/" target="_blank" rel="noreferrer">View Live Site ↗</a>
      </div>

      <div className="admin-stat-grid">
        {stats.map(([icon, label, value, target]) => (
          <button key={label} className="admin-stat-card" onClick={() => setTab(target)}>
            <Icon name={icon} />
            <span className="admin-stat-value">{value ?? '—'}</span>
            <span className="admin-stat-label">{label}</span>
          </button>
        ))}
      </div>

      <h3 className="admin-subhead">Quick actions</h3>
      <div className="admin-quick-grid">
        <button className="admin-quick" onClick={() => setTab('posts')}>
          <Icon name="posts" /><span>Write a post</span>
          <small>Share news or a mission update</small>
        </button>
        <button className="admin-quick" onClick={() => setTab('gallery')}>
          <Icon name="gallery" /><span>Add photos</span>
          <small>Upload shots from the field</small>
        </button>
        <button className="admin-quick" onClick={() => setTab('missions')}>
          <Icon name="missions" /><span>Update a mission</span>
          <small>Status, dates, specs, results</small>
        </button>
        <button className="admin-quick" onClick={() => setTab('site')}>
          <Icon name="site" /><span>Edit site info</span>
          <small>Stats, sponsors, FAQ, contact</small>
        </button>
      </div>

      {recent.length > 0 && (
        <>
          <h3 className="admin-subhead">{isAdmin ? 'Waiting for your review' : 'Your pending submissions'}</h3>
          <div className="admin-list">
            {recent.map((change) => (
              <div className="admin-row" key={change.id}>
                <div>
                  <strong>{change.summary || `${change.action} ${change.target_type}`}</strong>
                  <p className="admin-muted">{new Date(change.submitted_at).toLocaleString()}</p>
                </div>
                <button className="admin-btn admin-btn-sm" onClick={() => setTab('approvals')}>
                  {isAdmin ? 'Review' : 'View'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function useTable(table, order) {
  const [rows, setRows] = useState([]);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let query = supabase.from(table).select('*');
    if (order) query = query.order(order.column, { ascending: order.ascending ?? true });
    query.then(({ data }) => setRows(data || []));
  }, [table, version]); // eslint-disable-line react-hooks/exhaustive-deps

  return [rows, refresh];
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------
function PostsTab({ save, isAdmin, notify }) {
  const [posts, refresh] = useTable('posts', { column: 'published_at', ascending: false });
  const [editing, setEditing] = useState(null); // null | 'new' | post row

  async function handleSubmit(values) {
    const payload = {
      title: values.title,
      category: values.category,
      date_display: values.date_display,
      summary: values.summary,
      body: values.body || null,
      image_url: values.image_url || null,
    };
    const isNew = editing === 'new';
    await save({
      target_type: 'post',
      target_key: isNew ? null : editing.id,
      action: isNew ? 'create' : 'update',
      payload,
      summary: `${isNew ? 'New post' : 'Edit post'}: ${values.title}`,
    });
    setEditing(null);
    refresh();
  }

  async function handleDelete(post) {
    if (!window.confirm(`Delete post "${post.title}"?`)) return;
    await save({
      target_type: 'post', target_key: post.id, action: 'delete',
      payload: null, summary: `Delete post: ${post.title}`,
    });
    refresh();
  }

  if (editing) {
    const post = editing === 'new' ? {} : editing;
    return (
      <EditorForm
        title={editing === 'new' ? 'New Post' : 'Edit Post'}
        initial={post}
        onCancel={() => setEditing(null)}
        onSubmit={handleSubmit}
        isAdmin={isAdmin}
        notify={notify}
        fields={[
          { name: 'title', label: 'Title', required: true },
          { name: 'category', label: 'Category', type: 'select', options: POST_CATEGORIES },
          { name: 'date_display', label: 'Date shown on the site (e.g. "June 2026")' },
          { name: 'summary', label: 'Summary', type: 'textarea', required: true },
          { name: 'body', label: 'Full text (optional)', type: 'textarea', rows: 8 },
          { name: 'image_url', label: 'Image', type: 'image' },
        ]}
      />
    );
  }

  return (
    <section>
      <div className="admin-section-head">
        <h2>News & Updates</h2>
        <button className="admin-btn admin-btn-primary" onClick={() => setEditing('new')}>+ New Post</button>
      </div>
      <div className="admin-list">
        {posts.map((post) => (
          <div className="admin-row" key={post.id}>
            <div>
              <strong>{post.title}</strong>
              <p className="admin-muted">{post.category} · {post.date_display}</p>
            </div>
            <div className="admin-row-actions">
              <button className="admin-btn admin-btn-sm" onClick={() => setEditing(post)}>Edit</button>
              <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => handleDelete(post)}>Delete</button>
            </div>
          </div>
        ))}
        {!posts.length && <p className="admin-muted">No posts yet.</p>}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Missions
// ---------------------------------------------------------------------------
const MISSION_KNOWN_KEYS = [
  'slug', 'name', 'full_name', 'status', 'status_display', 'date', 'date_display', 'date_iso',
  'date_month', 'date_day', 'date_year', 'location', 'location_full', 'summary', 'image',
  'highlights', 'objectives',
];

function MissionsTab({ save, isAdmin, notify }) {
  const [missions, refresh] = useTable('missions', { column: 'sort_order' });
  const [editing, setEditing] = useState(null);

  async function handleSubmit(values) {
    const isNew = editing === 'new';
    const slug = (values.slug || values.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    let extras = {};
    if (values.extras_json?.trim()) {
      try {
        extras = JSON.parse(values.extras_json);
      } catch {
        notify('The "Additional specs" box is not valid JSON.', false);
        return;
      }
    }
    const data = {
      ...extras,
      slug,
      name: values.name,
      full_name: values.full_name,
      status: values.status,
      status_display: STATUS_DISPLAY[values.status] || values.status,
      ...deriveDateFields(values.date),
      location: values.location,
      location_full: values.location_full || values.location,
      summary: values.summary,
      image: values.image,
      highlights: values.highlights || [],
      objectives: values.objectives || [],
    };
    await save({
      target_type: 'mission',
      target_key: isNew ? null : editing.slug,
      action: isNew ? 'create' : 'update',
      payload: { slug, name: values.name, status: values.status, sort_order: Number(values.sort_order) || 0, data },
      summary: `${isNew ? 'New mission' : 'Edit mission'}: ${values.name}`,
    });
    setEditing(null);
    refresh();
  }

  async function handleDelete(mission) {
    if (!window.confirm(`Delete mission "${mission.name}"?`)) return;
    await save({
      target_type: 'mission', target_key: mission.slug, action: 'delete',
      payload: null, summary: `Delete mission: ${mission.name}`,
    });
    refresh();
  }

  if (editing) {
    const mission = editing === 'new' ? { data: {} } : editing;
    const extras = Object.fromEntries(
      Object.entries(mission.data || {}).filter(([key]) => !MISSION_KNOWN_KEYS.includes(key))
    );
    const initial = {
      slug: mission.slug,
      name: mission.name,
      full_name: mission.data?.full_name,
      status: mission.status || 'upcoming',
      date: mission.data?.date,
      location: mission.data?.location,
      location_full: mission.data?.location_full,
      summary: mission.data?.summary,
      image: mission.data?.image,
      highlights: mission.data?.highlights,
      objectives: mission.data?.objectives,
      sort_order: mission.sort_order ?? 0,
      extras_json: Object.keys(extras).length ? JSON.stringify(extras, null, 2) : '',
    };
    return (
      <EditorForm
        title={editing === 'new' ? 'New Mission' : `Edit Mission: ${mission.name}`}
        initial={initial}
        onCancel={() => setEditing(null)}
        onSubmit={handleSubmit}
        isAdmin={isAdmin}
        notify={notify}
        fields={[
          { name: 'name', label: 'Mission Name', required: true },
          { name: 'full_name', label: 'Full Name (acronym expansion)' },
          { name: 'slug', label: 'URL slug (e.g. "ascent" → site.com/ascent)' },
          { name: 'status', label: 'Status', type: 'select', options: Object.keys(STATUS_DISPLAY) },
          { name: 'date', label: 'Date', type: 'date' },
          { name: 'location', label: 'Location (short)' },
          { name: 'location_full', label: 'Location (full)' },
          { name: 'summary', label: 'Summary', type: 'textarea', required: true },
          { name: 'image', label: 'Mission Image', type: 'image' },
          { name: 'highlights', label: 'Highlights (one per line)', type: 'lines' },
          { name: 'objectives', label: 'Objectives (one per line)', type: 'lines' },
          { name: 'sort_order', label: 'Display order (lower = first)', type: 'number' },
          { name: 'extras_json', label: 'Additional specs (advanced, JSON)', type: 'textarea', rows: 8, mono: true },
        ]}
      />
    );
  }

  return (
    <section>
      <div className="admin-section-head">
        <h2>Missions</h2>
        <button className="admin-btn admin-btn-primary" onClick={() => setEditing('new')}>+ New Mission</button>
      </div>
      <div className="admin-list">
        {missions.map((mission) => (
          <div className="admin-row" key={mission.id}>
            <div>
              <strong>{mission.name}</strong>
              <p className="admin-muted">{STATUS_DISPLAY[mission.status] || mission.status} · /{mission.slug}</p>
            </div>
            <div className="admin-row-actions">
              <button className="admin-btn admin-btn-sm" onClick={() => setEditing(mission)}>Edit</button>
              <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => handleDelete(mission)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Site Info (driven by SECTIONS config)
// ---------------------------------------------------------------------------
function SiteInfoTab({ save, notify }) {
  const [sections, refresh] = useTable('site_content');
  const [editingKey, setEditingKey] = useState(null);
  const byKey = useMemo(() => Object.fromEntries(sections.map((row) => [row.key, row.data])), [sections]);

  const def = SECTIONS.find((section) => section.key === editingKey);

  async function handleSave(data) {
    await save({
      target_type: 'site_content', target_key: editingKey, action: 'update',
      payload: data, summary: `Edit site info: ${def.label}`,
    });
    setEditingKey(null);
    refresh();
  }

  if (def) {
    return (
      <SectionEditor
        def={def}
        value={byKey[def.key] ?? (def.kind === 'list' ? [] : {})}
        onCancel={() => setEditingKey(null)}
        onSave={handleSave}
        notify={notify}
      />
    );
  }

  return (
    <section>
      <div className="admin-section-head"><h2>Site Information</h2></div>
      <div className="admin-list">
        {SECTIONS.map((section) => (
          <div className="admin-row" key={section.key}>
            <div>
              <strong>{section.label}</strong>
              <p className="admin-muted">
                {section.kind === 'list'
                  ? `${(byKey[section.key] || []).length} items`
                  : 'Settings'}
              </p>
            </div>
            <button className="admin-btn admin-btn-sm" onClick={() => setEditingKey(section.key)}>Edit</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionEditor({ def, value, onCancel, onSave, notify }) {
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(value)));
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await onSave(draft);
    } catch (error) {
      notify(error.message, false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-card" onSubmit={handleSubmit}>
      <div className="admin-section-head">
        <h2>{def.label}</h2>
        <div className="admin-row-actions">
          <button type="button" className="admin-btn" onClick={onCancel}>Cancel</button>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      {def.kind === 'list' ? (
        <ListEditor fields={def.fields} itemLabel={def.itemLabel} value={draft} onChange={setDraft} notify={notify} />
      ) : (
        <div className="admin-form-grid">
          {def.fields.map((field) => (
            <FieldInput
              key={field.name}
              field={field}
              value={draft?.[field.name]}
              onChange={(next) => setDraft({ ...draft, [field.name]: next })}
              notify={notify}
            />
          ))}
        </div>
      )}
    </form>
  );
}

function ListEditor({ fields, itemLabel, value = [], onChange, notify }) {
  function update(index, next) {
    const copy = [...value];
    copy[index] = next;
    onChange(copy);
  }
  function move(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const copy = [...value];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    onChange(copy);
  }

  return (
    <div className="admin-list-editor">
      {value.map((item, index) => (
        <details className="admin-list-item" key={index} open={!itemLabel?.(item)}>
          <summary>
            <span>{itemLabel?.(item) || `Item ${index + 1}`}</span>
            <span className="admin-row-actions" onClick={(e) => e.preventDefault()}>
              <button type="button" className="admin-btn admin-btn-sm" onClick={() => move(index, -1)}>↑</button>
              <button type="button" className="admin-btn admin-btn-sm" onClick={() => move(index, 1)}>↓</button>
              <button type="button" className="admin-btn admin-btn-sm admin-btn-danger"
                onClick={() => onChange(value.filter((_, i) => i !== index))}>Remove</button>
            </span>
          </summary>
          <div className="admin-form-grid">
            {fields.map((field) => (
              <FieldInput
                key={field.name}
                field={field}
                value={item?.[field.name]}
                onChange={(next) => update(index, { ...item, [field.name]: next })}
                notify={notify}
              />
            ))}
          </div>
        </details>
      ))}
      <button type="button" className="admin-btn" onClick={() => onChange([...value, {}])}>+ Add Item</button>
    </div>
  );
}

function FieldInput({ field, value, onChange, notify }) {
  const type = field.type || 'text';

  if (type === 'list') {
    return (
      <div className="admin-field admin-field-wide">
        <span>{field.label}</span>
        <ListEditor fields={field.fields} itemLabel={(item) => item.title} value={value || []} onChange={onChange} notify={notify} />
      </div>
    );
  }

  if (type === 'image') {
    return <ImageField label={field.label} value={value} onChange={onChange} notify={notify} />;
  }

  if (type === 'lines') {
    return (
      <label className="admin-field admin-field-wide">
        <span>{field.label}</span>
        <textarea
          rows={4}
          value={Array.isArray(value) ? value.join('\n') : value || ''}
          onChange={(e) => onChange(e.target.value.split('\n').filter((line) => line.trim() !== ''))}
        />
      </label>
    );
  }

  if (type === 'textarea') {
    return (
      <label className="admin-field admin-field-wide">
        <span>{field.label}</span>
        <textarea
          rows={field.rows || 3}
          required={field.required}
          className={field.mono ? 'admin-mono' : ''}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    );
  }

  if (type === 'select') {
    return (
      <label className="admin-field">
        <span>{field.label}</span>
        <select value={value ?? field.options[0]} onChange={(e) => onChange(e.target.value)}>
          {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
    );
  }

  return (
    <label className="admin-field">
      <span>{field.label}</span>
      <input
        type={type}
        required={field.required}
        value={value ?? ''}
        onChange={(e) => onChange(type === 'number' ? e.target.valueAsNumber || e.target.value : e.target.value)}
      />
    </label>
  );
}

function ImageField({ label, value, onChange, notify }) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (error) {
      notify(`Upload failed: ${error.message}`, false);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="admin-field admin-field-wide">
      <span>{label}</span>
      <div className="admin-image-field">
        {value && <img src={value} alt="" className="admin-image-preview" />}
        <div className="admin-image-controls">
          <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} />
          {uploading && <span className="admin-muted">Uploading…</span>}
          <input
            type="text"
            placeholder="…or paste an image URL"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

// Generic create/edit form used by Posts and Missions.
function EditorForm({ title, fields, initial, onSubmit, onCancel, isAdmin, notify }) {
  const [values, setValues] = useState(() => ({ ...initial }));
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await onSubmit(values);
    } catch (error) {
      notify(error.message, false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-card" onSubmit={handleSubmit}>
      <div className="admin-section-head">
        <h2>{title}</h2>
        <div className="admin-row-actions">
          <button type="button" className="admin-btn" onClick={onCancel}>Cancel</button>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={busy}>
            {busy ? 'Saving…' : isAdmin ? 'Save & Publish' : 'Submit for Approval'}
          </button>
        </div>
      </div>
      <div className="admin-form-grid">
        {fields.map((field) => (
          <FieldInput
            key={field.name}
            field={field}
            value={values[field.name]}
            onChange={(next) => setValues((prev) => ({ ...prev, [field.name]: next }))}
            notify={notify}
          />
        ))}
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------
function GalleryTab({ save, isAdmin, notify }) {
  const [items, refresh] = useTable('gallery', { column: 'sort_order' });
  const [editing, setEditing] = useState(null);

  async function handleSubmit(values) {
    const isNew = editing === 'new';
    if (!values.image_url) {
      notify('Please upload an image first.', false);
      return;
    }
    await save({
      target_type: 'gallery',
      target_key: isNew ? null : editing.id,
      action: isNew ? 'create' : 'update',
      payload: {
        title: values.title,
        caption: values.caption,
        image_url: values.image_url,
        sort_order: Number(values.sort_order) || 0,
      },
      summary: `${isNew ? 'New gallery image' : 'Edit gallery image'}: ${values.title || 'untitled'}`,
    });
    setEditing(null);
    refresh();
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.title || 'this image'}" from the gallery?`)) return;
    await save({
      target_type: 'gallery', target_key: item.id, action: 'delete',
      payload: null, summary: `Delete gallery image: ${item.title || item.id}`,
    });
    refresh();
  }

  if (editing) {
    const item = editing === 'new' ? {} : editing;
    return (
      <EditorForm
        title={editing === 'new' ? 'Add Photo' : 'Edit Photo'}
        initial={item}
        onCancel={() => setEditing(null)}
        onSubmit={handleSubmit}
        isAdmin={isAdmin}
        notify={notify}
        fields={[
          { name: 'image_url', label: 'Photo', type: 'image' },
          { name: 'title', label: 'Title' },
          { name: 'caption', label: 'Caption', type: 'textarea' },
          { name: 'sort_order', label: 'Display order (lower = first)', type: 'number' },
        ]}
      />
    );
  }

  return (
    <section>
      <div className="admin-section-head">
        <h2>Photo Gallery</h2>
        <button className="admin-btn admin-btn-primary" onClick={() => setEditing('new')}>+ Add Photo</button>
      </div>
      <div className="admin-gallery-grid">
        {items.map((item) => (
          <figure className="admin-gallery-item" key={item.id}>
            <img src={item.image_url} alt={item.title || ''} />
            <figcaption>
              <strong>{item.title || 'Untitled'}</strong>
              <div className="admin-row-actions">
                <button className="admin-btn admin-btn-sm" onClick={() => setEditing(item)}>Edit</button>
                <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => handleDelete(item)}>Delete</button>
              </div>
            </figcaption>
          </figure>
        ))}
        {!items.length && <p className="admin-muted">No photos yet.</p>}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Approvals / My Submissions
// ---------------------------------------------------------------------------
function ApprovalsTab({ isAdmin, profile, notify }) {
  const [changes, refresh] = useTable('pending_changes', { column: 'submitted_at', ascending: false });
  const [profiles, setProfiles] = useState({});

  useEffect(() => {
    if (!isAdmin) return;
    supabase.from('profiles').select('id, display_name, email').then(({ data }) => {
      setProfiles(Object.fromEntries((data || []).map((p) => [p.id, p.display_name || p.email])));
    });
  }, [isAdmin]);

  async function review(change, approved) {
    try {
      if (approved) await applyChange(change);
      check(await supabase.from('pending_changes').update({
        status: approved ? 'approved' : 'rejected',
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
      }).eq('id', change.id));
      notify(approved ? 'Change approved and published.' : 'Change rejected.');
      refresh();
    } catch (error) {
      notify(error.message, false);
    }
  }

  const pending = changes.filter((change) => change.status === 'pending');
  const reviewed = changes.filter((change) => change.status !== 'pending').slice(0, 20);

  return (
    <section>
      <div className="admin-section-head">
        <h2>{isAdmin ? 'Pending Approvals' : 'My Submissions'}</h2>
      </div>
      <div className="admin-list">
        {pending.map((change) => (
          <details className="admin-list-item" key={change.id}>
            <summary>
              <span>
                <strong>{change.summary || `${change.action} ${change.target_type}`}</strong>
                <span className="admin-muted">
                  {' '}— {isAdmin ? `by ${profiles[change.submitted_by] || 'member'} · ` : ''}
                  {new Date(change.submitted_at).toLocaleString()}
                </span>
              </span>
              {isAdmin && (
                <span className="admin-row-actions" onClick={(e) => e.preventDefault()}>
                  <button className="admin-btn admin-btn-sm admin-btn-primary" onClick={() => review(change, true)}>Approve</button>
                  <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => review(change, false)}>Reject</button>
                </span>
              )}
            </summary>
            <pre className="admin-payload">{JSON.stringify(change.payload, null, 2)}</pre>
          </details>
        ))}
        {!pending.length && <p className="admin-muted">Nothing waiting for review.</p>}
      </div>
      {reviewed.length > 0 && (
        <>
          <h3 className="admin-subhead">Recent decisions</h3>
          <div className="admin-list">
            {reviewed.map((change) => (
              <div className="admin-row" key={change.id}>
                <div>
                  <strong>{change.summary}</strong>
                  <p className="admin-muted">
                    {change.status} · {change.reviewed_at ? new Date(change.reviewed_at).toLocaleString() : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Members (admin only)
// ---------------------------------------------------------------------------
function MembersTab({ profile, notify }) {
  const [members, refresh] = useTable('profiles', { column: 'created_at' });

  async function setRole(member, role) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', member.id);
    if (error) {
      notify(error.message, false);
    } else {
      notify(`${member.display_name || member.email} is now ${role}.`);
      refresh();
    }
  }

  async function deleteMember(member) {
    const name = member.display_name || member.email;
    if (!window.confirm(`Delete ${name}? Their account is removed permanently and they will no longer be able to log in.`)) return;
    try {
      const { data, error } = await supabase.functions.invoke('delete-member', {
        body: { user_id: member.id },
      });
      if (error || data?.error) throw new Error(data?.error || error.message);
      notify(`${name} has been deleted.`);
      refresh();
    } catch (err) {
      notify(err.message, false);
    }
  }

  return (
    <section>
      <div className="admin-section-head"><h2>Members</h2></div>
      <p className="admin-muted">
        New members sign up from the login screen, then appear here as “pending” until you grant them a role.
        Editors submit changes for approval; admins publish directly and review submissions.
      </p>
      <div className="admin-list">
        {members.map((member) => (
          <div className="admin-row" key={member.id}>
            <div>
              <strong>{member.display_name || member.email}</strong>
              <p className="admin-muted">{member.email}</p>
            </div>
            <div className="admin-row-actions">
              <select value={member.role} onChange={(e) => setRole(member, e.target.value)}>
                <option value="pending">pending</option>
                <option value="editor">editor</option>
                <option value="admin">admin</option>
              </select>
              {member.id !== profile.id && (
                <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => deleteMember(member)}>
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
