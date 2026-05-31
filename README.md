# Northstar Portfolio

A Cloudflare Pages portfolio tracker for HKSE, NYSE, Nasdaq, ShanghaiSE and ShenzhenSE stocks.

## Features

- Search exchange catalogs through Twelve Data's public `/stocks` reference endpoint.
- Add holdings and edit share counts or average costs.
- Track market value, profit and return percentage.
- Create custom combinations of companies.
- Keep portfolio data private in the browser with `localStorage`.
- Cache symbol catalogs at the Cloudflare edge for one day.
- Request quotes through a Pages Function so the API key is never exposed to the browser.

## Project layout

```text
public/                 Static website
functions/api/stocks.js Cached catalog proxy
functions/api/quote.js  Authenticated quote proxy
wrangler.jsonc          Cloudflare Pages configuration
package.json            Local preview and CLI deployment scripts
```

## 1. Get a Twelve Data API key

Create a Twelve Data account and copy your API key. The public symbol catalog works without a key. Live prices use the key, and international exchange coverage depends on your Twelve Data plan.

## 2. Upload to GitHub

Create an empty GitHub repository. From this folder, run:

```bash
git init
git add .
git commit -m "Deploy Northstar portfolio"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

The `.gitignore` file excludes local secret files.

## 3. Deploy with Cloudflare Pages

1. In the Cloudflare dashboard, open **Workers & Pages**.
2. Select **Create application** > **Pages** > **Connect to Git**.
3. Select your GitHub repository.
4. Use these build settings:

```text
Production branch: main
Framework preset: None
Build command: leave empty
Build output directory: public
```

5. Save and deploy.

Cloudflare automatically deploys the `functions/` directory as Pages Functions.

## 4. Add the quote secret

In your Cloudflare Pages project, open **Settings** > **Variables and Secrets**. Add:

```text
TWELVE_DATA_API_KEY = your Twelve Data API key
```

Mark it as encrypted, apply it to production and preview environments, then trigger a new deployment.

## Optional: preview locally

Install dependencies:

```bash
npm install
```

Create a local secret file:

```bash
cp .dev.vars.example .dev.vars
```

Replace the placeholder value inside `.dev.vars`, then run:

```bash
npm run dev
```

Open `http://localhost:8788`.

## Optional: deploy with Wrangler

After `npm install`, authenticate and create the Pages project:

```bash
npx wrangler login
npx wrangler pages project create northstar-portfolio
npx wrangler pages secret put TWELVE_DATA_API_KEY --project-name northstar-portfolio
npm run deploy
```

## Data notes

The initial dashboard holdings include sample prices so the interface is useful immediately. Catalogs are loaded with MIC codes:

```text
Nasdaq      XNAS
NYSE        XNYS
Hong Kong   XHKG
Shanghai    XSHG
Shenzhen    XSHE
```
