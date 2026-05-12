/**
 * Maverick Hunter — Centralized Configuration
 * All configurable values are read from environment variables with sensible defaults.
 */
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '..', '.env') });

export const CONFIG = Object.freeze({
  // ── Firestore ──
  TARGET_USER_EMAIL: process.env.TARGET_USER_EMAIL || 'pandredbz@gmail.com',

  // ── Polling ──
  POLL_INTERVAL_MS: parseInt(process.env.POLL_INTERVAL_MS || '300000', 10),   // 5 min
  ERROR_COOLDOWN_MS: parseInt(process.env.ERROR_COOLDOWN_MS || '60000', 10),  // 1 min
  MAX_TASKS_PER_CYCLE: parseInt(process.env.MAX_TASKS_PER_CYCLE || '10', 10),

  // ── CLI Execution ──
  CLI_TIMEOUT_MS: parseInt(process.env.CLI_TIMEOUT_MS || '900000', 10),       // 15 min

  // ── Workspace ──
  WORKSPACE_DIR: process.env.WORKSPACE_DIR || 'C:\\Users\\usuario\\Documents\\Workspace.AI\\Autonomus',

  // ── Accepted Agent Labels ──
  ACCEPTED_LABELS: ['Claude', 'Codex', 'Gemini'],

  // ── Telegram ──
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '',

  // ── Logging ──
  LOG_LEVEL: process.env.LOG_LEVEL || 'INFO',
  LOG_DIR: path.resolve(__dirname, '..', 'logs'),

  // ── Run Modes (set via CLI args) ──
  DRY_RUN: process.argv.includes('--dry-run'),
  RUN_ONCE: process.argv.includes('--once'),
});
