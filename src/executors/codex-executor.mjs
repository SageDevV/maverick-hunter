/**
 * Maverick Hunter — Codex CLI Executor
 * Executes tasks using the OpenAI Codex CLI in non-interactive mode.
 * Uses --approval-mode full-auto to bypass all approval prompts
 * so the agent runs fully autonomously.
 * 
 * Command: codex exec "{prompt}" --approval-mode full-auto --sandbox workspace-write
 * Requires OPENAI_API_KEY in environment.
 */
import { BaseExecutor } from './base-executor.mjs';

export class CodexExecutor extends BaseExecutor {
  constructor() {
    super('Codex', 'codex');
  }

  /**
   * Build CLI arguments for Codex's non-interactive mode.
   * --approval-mode full-auto: executes file edits and shell commands without confirmation
   * @param {string} prompt
   * @param {string} workDir
   * @returns {string[]}
   */
  buildArgs(prompt, workDir) {
    return [
      'exec',
      prompt,
      '--approval-mode', 'full-auto',
      '--sandbox', 'workspace-write',
    ];
  }
}
