# TimberTally

Board-foot, location-aware weight, and $/MBF pricing calculator for dimensional lumber.

## Run it locally

You need Node.js 18+ installed (https://nodejs.org).

```bash
npm install
npm run dev
```

Open the URL it prints (usually http://localhost:5173).

To make a production build:

```bash
npm run build
```

The finished site lands in the `dist/` folder.

## Deploy to Cloudflare Pages

There are two ways. **Option A (Git) is recommended** — every future change auto-deploys when you push.

### Option A — Connect a GitHub repo (auto-deploy)

1. Put this folder in a new GitHub repository.
2. Go to https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Pick your repo. When asked for build settings, enter:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Click **Save and Deploy**. Your site goes live at `https://<project>.pages.dev`.

Every `git push` from now on rebuilds and redeploys automatically.

### Option B — Direct upload (no Git)

1. Run `npm install && npm run build` locally.
2. Go to **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
3. Drag in the `dist/` folder. Done.

   (You re-upload `dist/` by hand each time you change something — that's the tradeoff vs Option A.)

## Custom domain (optional, ~$10–15/yr)

In your Pages project → **Custom domains** → **Set up a domain** → follow the DNS prompt.
Buying the domain through Cloudflare Registrar keeps everything in one dashboard.

## Notes

- The address lookup uses free public geocoders (US Census + OpenStreetMap Nominatim).
  Nominatim asks that heavy/commercial traffic use a paid key or self-hosted instance —
  fine to launch on, revisit if traffic grows.
- Everything computes in the browser; there is no backend to run or pay for.
