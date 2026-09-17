# Supabase Setup

The site works immediately in local-preview mode. In that mode, browser storage holds all backoffice text, palette, font, and media changes. Adding the following Supabase configuration turns it into a shared, deployable CMS with public live content and authenticated admin publishing.

## 1. Create the project

1. Create a new Supabase project.
2. In **Authentication > Providers**, keep Email enabled. Configure your production site's URL and redirect URLs once you deploy.
3. In **Authentication > Users**, create the email/password account that will administer the website.

## 2. Apply the database schema

1. Open **SQL Editor** in the Supabase dashboard.
2. Paste and run [`supabase/schema.sql`](supabase/schema.sql).
3. Copy the UUID of the administrator account created in step 1.
4. Run the final commented insert from the SQL file with that UUID. This grants the account permission to publish settings and manage media.

The schema creates:

- `public.site_settings`: one JSON document for page content, packages, FAQ, font, palette, and layout settings.
- `public.site_admins`: a protected allow-list of Supabase Auth users who can edit the live page.
- `site-assets`: a public Storage bucket for approved logo, image, and video assets, limited to 50 MB per file.

Row Level Security allows everyone to read published content but only users in `site_admins` to change content or upload/delete files.

## 3. Add environment variables

1. Copy `.env.example` to `.env.local`.
2. Add the Project URL and **publishable key** from **Project Settings > API**.
3. Set a strong `VITE_ADMIN_PASSKEY` value — this is the gate for the backoffice panel (opened by triple-clicking the site logo).
4. Do not put a `service_role` or secret key in a Vite environment file; all `VITE_*` values reach the browser.
5. Restart the Vite server after adding the variables.

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

## 4. Publish from the Backoffice

1. Click the logo three times, then enter the existing local passkey.
2. Sign in with the Supabase administrator email and password in the Backoffice footer.
3. Make edits or upload assets. The backoffice saves to the browser and publishes authenticated changes to Supabase.

The public website loads the single `main` settings row from Supabase whenever the environment variables are present. If Supabase is unavailable, the local preview remains functional and no public page is blocked.

## Security note

The triple-click/passkey gesture is a convenience gate for the static interface, not production authentication. Supabase Auth and the RLS policies in `supabase/schema.sql` are what secure cloud publishing and storage in production.