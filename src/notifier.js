/**
 * Compares a new reading against the previous one (if any) and returns
 * a list of human-readable alert messages — price drops, price rises,
 * restocks, going out of stock, and hitting a configured target price.
 */
function buildAlerts(current, previous) {
  const alerts = [];

  if (current.error) {
    alerts.push({ level: 'error', message: `Failed to check "${current.name}": ${current.error}` });
    return alerts;
  }

  if (current.price === null) {
    alerts.push({ level: 'warn', message: `Could not read a price for "${current.name}" — check the selector` });
  }

  if (previous && !previous.error && current.price !== null && previous.price !== null) {
    if (current.price < previous.price) {
      const drop = (previous.price - current.price).toFixed(2);
      alerts.push({
        level: 'good',
        message: `PRICE DROP: "${current.name}" ${previous.price} → ${current.price} (down ${drop})`,
      });
    } else if (current.price > previous.price) {
      const rise = (current.price - previous.price).toFixed(2);
      alerts.push({
        level: 'info',
        message: `Price increased: "${current.name}" ${previous.price} → ${current.price} (up ${rise})`,
      });
    }
  }

  if (current.targetPrice !== null && current.price !== null && current.price <= current.targetPrice) {
    alerts.push({
      level: 'good',
      message: `TARGET HIT: "${current.name}" is now ${current.price}, at or below your target of ${current.targetPrice}`,
    });
  }

  if (previous && previous.inStock === false && current.inStock === true) {
    alerts.push({ level: 'good', message: `BACK IN STOCK: "${current.name}"` });
  }
  if (previous && previous.inStock === true && current.inStock === false) {
    alerts.push({ level: 'warn', message: `OUT OF STOCK: "${current.name}"` });
  }

  return alerts;
}

function printAlerts(alerts) {
  const icons = { good: '✅', warn: '⚠️ ', info: 'ℹ️ ', error: '❌' };
  for (const alert of alerts) {
    console.log(`  ${icons[alert.level] || ''} ${alert.message}`);
  }
}

module.exports = { buildAlerts, printAlerts };
