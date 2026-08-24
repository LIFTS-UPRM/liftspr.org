# LIFTS Website

React/Vite website for Launch Initiatives for Technologies in Space (LIFTS) at UPRM.

## Development

```bash
npm install
npm run dev
```

The local dev server runs on port `3000` by default.

## Content Editing

Editable site information lives in:

```text
src/data/siteData.json
```

Use that file to update mission dates, stats, contact emails, launch entries, contributor logos, Join Us roles, updates, FAQs, and document links. The old Python placeholder generator has been removed.

Static public assets live under:

```text
public/images
public/assets/documents
```

Paths beginning with `/images/...` and `/assets/documents/...` are served directly from `public/`.

## Routes

The React app uses clean routes:

| Page | Route |
| --- | --- |
| Home | `/` |
| Missions | `/missions` |
| Launches | `/launches` |
| Updates | `/updates` |
| Join Us | `/join-us` |
| About | `/about` |
| Contact | `/contact` |
| Contributors | `/contributors` |
| Privacy | `/privacy` |
| NEXO | `/nexo` |
| ASCENT | `/ascent` |
| CubeSat | `/cubesat` |

Legacy `.html` paths such as `/missions.html` and `/ascent.html` are still supported by the client route table and the GitHub Pages `404.html` fallback.

## Build

```bash
npm run build
npm run preview
```

Production output is written to `dist/`.

## Deployment

GitHub Actions builds the Vite app and deploys `dist/` to GitHub Pages on pushes to `main`. The workflow is in:

```text
.github/workflows/deploy.yml
```
