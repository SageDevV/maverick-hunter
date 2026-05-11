/**
 * Maverick Hunter — Codex CLI Executor
 * Executes tasks using the OpenAI Codex CLI in non-interactive mode.
 * 
 * Command: codex exec "{prompt}" --sandbox workspace-write
 * Requires OPENAI_API_KEY in environment.
 */
import { BaseExecutor } from './base-executor.mjs';

export class CodexExecutor extends BaseExecutor {
  constructor() {
    super('Codex', 'codex');
  }

  /**
   * Build CLI arguments for Codex's non-interactive mode.
   * @param {string} prompt
   * @param {string} workDir
   * @returns {string[]}
   */
  buildArgs(prompt, workDir) {
    return [
      'exec',
      prompt,
      '--sandbox', 'workspace-write',
    ];
  }
}
