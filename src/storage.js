const fs = require('fs');
const path = require('path');

const DEFAULT_HISTORY_PATH = path.join(__dirname, '..', 'data', 'history.json');

function loadHistory(historyPath = DEFAULT_HISTORY_PATH) {
  if (!fs.existsSync(historyPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
  } catch {
    return {};
  }
}

function saveHistory(history, historyPath = DEFAULT_HISTORY_PATH) {
  fs.mkdirSync(path.dirname(historyPath), { recursive: true });
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf-8');
}

/**
 * Appends a new reading for an item and returns the previous reading
 * (if any) so the caller can compare and decide whether to alert.
 */
function recordReading(history, itemKey, reading, historyPath = DEFAULT_HISTORY_PATH) {
  if (!history[itemKey]) history[itemKey] = [];

  const previous = history[itemKey][history[itemKey].length - 1] || null;
  history[itemKey].push(reading);

  saveHistory(history, historyPath);
  return previous;
}

module.exports = { loadHistory, saveHistory, recordReading, DEFAULT_HISTORY_PATH };
