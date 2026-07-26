const { chromium } = require('playwright');

/**
 * Extracts a numeric price from arbitrary page text like "£51.77",
 * "$19.99", "Rs. 1,299.00" — strips currency symbols/commas and parses
 * the first valid number found.
 */
function parsePrice(rawText) {
  if (!rawText) return null;
  const match = rawText.replace(/,/g, '').match(/[\d.]+/);
  return match ? parseFloat(match[0]) : null;
}

function parseStockStatus(rawText) {
  if (!rawText) return null;
  const normalized = rawText.trim().toLowerCase();
  if (normalized.includes('out of stock') || normalized.includes('unavailable') || normalized.includes('sold out')) {
    return false;
  }
  if (normalized.includes('in stock') || normalized.includes('available')) {
    return true;
  }
  return null; // unknown / couldn't determine
}

/**
 * Visits every item's URL and extracts current price + stock status
 * using the CSS selectors defined in the config for that item.
 *
 * @param {Array<{name: string, url: string, priceSelector: string, stockSelector?: string}>} items
 */
async function checkItems(items, { headless = true, timeoutMs = 15000 } = {}) {
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext();
  const results = [];

  for (const item of items) {
    const page = await context.newPage();
    try {
      await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });

      const priceText = await page
        .locator(item.priceSelector)
        .first()
        .textContent()
        .catch(() => null);

      const stockText = item.stockSelector
        ? await page.locator(item.stockSelector).first().textContent().catch(() => null)
        : null;

      const price = parsePrice(priceText);
      const inStock = parseStockStatus(stockText);

      results.push({
        name: item.name,
        url: item.url,
        price,
        inStock,
        targetPrice: item.targetPrice ?? null,
        timestamp: new Date().toISOString(),
        error: null,
      });
    } catch (err) {
      results.push({
        name: item.name,
        url: item.url,
        price: null,
        inStock: null,
        targetPrice: item.targetPrice ?? null,
        timestamp: new Date().toISOString(),
        error: err.message,
      });
    } finally {
      await page.close();
    }
  }

  await browser.close();
  return results;
}

module.exports = { checkItems, parsePrice, parseStockStatus };
