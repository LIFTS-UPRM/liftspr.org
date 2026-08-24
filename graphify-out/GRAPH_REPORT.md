# Graph Report - .  (2026-07-24)

## Corpus Check
- 44 files · ~128,074 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 240 nodes · 286 edges · 34 communities (12 shown, 22 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.74)
- Token cost: 968,427 input · 0 output

## Community Hubs (Navigation)
- Public React App
- Admin Dashboard
- Dependencies & Brand Refs
- Deploy Workflow & Docs
- Admin Backend & Signup Flow
- SEO Page Generator
- Org Info & SEO Schema
- Deploy Workflow Verifier
- Frame Guard Verifier
- Site Content Context
- LIFTS Logo SVG Variants
- Auth Hook SQL Verifier
- LIFTS Brand Concept
- Logo Usage Guidelines
- Robots.txt & Sitemap
- Photography Style Guide
- Typography Guide
- Voice & Tone Guide
- Program Achievements
- Team Structure
- Hero Launch Background
- Hero Space Background
- Collins Aerospace Logo
- Montana State Logo
- NEBP Logo
- PR Space Grant Logo
- UPRM Seal Logo
- LIFTS Logo (White Name)
- LIFTS Logo (Black Name)
- LIFTS Icon (Black)
- LIFTS Icon (White)
- LIFTS Logo (Background)
- NEXO Mission Patch

## God Nodes (most connected - your core abstractions)
1. `useSiteData()` - 19 edges
2. `/admin Content Panel` - 11 edges
3. `App()` - 8 edges
4. `useTable()` - 7 edges
5. `keywords` - 6 edges
6. `metaBlock()` - 5 edges
7. `build job` - 5 edges
8. `subscribe Supabase Edge Function` - 5 edges
9. `LIFTS Website project (README)` - 5 edges
10. `scripts` - 4 edges

## Surprising Connections (you probably didn't know these)
- `src/data/siteData.json (content fallback)` --conceptually_related_to--> `src/data/siteData.json (editable site content)`  [INFERRED]
  ADMIN.md → README.md
- `LIFTS Website project (README)` --references--> `404 redirect-to-root logic`  [EXTRACTED]
  README.md → public/404.html
- `React app routes table` --conceptually_related_to--> `ASCENT High-Altitude Balloon Program`  [INFERRED]
  README.md → public/assets/documents/fact-sheet.md
- `React app routes table` --conceptually_related_to--> `CubeSat Program`  [INFERRED]
  README.md → public/assets/documents/fact-sheet.md
- `React app routes table` --conceptually_related_to--> `NEXO High-Altitude Balloon Program`  [INFERRED]
  README.md → public/assets/documents/fact-sheet.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Admin-panel signup, eligibility hook & email confirmation flow** — admin_admin_panel, admin_hook_restrict_account_creation, admin_signup_allowed_networks, public_assets_email_confirm_signup_confirm_email [INFERRED 0.85]
- **Newsletter subscribe & broadcast pipeline** — admin_subscribe_edge_function, admin_newsletter_subscribers_table, admin_resend_audience, admin_broadcast_edge_function [EXTRACTED 1.00]
- **LIFTS mission/program portfolio (NEXO, ASCENT, CubeSat) across fact sheet and press kit** — public_assets_documents_fact_sheet_nexo, public_assets_documents_fact_sheet_ascent, public_assets_documents_fact_sheet_cubesat, public_assets_documents_press_kit_nexo, public_assets_documents_press_kit_ascent, public_assets_documents_press_kit_cubesat [INFERRED 0.85]

## Communities (34 total, 22 thin omitted)

### Community 0 - "Public React App"
Cohesion: 0.06
Nodes (39): useSiteData(), AboutPage(), AdminApp, AnswerSection(), App(), buildStructuredData(), CareersPage(), ContactPage() (+31 more)

### Community 1 - "Admin Dashboard"
Cohesion: 0.07
Nodes (26): AdminApp(), applyChange(), ApprovalsTab(), AuthScreen(), check(), GalleryTab(), getConfirmParams(), ICONS (+18 more)

### Community 2 - "Dependencies & Brand Refs"
Cohesion: 0.06
Nodes (32): author, dependencies, react, react-dom, @supabase/supabase-js, description, devDependencies, vite (+24 more)

### Community 3 - "Deploy Workflow & Docs"
Cohesion: 0.11
Nodes (19): src/data/siteData.json (content fallback), actions/checkout, actions/deploy-pages, actions/setup-node, actions/upload-pages-artifact, build job, deploy job, Deploy to GitHub Pages (workflow) (+11 more)

### Community 4 - "Admin Backend & Signup Flow"
Cohesion: 0.12
Nodes (19): /admin Content Panel, Approval flow (Submit for Approval / Approvals tab), broadcast Supabase Edge Function, public.hook_restrict_account_creation (Supabase Auth hook), newsletter_subscribers table, RESEND_API_KEY secret, Resend audience, RESEND_AUDIENCE_ID secret (+11 more)

### Community 5 - "SEO Page Generator"
Cohesion: 0.17
Nodes (16): baseHtml, baseHtmlPath, distDir, escapeHtml(), faqItems, fs, metaBlock(), organizationSchema() (+8 more)

### Community 6 - "Org Info & SEO Schema"
Cohesion: 0.33
Nodes (6): index.html entry document, LIFTS Organization (schema.org JSON-LD), University of Puerto Rico at Mayagüez (parentOrganization), LIFTS Organization Overview (fact sheet), About LIFTS (press kit), Social Media handles

### Community 7 - "Deploy Workflow Verifier"
Cohesion: 0.33
Nodes (4): build, deploy, root, workflow

### Community 8 - "Frame Guard Verifier"
Cohesion: 0.33
Nodes (3): fallback, main, root

### Community 9 - "Site Content Context"
Cohesion: 0.50
Nodes (3): ContentContext, ContentProvider(), supabase

### Community 10 - "LIFTS Logo SVG Variants"
Cohesion: 0.67
Nodes (4): LIFTS Icon Mark (lifts-icon.svg), LIFTS UPRM Logo (SVG), LIFTS Logo (Dark Variant, SVG), LIFTS Logo (White Variant, SVG)

## Knowledge Gaps
- **96 isolated node(s):** `name`, `version`, `description`, `type`, `private` (+91 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `supabase` connect `Site Content Context` to `Public React App`, `Admin Dashboard`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `/admin Content Panel` connect `Admin Backend & Signup Flow` to `Deploy Workflow & Docs`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _96 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Public React App` be split into smaller, more focused modules?**
  _Cohesion score 0.06485671191553545 - nodes in this community are weakly interconnected._
- **Should `Admin Dashboard` be split into smaller, more focused modules?**
  _Cohesion score 0.06976744186046512 - nodes in this community are weakly interconnected._
- **Should `Dependencies & Brand Refs` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `Deploy Workflow & Docs` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._