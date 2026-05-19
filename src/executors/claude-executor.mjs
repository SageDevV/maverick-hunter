/**
 * Maverick Hunter — Claude CLI Executor
 * Executes tasks using the Claude Code CLI in non-interactive mode.
 * Uses --dangerously-skip-permissions to bypass all approval prompts
 * so the agent runs fully autonomously.
 * 
 * Command: claude -p "{prompt}" --dangerously-skip-permissions --allowedTools ... --max-turns 25
 */
import { BaseExecutor } from './base-executor.mjs';

export class ClaudeExecutor extends BaseExecutor {
  constructor() {
    super('Claude', 'claude');
  }

  /**
   * Build CLI arguments for Claude's non-interactive mode.
   * --dangerously-skip-permissions: bypasses all permission prompts (file writes, shell commands, etc.)
   * @param {string} prompt
   * @param {string} workDir
   * @returns {string[]}
   */
  buildArgs(prompt, workDir) {
    return [
      '-p',
      prompt,
      '--dangerously-skip-permissions',
      '--allowedTools',
      'Bash', 'Read', 'Write', 'Edit', 'MultiEdit',
      '--max-turns', '25',
      '--output-format', 'text',
    ];
  }
}
