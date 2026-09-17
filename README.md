<p align="center">
  <strong>merQato.digital</strong><br/>
  <em>Building Operational Systems from Paradise</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-2.x-3FCF8E?logo=supabase&logoColor=white" alt="Supabase" />
</p>

---

A full-featured, CMS-powered landing page for **merQato.digital** — a Palawan-based digital agency specializing in web systems, autonomous AI agents, and social media automation for island enterprises and global brands.

The site ships as a **single self-contained HTML file** with a built-in backoffice panel for real-time content, media, design, and package editing. It works entirely in the browser with localStorage, or connects to **Supabase** for authenticated cloud publishing and asset storage.

---

## Features

### Public-Facing Site
- **Hero section** with configurable badge, headline, CTAs, and optional background image/video
- **About section** with mission and company profile cards
- **Core Pillars** — Web Systems, Autonomous AI Agents, Social Media Systems
- **Service Packages** — Starter, Operational Suite, Enterprise tiers with feature lists and pricing
- **Process timeline** — Discovery, Architecture, Deployment, Managed Operations
- **FAQ accordion** with add/remove support
- **Footer CTA** with contact info, trust badges, and social links
- **Legal modals** — Privacy Policy (RA 10173), Terms of Engagement, Island SLA
- **Light / Dark theme** toggle with CSS custom properties
- **Responsive design** — mobile, tablet, and desktop layouts
- **Live PHT clock** and operational status telemetry in the footer

### Built-In Backoffice CMS
- **Content editor** — brand, hero, about, pillars, process, footer CTA
- **Media manager** — upload logo, hero, about, and footer images/videos (stored in IndexedDB or Supabase Storage)
- **Design editor** — full color palette customization (accent, backgrounds, headings, body text) and font selection
- **Package editor** — add/edit service tiers, pricing, features, featured badges
- **FAQ editor** — add/remove/reorder questions
- **Footer editor** — contact details, social links, website directory, trust badges
- **Cloud sync** — authenticated Supabase publishing with session management
- **Auto-save** — all changes persist to localStorage instantly
- **Team Workstation** — shared study board for the team: subjects to learn (GitHub, Vercel, projects…)
  with notes, comments, web + Google Drive links, and device image uploads. Every post is stamped with
  author name and PHT date/time and tagged **Urgent**, **Moderate** or **Check when you have downtime**.
  See [`TEAM_WORKSTATION.md`](merqato-digital-landing-page/TEAM_WORKSTATION.md)

### Deployment
- **Singlefile build** via `vite-plugin-singlefile` — outputs one `.html` file with all assets inlined
- **Supabase-ready** — optional cloud backend for shared content and media (works without it)

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 |
| Language | TypeScript (strict mode) |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS 4 (Vite plugin) |
| Icons | Lucide React |
| Backend / CMS | Supabase (Auth, Postgres, Storage) |
| Fonts | Inter, JetBrains Mono, Questrial (Google Fonts) |
| Utilities | clsx + tailwind-merge |

---

## Project Structure

```
digital-agency/
├── index.html                      # Vite entry HTML
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript config (strict, @/* alias)
├── vite.config.ts                  # Vite + React + Tailwind + singlefile
├── .env.example                    # Environment variable template
├── SUPABASE_SETUP.md               # Cloud backend setup guide
│
├── src/
│   ├── main.tsx                    # React root mount
│   ├── App.tsx                     # Full application:
│   │                               #   ─ Type definitions & default settings
│   │                               #   ─ IndexedDB asset helpers
│   │                               #   ─ Custom hooks (theme, settings, assets)
│   │                               #   ─ Public sections (Hero → Footer)
│   │                               #   ─ Legal document modals
│   │                               #   ─ Social icon components
│   │                               #   ─ Backoffice admin panel & editors
│   │                               #   ─ Authentication & cloud sync
│   ├── index.css                   # Tailwind v4 + custom theme system
│   ├── vite-env.d.ts               # Vite type reference
│   ├── components/workstation/     # Team Workstation (subjects, notes, links, images)
│   ├── lib/
│   │   ├── supabase.ts             # Supabase client & site settings CRUD helpers
│   │   ├── workstation.ts          # Team Workstation data layer (cloud + local fallback)
│   │   └── identity.ts             # Display name + per-browser author token
│   └── utils/
│       └── cn.ts                   # clsx + tailwind-merge utility
│
└── supabase/
    ├── schema.sql                  # Database bootstrap (tables, RLS, storage)
    └── workstation.sql             # Team Workstation tables, RLS and asset bucket
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** (or pnpm / yarn)

### Install & Run

```bash
git clone https://github.com/sanvicpalawan/digital-agency.git
cd digital-agency
npm install
npm run dev
```

The site runs immediately in **local-preview mode** — all content is editable through the backoffice and saved to browser localStorage.

### Enable Cloud Publishing (Optional)

1. Create a [Supabase](https://supabase.com) project
2. Run `supabase/schema.sql` in the SQL Editor (add `supabase/workstation.sql` for the Team Workstation)
3. Create an admin user in Authentication > Users and add their UUID to `site_admins`
4. Copy `.env.example` to `.env.local` and fill in your Supabase URL, publishable key, and a private admin passkey
5. Restart the dev server

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for full instructions.

---

## Build

```bash
npm run build
```

Outputs a single self-contained `dist/index.html` file with all JS, CSS, and assets inlined — ready to deploy anywhere.

```bash
npm run preview
```

Preview the production build locally.

---

## Deployment

The singlefile output works on any static host:

- **Vercel / Netlify** — point to the `dist/` directory
- **GitHub Pages** — serve `dist/index.html`
- **Any web server** — drop the single HTML file anywhere

For cloud CMS features, ensure your `.env` variables are set in your hosting provider's environment configuration.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | No | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | No | Supabase anon/publishable key |
| `VITE_ADMIN_PASSKEY` | No | Passkey for the backoffice panel (set a strong private value) |

> The site works fully without any environment variables in local-preview mode. All `VITE_*` values are exposed to the browser — never use a `service_role` key here.

---

## Security

- **Row Level Security** on all Supabase tables — public read, admin-only write
- **Supabase Auth** for cloud publishing — email/password sign-in required
- **Admin allow-list** — `site_admins` table controls who can publish
- **No secrets in source** — all credentials are environment variables
- **Storage policies** — admin-only upload/update/delete on the assets bucket

---

## License

Proprietary — © merQato.digital. All rights reserved.

---

<p align="center">
  <sub>Headquartered in Palawan, Philippines · Serving Global Enterprise</sub><br/>
  <sub>Puerto Princesa · El Nido · Coron</sub>
</p>
