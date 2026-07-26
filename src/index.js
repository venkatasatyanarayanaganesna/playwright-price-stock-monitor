#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const { checkItems } = require('./monitor');
const { loadHistory, recordReading, DEFAULT_HISTORY_PATH } = require('./storage');
const { buildAlerts, printAlerts } = require('./notifier');

function loadConfig(configPath) {
  const resolved = path.resolve(process.cwd(), configPath);
  if (!fs.existsSync(resolved)) {
    console.error(`Config file not found: ${resolved}`);
    console.error(`Copy config.example.json to config.json and edit it, or pass --config <path>.`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(resolved, 'utf-8'));
}

program.name('price-monitor').description('Watch product pages for price drops and stock changes using Playwright.');

program
  .command('check')
  .description('Check all configured items now and log an alert if anything changed')
  .option('--config <path>', 'Path to config JSON file', 'config.json')
  .option('--history <path>', 'Path to history JSON file', DEFAULT_HISTORY_PATH)
  .option('--headed', 'Run with a visible browser window', false)
  .action(async (opts) => {
    const config = loadConfig(opts.config);
    console.log(`\nChecking ${config.items.length} item(s)...\n`);

    const results = await checkItems(config.items, { headless: !opts.headed });
    const history = loadHistory(opts.history);

    for (const result of results) {
      const itemKey = result.url;
      const previous = recordReading(history, itemKey, result, opts.history);

      const priceLabel = result.price !== null ? result.price : 'unknown';
      const stockLabel = result.inStock === null ? 'unknown' : result.inStock ? 'in stock' : 'out of stock';
      console.log(`${result.name}`);
      console.log(`  Price: ${priceLabel}  |  Stock: ${stockLabel}`);

      const alerts = buildAlerts(result, previous);
      if (alerts.length) {
        printAlerts(alerts);
      } else {
        console.log('  No change since last check.');
      }
      console.log('');
    }

    console.log(`History saved to: ${path.resolve(process.cwd(), opts.history)}`);
  });

program
  .command('history')
  .description('Print the recorded price/stock history for all tracked items')
  .option('--history <path>', 'Path to history JSON file', DEFAULT_HISTORY_PATH)
  .action((opts) => {
    const history = loadHistory(opts.history);
    const keys = Object.keys(history);

    if (keys.length === 0) {
      console.log('No history recorded yet. Run "check" first.');
      return;
    }

    for (const url of keys) {
      const readings = history[url];
      const name = readings[readings.length - 1]?.name || url;
      console.log(`\n${name} (${url})`);
      for (const r of readings) {
        const price = r.price !== null ? r.price : 'unknown';
        const stock = r.inStock === null ? 'unknown' : r.inStock ? 'in stock' : 'out of stock';
        console.log(`  ${r.timestamp}  price=${price}  stock=${stock}`);
      }
    }
  });

program.parseAsync(process.argv);
