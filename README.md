# Price & Stock Monitor

A Playwright-based tool that watches product pages for **price drops**
and **restocks**, keeps a history log, and can run automatically on a
schedule via GitHub Actions — so you get notified without lifting a
finger.

## Why this is useful

Price tracking is one of the most genuinely useful everyday automations
— waiting for a price drop on something you want, or trying to catch a
high-demand item the moment it's back in stock, is exactly the kind of
repetitive checking a script should do instead of a human refreshing a
page all day.

## Setup

```bash
npm install
npx playwright install chromium
cp config.example.json config.json
```

Edit `config.json` to track your own items — see **Finding selectors**
below for how to fill in `priceSelector` and `stockSelector` for any
site.

## Usage

**Run a check right now:**
```bash
node src/index.js check
```

**See what changed since last time** — every `check` compares against
the last saved reading and prints alerts:
```
A Light in the Attic
  Price: 47.5  |  Stock: in stock
  ✅ PRICE DROP: "A Light in the Attic" 51.77 → 47.5 (down 4.27)
  ✅ TARGET HIT: "A Light in the Attic" is now 47.5, at or below your target of 50
```

**View full history for all tracked items:**
```bash
node src/index.js history
```

**Try it against the built-in example config** (books.toscrape.com, a
free practice site):
```bash
npm run check:example
```

## Finding CSS selectors for a real site

1. Open the product page in Chrome
2. Right-click the price → **Inspect**
3. In DevTools, right-click the highlighted HTML element → **Copy → Copy selector**
4. Paste that into `priceSelector` in your config
5. Repeat for the "in stock" / "out of stock" text if the site shows one

Example config entry:
```json
{
  "name": "Example Product",
  "url": "https://example.com/product/123",
  "priceSelector": ".product-price",
  "stockSelector": ".stock-status",
  "targetPrice": 25.0
}
```
`targetPrice` is optional — omit it if you just want to be told about
any change, not a specific threshold.

## Running this automatically (no manual checks needed)

This project includes `.github/workflows/price-check.yml`, which runs
the check **every 6 hours automatically** once pushed to GitHub — no
server or always-on computer required. It commits the updated
`data/history.json` back to the repo after each run, so your price
history builds up over time and is visible right in your repo.

To adjust how often it runs, edit the `cron` line in that file (uses
standard cron syntax — e.g. `0 */6 * * *` = every 6 hours, `0 9 * * *` =
once a day at 9am UTC).

**To get actual notifications** (not just a log), extend the workflow
to call a webhook — see **Extending this** below.

## How it works

1. **Monitor** (`src/monitor.js`) — visits each configured URL, reads
   the price and stock text using your CSS selectors, and parses them
   into clean values.
2. **Storage** (`src/storage.js`) — appends each reading to
   `data/history.json`, keyed by URL, so nothing is ever overwritten.
3. **Notifier** (`src/notifier.js`) — compares the new reading to the
   previous one and generates alerts: price drops, price rises, target
   price hit, restocks, and going out of stock.

## Project structure

```
price-stock-monitor/
├── src/
│   ├── index.js         # CLI entry point (check / history commands)
│   ├── monitor.js        # Visits pages, extracts price/stock via selectors
│   ├── storage.js        # Reads/writes data/history.json
│   └── notifier.js       # Compares readings, builds alert messages
├── data/
│   └── history.json      # Accumulated price/stock history (generated)
├── config.example.json   # Example tracked items — copy to config.json
└── .github/workflows/
    └── price-check.yml   # Scheduled automatic checks (every 6 hours)
```

## Extending this

- **Real notifications**: add a step to the GitHub Actions workflow that
  POSTs to a Slack/Discord webhook or sends an email when `buildAlerts`
  finds something — currently alerts only print to the console/CI logs.
- **Multiple currencies**: `parsePrice` currently strips symbols and
  parses the first number — extend it to track currency per item if
  tracking international sites.
- **Graph the history**: `data/history.json` is plain JSON — easy to
  feed into a simple chart (e.g. a small HTML/Chart.js page) to
  visualize price trends over time.
