# Artist Shop

A custom art-sales website: public gallery + product pages, Square-powered
checkout, a commission/contact form, and a password-protected admin
dashboard the artist can use to add art and manage inventory — no code
required on her end after setup.

**Stack:** Next.js 14 (App Router) · Supabase (Postgres + Auth + Storage) ·
Square Checkout API · Resend (email) · Tailwind CSS · deploys to Vercel.

---

## 1. What you're getting

- `/` — public gallery grid of all available art
- `/artwork/[slug]` — detail page with photos, price, and a **Buy now**
  button (or **Inquire** for commission-only pieces)
- `/contact` — commission/question form, emails the artist and logs to the
  database
- `/admin` — password-protected dashboard: add/edit artwork, see stock
  levels, recent orders, recent inquiries
- Checkout happens on Square's own hosted page (PCI compliance is Square's
  problem, not yours) — payments land in the artist's existing Square
  account
- A webhook automatically marks inventory sold when a payment completes

**Design:** the visual system (colors, type, layout) in this scaffold is
a placeholder starting point — an editorial gallery look using Fraunces
(serif) + Work Sans, a warm paper/moss palette, no logo. Swap in the
artist's real name, logo, and brand colors in `app/layout.tsx`,
`tailwind.config.ts`, and `components/Header.tsx` before launch.

---

## 2. Try it right now with zero setup (demo mode)

You don't need Supabase, Square, or Resend accounts to see what this looks
like. With no `.env.local` file at all, the site automatically runs in
**demo mode**: the gallery and artwork pages show sample artwork, "Buy now"
and the contact form simulate success without calling any real service, and
`/admin` is open without logging in.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. A dark banner at the top confirms you're in
demo mode. Once you're ready to make it real — actually taking orders and
letting the artist log in and manage her own inventory — follow section 3
below; demo mode turns itself off automatically the moment real Supabase
credentials are added to `.env.local`.

---

## 3. One-time setup (to go live)

### A. Supabase (database, login, image storage) — free tier is enough to start
1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, paste and run everything in `supabase/schema.sql`.
3. Go to **Storage** → create a new **public** bucket named
   `artwork-images`.
4. Go to **Authentication** → **Users** → add one user (the artist's
   email + a password). This is her admin login — there's no public
   sign-up form, by design.
5. Go to **Settings → API** and copy the Project URL, `anon` key, and
   `service_role` key into your `.env.local` (see step D).

### B. Square (payments)
1. Log in to the [Square Developer Dashboard](https://developer.squareup.com/apps)
   with the artist's existing Square account.
2. Create an app, grab the **Sandbox Access Token** and **Location ID**
   first for testing.
3. Under **Webhooks**, add an endpoint pointing at
   `https://your-domain.com/api/webhooks/square`, subscribed to the
   `payment.updated` event, and copy the **Signature Key**.
4. When ready to go live, switch to the **Production** access token and
   set `SQUARE_ENVIRONMENT=production`.

### C. Resend (contact form emails) — free tier covers this easily
1. Create an account at [resend.com](https://resend.com).
2. Verify a sending domain (or use their shared test address while
   developing), grab an API key.

### D. Environment variables
Copy `.env.example` to `.env.local` and fill in everything from steps
A–C.

### E. Install and run locally
```bash
npm install
npm run dev
```
Visit `http://localhost:3000`. Sign in at `/admin/login` with the user
you created in Supabase.

---

## 4. Deploying

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com/new).
3. Add all the same environment variables from `.env.local` in the
   Vercel project settings.
4. Deploy. Update `NEXT_PUBLIC_SITE_URL` to the real domain and the
   Square webhook URL to match.
5. **Buy the domain** (Namecheap, Google Domains, Cloudflare — any
   registrar works) and point it at Vercel: in Vercel → Project →
   Settings → Domains, add the domain and follow the DNS instructions
   shown there.

---

## 5. Day-to-day use (for the artist)

- **Add a piece:** `/admin` → "Add new piece" → fill in title, price,
  photos, quantity. Uncheck "print" for one-of-a-kind originals.
- **Mark something sold manually** (e.g. sold in person): edit the piece
  and set Status to "Sold out."
- **Custom/commission pieces:** set Status to "Inquire only" instead of
  giving it a Buy button — shoppers get a "Request this piece" link to
  the contact form instead.
- **Orders & inquiries** both show up on the `/admin` dashboard
  automatically.

---

## 6. Reasonable next steps (not built yet)

- Multi-item cart (current flow is a direct single-item "Buy now" —
  simplest for mostly one-of-a-kind pieces; worth adding a cart if she
  sells a lot of prints people buy in bundles)
- Shipping address collection / rate calculation (Square Checkout can
  collect this — see `checkout_options` in `lib/square.ts`)
- Email receipt to the buyer (Square sends one by default; can be
  customized)
- Image optimization / drag-to-reorder photos in the admin form
