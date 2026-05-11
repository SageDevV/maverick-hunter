/**
 * Maverick Hunter — Executor Registry
 * Central registry that maps agent labels to their executor instances.
 * Adding a new agent (e.g., Kiro) requires only:
 *   1. Creating a new executor file
 *   2. Importing and registering it here
 */
import { ClaudeExecutor } from './claude-executor.mjs';
import { GeminiExecutor } from './gemini-executor.mjs';
import { CodexExecutor } from './codex-executor.mjs';

/** @type {Map<string, import('./base-executor.mjs').BaseExecutor>} */
const EXECUTOR_REGISTRY = new Map();

// ── Register all available executors ──
EXECUTOR_REGISTRY.set('Claude', new ClaudeExecutor());
EXECUTOR_REGISTRY.set('Gemini', new GeminiExecutor());
EXECUTOR_REGISTRY.set('Codex',  new CodexExecutor());

// Future: EXECUTOR_REGISTRY.set('Kiro', new KiroExecutor());

/**
 * Get the executor for a given agent label.
 * @param {string} label - The agent label (e.g., 'Claude', 'Gemini', 'Codex')
 * @returns {import('./base-executor.mjs').BaseExecutor | undefined}
 */
export function getExecutor(label) {
  return EXECUTOR_REGISTRY.get(label);
}

/**
 * Get all registered executor labels.
 * @returns {string[]}
 */
export function getRegisteredLabels() {
  return [...EXECUTOR_REGISTRY.keys()];
}

export { EXECUTOR_REGISTRY };
