/**
 * Maverick Hunter — Base Executor
 * Abstract base class that all AI CLI executors must extend.
 * Provides common functionality for spawning CLI processes with timeout.
 */
import { spawn } from 'child_process';
import { CONFIG } from '../config.mjs';
import { log, writeTaskLog } from '../logger/logger.mjs';

/**
 * @typedef {Object} ExecutionResult
 * @property {boolean} success
 * @property {string} output - Combined stdout + stderr
 * @property {number} exitCode
 * @property {number} durationMs
 */

export class BaseExecutor {
  /**
   * @param {string} name - Display name (e.g., 'Claude')
   * @param {string} command - CLI command (e.g., 'claude')
   */
  constructor(name, command) {
    this.name = name;
    this.command = command;
  }

  /**
   * Build the CLI arguments array for the given prompt and work directory.
   * Must be implemented by subclasses.
   * @param {string} prompt - The task description
   * @param {string} workDir - Working directory
   * @returns {string[]}
   */
  buildArgs(prompt, workDir) {
    throw new Error(`${this.name}Executor.buildArgs() not implemented`);
  }

  /**
   * Build environment variables for the CLI process.
   * Can be overridden by subclasses to add specific env vars.
   * @returns {Object}
   */
  buildEnv() {
    return { ...process.env };
  }

  /**
   * Execute the AI CLI with the given prompt in the specified directory.
   * @param {string} prompt - The task description/instructions
   * @param {string} workDir - Working directory for execution
   * @param {string} [taskId] - Optional task ID for logging
   * @returns {Promise<ExecutionResult>}
   */
  async execute(prompt, workDir, taskId) {
    const args = this.buildArgs(prompt, workDir);
    const env = this.buildEnv();
    const timeoutMs = CONFIG.CLI_TIMEOUT_MS;

    log.info(`  🤖 Executing ${this.name} CLI...`);
    log.debug(`  📎 Command: ${this.command} ${args.join(' ').slice(0, 200)}...`);

    if (CONFIG.DRY_RUN) {
      log.info(`  🏜️  DRY RUN — skipping actual execution`);
      return {
        success: true,
        output: `[DRY RUN] Would execute: ${this.command} ${args.join(' ').slice(0, 100)}`,
        exitCode: 0,
        durationMs: 0,
      };
    }

    const startTime = Date.now();

    return new Promise((resolve) => {
      let output = '';
      let killed = false;

      const proc = spawn(this.command, args, {
        cwd: workDir,
        env,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      // Timeout handler
      const timer = setTimeout(() => {
        killed = true;
        proc.kill('SIGTERM');
        log.warn(`  ⏰ ${this.name} CLI timed out after ${timeoutMs / 1000}s`);
      }, timeoutMs);

      proc.stdout.on('data', (data) => {
        output += data.toString();
      });

      proc.stderr.on('data', (data) => {
        output += data.toString();
      });

      proc.on('close', (code) => {
        clearTimeout(timer);
        const durationMs = Date.now() - startTime;

        // Write full output to task-specific log
        if (taskId) {
          writeTaskLog(taskId, output);
        }

        if (killed) {
          resolve({
            success: false,
            output: `[TIMEOUT] Process killed after ${timeoutMs / 1000}s.\n\n${output.slice(-1000)}`,
            exitCode: code ?? 1,
            durationMs,
          });
        } else {
          resolve({
            success: code === 0,
            output,
            exitCode: code ?? 1,
            durationMs,
          });
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        const durationMs = Date.now() - startTime;
        resolve({
          success: false,
          output: `[SPAWN ERROR] ${err.message}\n\n${output}`,
          exitCode: 1,
          durationMs,
        });
      });
    });
  }
}
