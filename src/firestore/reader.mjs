/**
 * Maverick Hunter — Firestore Reader
 * Reads pending tasks from QuestLog's Firestore, filtering by accepted agent labels.
 */
import { getDb } from './client.mjs';
import { CONFIG } from '../config.mjs';
import { log } from '../logger/logger.mjs';

/**
 * @typedef {Object} QuestTask
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} agentLabel
 * @property {boolean} completed
 * @property {string} [maverickStatus]
 * @property {string} [difficulty]
 * @property {number} [scheduledDate]
 */

/**
 * Fetch all pending tasks that should be processed by Maverick Hunter.
 * 
 * Filters:
 * - User email matches TARGET_USER_EMAIL
 * - agentLabel is in ACCEPTED_LABELS (Claude, Codex, Gemini)
 * - completed === false
 * - maverickStatus is NOT 'completed' or 'running'
 * 
 * @returns {Promise<{ tasks: QuestTask[], userDocRef: import('firebase-admin').firestore.DocumentReference, allQuests: any[] } | null>}
 */
export async function fetchPendingTasks() {
  const db = getDb();
  const snapshot = await db.collection('users').get();

  for (const userDoc of snapshot.docs) {
    const data = userDoc.data();
    const userEmail = data.email || '';

    if (userEmail !== CONFIG.TARGET_USER_EMAIL) continue;

    const quests = data.quests || [];
    log.debug(`📊 Total quests for ${userEmail}: ${quests.length}`);

    const pendingTasks = quests.filter(q =>
      !q.completed &&
      CONFIG.ACCEPTED_LABELS.includes(q.agentLabel) &&
      q.maverickStatus !== 'completed' &&
      q.maverickStatus !== 'running'
    );

    // Respect max tasks per cycle
    const limited = pendingTasks.slice(0, CONFIG.MAX_TASKS_PER_CYCLE);

    return {
      tasks: limited,
      userDocRef: userDoc.ref,
      allQuests: quests,
    };
  }

  log.warn(`⚠️ No user found with email: ${CONFIG.TARGET_USER_EMAIL}`);
  return null;
}
