# merQato.digital — Code Tree & Tech Stack

Reference for **[github.com/sanvicpalawan/merqato.digital](https://github.com/sanvicpalawan/merqato.digital)** (21 commits, last commit `2d3d54f`, 2026-09-17).
Compared against the sibling repo **this repo** (`sanvicpalawan/digital-agency`), which holds the older
single-file build of the same site.

---

## 1. TL;DR

| | `merqato.digital` (this brief) | `digital-agency` (this checkout) |
|---|---|---|
| Framework | **TanStack Start 1.168** (SSR/full-stack) | React 19 SPA (Vite) |
| Router | **TanStack Router 1.170** (file-based, `routeTree.gen.ts`) | none (single page) |
| Build | **Vite 8.1.5** via `@lovable.dev/vite-tanstack-config` | Vite 7.3 + `vite-plugin-singlefile` |
| Styling | **Tailwind CSS 4.2** + shadcn/ui (new-york) | Tailwind CSS 4.1, hand-rolled classes |
| Backend | **Supabase** (Postgres + Storage) + server functions | Supabase client-side only |
| Package mgr | **Bun** (`bun.lock`, `bunfig.toml`) | npm (`package-lock.json`) |
| Output | Full-stack app (Nitro server) | one self-contained `index.html` |
| Entry page | `src/routes/index.tsx` → `MerqatoSite.tsx` (2,719 lines) | `src/App.tsx` (1,437 lines) |

Both render the **same product**: a merQato.digital marketing landing page with a hidden
backoffice CMS (triple-click the logo → passkey `5309`).

---

## 2. Code tree — `merqato.digital`

106 files. Sizes shown for anything notable.

```
merqato.digital/
├── .env                                   # committed: SUPABASE_URL + publishable key (project xtdnpntijvnspegxgjbr)
├── .gitignore
├── .prettierignore
├── .prettierrc
├── AGENTS.md                              # "this project is connected to Lovable" — don't rewrite pushed history
├── README.md                              # Lovable boilerplate: "Supabase Setup Hero"
├── bun.lock                               # 143 KB
├── bunfig.toml                            # 24h supply-chain guard (minimumReleaseAge = 86400)
├── components.json                        # shadcn/ui: new-york, slate, cssVariables, lucide, @/ aliases
├── eslint.config.js
├── package.json
├── tsconfig.json                          # strict, ES2022, noEmit, paths @/* -> ./src/*
├── vite.config.ts                         # thin: only overrides tanstackStart server entry -> src/server.ts
│
├── .lovable/
│   ├── project.json                       # template tanstack_start_ts_current-7da8770d11d6
│   └── plan/merqato-digital-landing-page-cloud-backend-2026-09-17.md   # the build plan / spec
│
├── public/
│   ├── favicon.ico
│   └── robots.txt
│
├── supabase/
│   ├── config.toml                        # project_id = "xtdnpntijvnspegxgjbr"
│   └── migrations/
│       ├── 20260917043249_...sql          # tables + RLS + storage policies  (3.4 KB)
│       └── 20260917043315_...sql          # rewrites admin policies to inline EXISTS, drops is_site_admin()
│
└── src/
    ├── styles.css                         # 24 KB — Tailwind 4 tokens + theme vars + fonts
    ├── routeTree.gen.ts                   # generated (do not edit)
    ├── router.tsx                         # createRouter + QueryClient context
    ├── start.ts                           # createStart: Supabase auth fn-middleware, error + CSRF request middleware
    ├── server.ts                          # Nitro/h3 SSR entry wrapper, catches swallowed 500s -> error page
    │
    ├── routes/                            # file-based routing
    │   ├── __root.tsx                     # html shell, HeadContent, 404 + error components, QueryClientProvider
    │   ├── index.tsx                      # "/" — ssr:false, meta/OG tags, renders <MerqatoSite />
    │   ├── README.md
    │   └── api/public/site-assets.$.ts    # GET proxy: streams private bucket objects, 1h cache
    │
    ├── components/
    │   ├── ui/                            # 46 shadcn/ui primitives (Radix)
    │   │   accordion alert alert-dialog aspect-ratio avatar badge breadcrumb button
    │   │   calendar card carousel chart checkbox collapsible command context-menu
    │   │   dialog drawer dropdown-menu form hover-card input input-otp label menubar
    │   │   navigation-menu pagination popover progress radio-group resizable
    │   │   scroll-area select separator sheet sidebar skeleton slider sonner switch
    │   │   table tabs textarea toggle toggle-group tooltip
    │   └── merqato/
    │       └── MerqatoSite.tsx            # 154 KB / 2,719 lines — the whole page + backoffice
    │
    ├── hooks/
    │   └── use-mobile.tsx
    │
    ├── integrations/supabase/             # generated Lovable Cloud glue
    │   ├── client.ts                      # browser client, lazy Proxy, brokered preview auth storage
    │   ├── client.server.ts               # service-role client (bypasses RLS) — server-only import
    │   ├── auth-attacher.ts               # function middleware: attaches Bearer token to serverFn RPCs
    │   ├── auth-middleware.ts             # server: verifies Supabase JWT on requests
    │   ├── cron-auth.ts                   # LOVABLE_CRON_SECRET bearer check (timing-safe)
    │   ├── previewAuthStorage.ts          # brokered session storage for the Lovable preview iframe
    │   └── types.ts                       # generated Database types (site_settings, site_admins)
    │
    └── lib/
        ├── site-cloud.ts                  # app-facing cloud API: load/persist settings, upload/remove assets
        ├── site-admin.functions.ts        # createServerFn: uploadSiteAsset / deleteSiteAsset / saveSiteSettings
        ├── error-capture.ts               # recovers real stack from h3-swallowed 500s
        ├── error-page.ts                  # renderErrorPage()
        ├── lovable-error-reporting.ts     # ships runtime errors to Lovable
        └── utils.ts                       # cn() = clsx + tailwind-merge
```

---

## 3. Tech stack

### Runtime / framework
| Layer | Choice | Notes |
|---|---|---|
| Meta-framework | **TanStack Start 1.168.32** | full-stack React, server functions, Nitro server |
| Router | **TanStack Router 1.170.18** + `router-plugin 1.168.23` | file-based routes, generated `routeTree.gen.ts` |
| React | **19.2** | root route renders html shell manually |
| Data fetching | **@tanstack/react-query 5.101** | QueryClient provided in `__root.tsx` (available, app mainly uses local state) |
| Server runtime | **Nitro 3.0.260603-beta** (via Lovable's Vite config, Cloudflare default target) | `src/server.ts` is the entry, wrapped for SSR error handling |

### Styling / UI
| Layer | Choice |
|---|---|
| CSS | **Tailwind CSS 4.2** via `@tailwindcss/vite` + `tw-animate-css` |
| Components | **shadcn/ui** (new-york, slate base, CSS variables) over **Radix UI** (~25 packages) |
| Icons | **lucide-react 0.575** |
| Primitives | `class-variance-authority`, `clsx`, `tailwind-merge 3.5` |
| Extras | `vaul` (drawer), `cmdk` (command), `embla-carousel-react`, `recharts`, `sonner` (toasts), `react-day-picker`, `input-otp`, `react-resizable-panels` |

### Forms / validation
`react-hook-form 7.71` + `@hookform/resolvers` + `zod 3.25` (shipped with the template; `MerqatoSite` itself uses
plain controlled inputs and `FormEvent`).

### Backend (Supabase / Lovable Cloud)
| Concern | Implementation |
|---|---|
| DB | Supabase Postgres — 2 tables (`site_settings`, `site_admins`) |
| Storage | private bucket `site-assets` (50 MB/file, mime-restricted) |
| Auth | Supabase Auth, wired but **not enabled for admin sign-in** — writes use a passkey server function instead |
| Access | publishable-key client (browser/SSR) + service-role client (`client.server.ts`) |
| Types | generated `Database` types in `src/integrations/supabase/types.ts` |

### Tooling
| Tool | Version |
|---|---|
| Bun | lockfile `bun.lock`, `bunfig.toml` with 24h `minimumReleaseAge` guard |
| Vite | 8.1.5 (`@vitejs/plugin-react` 5.2, `vite-tsconfig-paths`) |
| TypeScript | 5.8, strict, `noEmit`, `@/*` path alias |
| ESLint | 9 flat config + `typescript-eslint`, `react-hooks`, `react-refresh`, `prettier` plugin |
| Prettier | 3.7 (`.prettierrc`, `.prettierignore`) |
| Lovable | `@lovable.dev/vite-tanstack-config 2.20` owns the real Vite config (devtools, nitro, env injection, dedupe, sandbox port/host) |

Scripts: `dev` (`vite dev`), `build`, `build:dev`, `preview`, `lint`, `format`.

### Data model

```
public.site_settings
  id          text PRIMARY KEY DEFAULT 'main' CHECK (id = 'main')
  content     jsonb NOT NULL DEFAULT '{}'      -- the entire SiteSettings object, localized
  updated_at  timestamptz NOT NULL DEFAULT now()

public.site_admins
  user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
  created_at  timestamptz NOT NULL DEFAULT now()
```

RLS (final state after migration `...3315`):
- `site_settings` — **public SELECT** (`anon`, `authenticated`); INSERT/UPDATE/DELETE gated on
  `exists (select 1 from site_admins where user_id = auth.uid())`.
- `site_admins` — SELECT only for your own row.
- `storage.objects` — public SELECT on `bucket_id = 'site-assets'`; write/delete admin-only.
- The original `is_site_admin()` security-definer function was **dropped** in migration 2 (RLS-in-function
  recursion fix); the same check is now inlined in each policy.
- `pgcrypto` extension enabled; `site_settings` seeded with `('main', '{}')`.

`SiteSettings` shape (TS type in `MerqatoSite.tsx`):
`branding`, `header`, `hero`, `about`, `pillars`, `packages`, `process`, `faq`, `footer`,
`palette` (8 light/dark color tokens), `fonts` (heading/body/brand),
`localization` (`defaultLanguage`, `languages[]`, `translations: Record<lang, LocalizedContent>`).

---

## 4. Runtime flows

**Public read**
1. `/` route has `ssr: false` (theme/language/settings come from `localStorage`, avoids hydration mismatch).
2. `useSiteSettings()` loads `localStorage['merqato-site-settings-v1']`, then `loadCloudSettings()`
   (publishable client, `select content from site_settings where id='main'`) — cloud wins if non-empty.
3. Media: local assets resolve from **IndexedDB** (`merqato-backoffice-assets/files`), cloud assets from
   `remote:<path>` → `/api/public/site-assets/<path>` (signed service-role download on the server).

**Admin write (no email login yet)**
1. Triple-click the logo → `AuthenticationModal` → passkey (`5309`, or `SITE_ADMIN_PASSKEY` env).
2. `setAdminPasskey()` stores it in module scope; `persistCloudSettings()` /
   `uploadCloudAsset()` call `createServerFn`s in `site-admin.functions.ts` (POST).
3. Each server fn re-checks the passkey, then uses the **service-role** client to upsert settings or
   upload/remove objects in `site-assets` (base64 payload → `Uint8Array`).
4. `start.ts` wraps serverFn calls in **CSRF** middleware; `attachSupabaseAuth` attaches the Supabase
   bearer token client-side.

**Backoffice tabs:** `content`, `media`, `design`, `packages`, `faq`, `footer`, `languages`.

---

## 5. `MerqatoSite.tsx` component map (2,719 lines)

State/hooks: `useTheme`, `useSiteSettings`, `useAssetUrls`, `normalizeSettings`,
`getEffectiveSettings` / `getEditingValues` / `updateLocalizedContent` (i18n merge), `openAssetDb`.

Public sections: `Navigation` · `Hero` · `About` · `Pillars` · `Packages` · `Process` · `FAQ` ·
`FooterCTA` · `StudioFooter` · `LegalModal` (Privacy / Terms / Island SLA) · `ThemeToggle` ·
`LanguageSwitcher` · `MediaLayer`.

Backoffice: `Backoffice` (shell) · `ContentEditor` · `DesignEditor` · `PackagesEditor` · `FaqEditor` ·
`FooterEditor` · `LanguagesEditor` · `CloudSync` · `AuthenticationModal` · shared `InputField`,
`EditorGroup`, `AssetControl`, `ColorField`.

i18n: `DEFAULT_LANGUAGES`, `TAGALOG_DEFAULT_TRANSLATION`, `UI_STRINGS`, `LEGAL_DOCUMENTS(_TL)` —
Tagalog translation ships as the demo second language.

---

## 6. This checkout (`digital-agency`) for comparison

```
digital-agency/
├── README.md                              # full feature/stack doc
├── merqato-digital-landing-page.zip       # 232 KB
└── merqato-digital-landing-page/
    ├── index.html, tsconfig.json, vite.config.ts, package.json, .env.example
    ├── SUPABASE_SETUP.md
    ├── supabase/schema.sql                # original DDL that merqato.digital's migrations mirror
    └── src/
        ├── main.tsx, App.tsx (1,437 lines), index.css, vite-env.d.ts
        ├── lib/supabase.ts                # direct browser client: reads + email/password auth writes
        └── utils/cn.ts
```

Stack: React 19.2.6 · TypeScript 5.9 · Vite 7.3.2 · Tailwind 4.1.17 · lucide-react 1.46 ·
`@supabase/supabase-js 2.109` · `vite-plugin-singlefile 2.3` → one distributable HTML file.

Deltas vs. `merqato.digital`: no router/SSR, no shadcn/ui (hand-written markup), no server functions
(writes go straight from the browser via an authenticated Supabase session — which is why RLS needed the
`site_admins` allow-list), no localization, and the `site-assets` bucket is **public** (direct
`getPublicUrl`) rather than proxied.

---

## 7. Notes / gotchas

- **`.env` is committed** with the Supabase URL and publishable key. That's a Lovable convention
  (publishable keys are meant to be public), but never add `SUPABASE_SERVICE_ROLE_KEY` there.
- `SITE_ADMIN_PASSKEY` is unset, so the admin passkey falls back to the hardcoded default `5309` —
  change it before any real deployment.
- `vite.config.ts` is intentionally almost empty: adding react/tailwind/tsconfig-paths/nitro plugins
  manually duplicates what `@lovable.dev/vite-tanstack-config` already installs and **breaks the build**.
- `src/components/ui/*` (46 files) is the untouched shadcn dump — most primitives are unused by
  `MerqatoSite.tsx`, which uses raw Tailwind. Safe to prune if bundle size matters.
- Files marked *"automatically generated. Do not edit"*: everything in `src/integrations/supabase/`
  plus `src/routeTree.gen.ts`.
- Lovable syncs both ways: pushing to `main` shows up in the Lovable editor, so keep the branch green.
