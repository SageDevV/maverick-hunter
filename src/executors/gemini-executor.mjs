/**
 * Maverick Hunter — Gemini CLI Executor
 * Executes tasks using the Gemini CLI in non-interactive mode.
 * 
 * Command: gemini -p "{prompt}"
 * Requires GOOGLE_API_KEY in environment.
 */
import { BaseExecutor } from './base-executor.mjs';

export class GeminiExecutor extends BaseExecutor {
  constructor() {
    super('Gemini', 'gemini');
  }

  /**
   * Build CLI arguments for Gemini's non-interactive mode.
   * @param {string} prompt
   * @param {string} workDir
   * @returns {string[]}
   */
  buildArgs(prompt, workDir) {
    return [
      '-p',
      prompt,
    ];
  }

  /**
   * Ensure GOOGLE_API_KEY is available in the environment.
   * @returns {Object}
   */
  buildEnv() {
    const env = super.buildEnv();
    // GOOGLE_API_KEY should already be set in the system environment
    // or in the .env file. This is a pass-through.
    return env;
  }
}
