# LIFTS Content Panel

The website has a built-in admin panel at **`/admin`** (also linked as "Member Login"
in the site footer). Team members use it to publish news posts, edit missions,
update site info, and manage photos — no coding or redeploying required.
Content is stored in Supabase (project `lifts-website`, ref `twvcomijovmhlikgvefk`)
and changes appear on the live site immediately.

## First-time setup (do this once)

1. Go to `https://lifts-uprm.github.io/admin`, click **"New member? Request access"**,
   and create your account. **The very first account to sign up automatically becomes
   the admin.** Sign up before sharing the link with the team.
2. Confirm your email if prompted (check spam). Then log in.

The LIFTS-branded Supabase confirmation email template is stored at
`public/assets/email/confirm-signup.html`. Paste that HTML into the Supabase
confirm-signup email template when configuring the auth emails for this website.

## How roles work

| Role | Can do |
|---|---|
| `pending` | Nothing yet — every new signup starts here |
| `editor` | Create and edit content, but changes wait in an approval queue |
| `admin` | Publish directly, approve/reject editor submissions, manage member roles |

New members sign up themselves at `/admin`, then an admin grants them a role
from the **Members** tab.

## What's editable

- **Posts** — news/updates shown on the Updates page (title, category, date, summary, body, image)
- **Missions** — add new missions or edit existing ones; new missions automatically get
  their own page at `/<slug>` and show up on the Missions, Launches, and home pages
- **Site Info** — organization text, stats, team count, programs, open roles,
  contributors/sponsor logos, FAQ, social links, contact emails
- **Gallery** — photos shown on the Updates page (uploads go to Supabase Storage)

## Approval flow

Editors hit **"Submit for Approval"**; the change sits in the **Approvals** tab until
an admin approves (publishes it) or rejects it. Admins see **"Save & Publish"** and go live
immediately.

## Notes & limits

- The site always falls back to the content bundled in `src/data/siteData.json`
  if the database is unreachable, so it never renders blank.
- Supabase's built-in email service only sends a few confirmation emails per hour.
  If a teammate's confirmation email doesn't arrive, wait an hour, or an admin can
  confirm them manually from the Supabase dashboard (Authentication → Users), or
  configure custom SMTP in Supabase for unlimited sends.
- Free-tier Supabase pauses projects after ~1 week with **zero** activity; normal
  site traffic counts as activity, so this is unlikely to matter.
- The publishable API key in `src/lib/supabaseClient.js` is meant to be public —
  all real security is enforced by Row Level Security policies in the database.
