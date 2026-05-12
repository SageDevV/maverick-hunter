/**
 * ══════════════════════════════════════════════════════════
 *  🎯 MAVERICK HUNTER — Autonomous AI Task Execution System
 * ══════════════════════════════════════════════════════════
 * 
 * Reads QuestLog tasks from Firestore, routes them to the
 * appropriate AI CLI (Claude, Gemini, Codex), and manages
 * Git branches + commits automatically.
 * 
 * Usage:
 *   node src/index.mjs              → Start polling loop
 *   node src/index.mjs --once       → Run one cycle and exit
 *   node src/index.mjs --dry-run    → Read tasks but skip execution
 * 
 * @author Maverick Hunter System
 */
import path from 'path';
import { CONFIG } from './config.mjs';
import { initFirestore } from './firestore/client.mjs';
import { fetchPendingTasks } from './firestore/reader.mjs';
import { updateTaskStatus } from './firestore/writer.mjs';
import { routeTask } from './router/task-router.mjs';
import { prepareWorkspace, commitChanges } from './git/git-manager.mjs';
import { log } from './logger/logger.mjs';
import {
  notifySystemStarted,
  notifyTaskStarted,
  notifyTaskCompleted,
  notifyTaskFailed,
} from './notifier/telegram.mjs';

/**
 * Sleep for a given number of milliseconds.
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Print the startup banner.
 */
function printBanner() {
  console.log('');
  console.log('  ══════════════════════════════════════════════');
  console.log('   🎯 MAVERICK HUNTER — AI Task Executor');
  console.log('  ══════════════════════════════════════════════');
  console.log(`   📁 Workspace : ${CONFIG.WORKSPACE_DIR}`);
  console.log(`   ⏰ Polling   : every ${CONFIG.POLL_INTERVAL_MS / 1000}s`);
  console.log(`   🏷️  Labels    : ${CONFIG.ACCEPTED_LABELS.join(', ')}`);
  console.log(`   🏜️  Dry Run   : ${CONFIG.DRY_RUN ? 'YES' : 'no'}`);
  console.log(`   🔂 Run Once  : ${CONFIG.RUN_ONCE ? 'YES' : 'no'}`);
  console.log('  ══════════════════════════════════════════════');
  console.log('');
}

/**
 * Process a single task: prepare workspace, execute AI, commit results.
 * @param {Object} task - The quest task to process
 * @param {import('firebase-admin').firestore.DocumentReference} userDocRef
 */
async function processTask(task, userDocRef) {
  log.info(`▶ Processing: [${task.agentLabel}] ${task.title}`);

  let workDir, branch, projectName;

  try {
    // 1. Get the executor first to check if Git is needed
    const executor = routeTask(task.agentLabel);
    const needsGit = executor.requiresGit !== false;

    // 2. Prepare Git workspace (only for code-based executors)
    if (needsGit) {
      const workspace = prepareWorkspace(task);
      workDir = workspace.workDir;
      branch = workspace.branch;
      projectName = workspace.projectName;
      log.info(`  📁 Workspace: ${workDir}`);
      log.info(`  🌿 Branch: ${branch}`);
    } else {
      log.info(`  🌐 ${executor.name} executor — no Git workspace needed`);
      branch = 'N/A';
      projectName = 'N/A';
    }

    // 3. Update Firestore → running
    await updateTaskStatus(userDocRef, task.id, {
      maverickStatus: 'running',
      maverickStartedAt: Date.now(),
      maverickBranch: branch,
      maverickProject: projectName,
    });

    // 4. Send Telegram notification
    await notifyTaskStarted(task, branch);

    // 5. Execute
    const result = await executor.execute(task.description, workDir, task.id);

    // 6. Handle result
    if (result.success) {
      // Commit changes to git (only for code-based executors)
      if (needsGit && !CONFIG.DRY_RUN) {
        commitChanges(workDir, task);
      }

      await updateTaskStatus(userDocRef, task.id, {
        maverickStatus: 'completed',
        maverickCompletedAt: Date.now(),
        maverickLog: result.output.slice(-500),
      });

      await notifyTaskCompleted(task, result.durationMs, branch);
      log.info(`  ✅ Completed in ${Math.round(result.durationMs / 1000)}s`);
    } else {
      await updateTaskStatus(userDocRef, task.id, {
        maverickStatus: 'failed',
        maverickCompletedAt: Date.now(),
        maverickError: result.output.slice(-500),
      });

      await notifyTaskFailed(task, result.output.slice(-300));
      log.error(`  ❌ Failed (exit code ${result.exitCode}): ${result.output.slice(-200)}`);
    }
  } catch (error) {
    log.error(`  💥 Unexpected error processing task: ${error.message}`);

    await updateTaskStatus(userDocRef, task.id, {
      maverickStatus: 'failed',
      maverickError: error.message,
    });

    await notifyTaskFailed(task, error.message);
  }
}

/**
 * Run one polling cycle: fetch tasks and process them sequentially.
 */
async function pollAndProcess() {
  const result = await fetchPendingTasks();

  if (!result) {
    log.debug('📋 No data returned from Firestore');
    return;
  }

  const { tasks, userDocRef } = result;

  if (tasks.length === 0) {
    log.debug('📋 No pending tasks found');
    return;
  }

  log.info(`📋 Found ${tasks.length} pending task(s)`);

  // Process tasks sequentially (as requested)
  for (const task of tasks) {
    await processTask(task, userDocRef);
  }
}

/**
 * Main entry point — initializes services and starts the polling loop.
 */
async function main() {
  printBanner();
  log.info('🚀 Maverick Hunter initialized');

  // Initialize Firebase
  initFirestore();

  // Initial fetch to count tasks and notify
  const initialResult = await fetchPendingTasks();
  const initialCount = initialResult?.tasks.length ?? 0;
  await notifySystemStarted(initialCount);

  if (CONFIG.RUN_ONCE) {
    // Single execution mode
    log.info('🔂 Running in single-cycle mode (--once)');
    await pollAndProcess();
    log.info('🏁 Single cycle completed. Exiting.');
    process.exit(0);
  }

  // Continuous polling loop
  log.info(`⏰ Starting polling loop (interval: ${CONFIG.POLL_INTERVAL_MS / 1000}s)`);

  while (true) {
    try {
      await pollAndProcess();
    } catch (error) {
      log.error(`💥 Unhandled error in main loop: ${error.message}`);
      if (error.stack) log.debug(error.stack);

      // Cooldown to avoid spam on persistent errors
      log.info(`⏳ Cooling down for ${CONFIG.ERROR_COOLDOWN_MS / 1000}s...`);
      await sleep(CONFIG.ERROR_COOLDOWN_MS);
      continue;
    }

    // Wait before next poll
    log.debug(`💤 Sleeping for ${CONFIG.POLL_INTERVAL_MS / 1000}s...`);
    await sleep(CONFIG.POLL_INTERVAL_MS);
  }
}

// ── Lifecycle handlers ──
process.on('SIGINT', () => {
  log.info('🛑 Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log.info('🛑 Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  log.error(`💥 Uncaught exception: ${error.message}`);
  log.error(error.stack || '');
  // Don't exit — the loop should recover
});

// ── Run ──
main().catch((err) => {
  log.error(`💥 Fatal error: ${err.message}`);
  process.exit(1);
});
