/**
 * Maverick Hunter — Firestore Writer
 * Updates task status in the Firestore quests array.
 * 
 * Since quests are stored as an array inside the user document,
 * we must read the full array, modify the target quest, and write back.
 */
import { log } from '../logger/logger.mjs';

/**
 * @typedef {Object} MaverickStatusUpdate
 * @property {string} [maverickStatus] - 'pending' | 'queued' | 'running' | 'completed' | 'failed'
 * @property {number} [maverickStartedAt]
 * @property {number} [maverickCompletedAt]
 * @property {string} [maverickBranch]
 * @property {string} [maverickProject]
 * @property {string} [maverickLog]
 * @property {string} [maverickError]
 */

/**
 * Update maverick-specific fields on a quest inside the user's quests array.
 * 
 * @param {import('firebase-admin').firestore.DocumentReference} userDocRef
 * @param {string} questId - The quest ID to update
 * @param {MaverickStatusUpdate} updates - Fields to merge into the quest
 */
export async function updateTaskStatus(userDocRef, questId, updates) {
  try {
    const docSnap = await userDocRef.get();
    if (!docSnap.exists) {
      log.error(`❌ User document not found for update`);
      return;
    }

    const data = docSnap.data();
    const quests = data.quests || [];

    const updatedQuests = quests.map(q => {
      if (q.id === questId) {
        return { ...q, ...updates };
      }
      return q;
    });

    await userDocRef.update({ quests: updatedQuests });
    log.debug(`  📝 Firestore updated: ${questId} → ${updates.maverickStatus || 'update'}`);
  } catch (error) {
    log.error(`❌ Failed to update task status in Firestore: ${error.message}`);
  }
}

/**
 * Mark a task as completed in QuestLog (set completed = true).
 * This is separate from maverickStatus — it marks the quest as done in the UI.
 * 
 * @param {import('firebase-admin').firestore.DocumentReference} userDocRef
 * @param {string} questId
 */
export async function markQuestCompleted(userDocRef, questId) {
  await updateTaskStatus(userDocRef, questId, {
    completed: true,
    completedAt: Date.now(),
    maverickStatus: 'completed',
    maverickCompletedAt: Date.now(),
  });
}
