/**
 * Maverick Hunter — Structured Logger
 * Outputs to both console and daily log files.
 */
import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config.mjs';

const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const currentLevel = LOG_LEVELS[CONFIG.LOG_LEVEL] ?? LOG_LEVELS.INFO;

/**
 * Ensure the logs directory exists.
 */
function ensureLogDir() {
  if (!fs.existsSync(CONFIG.LOG_DIR)) {
    fs.mkdirSync(CONFIG.LOG_DIR, { recursive: true });
  }
}

/**
 * Get today's log file path (YYYY-MM-DD.log).
 */
function getLogFilePath() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(CONFIG.LOG_DIR, `${dateStr}.log`);
}

/**
 * Format a log line with timestamp and level.
 */
function formatLine(level, message) {
  const now = new Date();
  const ts = now.toISOString().replace('T', ' ').slice(0, 19);
  return `[${ts}] [${level.padEnd(5)}] ${message}`;
}

/**
 * Write a log entry to console and file.
 */
function writeLog(level, message) {
  if (LOG_LEVELS[level] < currentLevel) return;

  const line = formatLine(level, message);

  // Console output with color
  switch (level) {
    case 'ERROR': console.error(`\x1b[31m${line}\x1b[0m`); break;
    case 'WARN':  console.warn(`\x1b[33m${line}\x1b[0m`);  break;
    case 'DEBUG': console.debug(`\x1b[90m${line}\x1b[0m`);  break;
    default:      console.log(line);
  }

  // File output
  try {
    ensureLogDir();
    fs.appendFileSync(getLogFilePath(), line + '\n', 'utf-8');
  } catch {
    // Silently ignore file write errors to avoid crash
  }
}

/**
 * Write task-specific execution output to a separate file.
 * @param {string} taskId - The quest ID
 * @param {string} content - Full CLI output
 */
export function writeTaskLog(taskId, content) {
  try {
    const tasksLogDir = path.join(CONFIG.LOG_DIR, 'tasks');
    if (!fs.existsSync(tasksLogDir)) {
      fs.mkdirSync(tasksLogDir, { recursive: true });
    }
    const filePath = path.join(tasksLogDir, `task-${taskId}.log`);
    const header = `═══ Maverick Hunter — Task Log ═══\nTask ID: ${taskId}\nTimestamp: ${new Date().toISOString()}\n${'═'.repeat(40)}\n\n`;
    fs.writeFileSync(filePath, header + content, 'utf-8');
  } catch {
    // Silently ignore
  }
}

export const log = {
  debug: (msg) => writeLog('DEBUG', msg),
  info:  (msg) => writeLog('INFO',  msg),
  warn:  (msg) => writeLog('WARN',  msg),
  error: (msg) => writeLog('ERROR', msg),
};
