/**
 * Maverick Hunter — Task Router
 * Dispatches tasks to the correct AI executor based on the agent label.
 */
import { getExecutor, getRegisteredLabels } from '../executors/index.mjs';
import { log } from '../logger/logger.mjs';

/**
 * Route a task to its corresponding AI executor.
 * @param {string} agentLabel - The agent label (e.g., 'Claude', 'Gemini', 'Codex')
 * @returns {import('../executors/base-executor.mjs').BaseExecutor}
 * @throws {Error} If no executor is registered for the label
 */
export function routeTask(agentLabel) {
  const executor = getExecutor(agentLabel);

  if (!executor) {
    const available = getRegisteredLabels().join(', ');
    const msg = `No executor registered for label "${agentLabel}". Available: [${available}]`;
    log.error(`  ❌ ${msg}`);
    throw new Error(msg);
  }

  log.debug(`  🔀 Routed to ${executor.name} executor`);
  return executor;
}
