/**
 * Maverick Hunter — Claude CLI Executor
 * Executes tasks using the Claude Code CLI in non-interactive mode.
 * 
 * Command: claude -p "{prompt}" --allowedTools Bash Read Write Edit --max-turns 20
 */
import { BaseExecutor } from './base-executor.mjs';

export class ClaudeExecutor extends BaseExecutor {
  constructor() {
    super('Claude', 'claude');
  }

  /**
   * Build CLI arguments for Claude's non-interactive mode.
   * @param {string} prompt
   * @param {string} workDir
   * @returns {string[]}
   */
  buildArgs(prompt, workDir) {
    return [
      '-p',
      prompt,
      '--allowedTools',
      'Bash', 'Read', 'Write', 'Edit', 'MultiEdit',
      '--max-turns', '25',
      '--output-format', 'text',
    ];
  }
}
