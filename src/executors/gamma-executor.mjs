/**
 * Maverick Hunter — Gamma Executor
 * Automates presentation creation on gamma.app using Puppeteer.
 *
 * Full flow:
 *  1. Navigate to gamma.app
 *  2. Click "Criar novo"
 *  3. Click "Gerar"
 *  4. Type task description in the prompt input
 *  5. Click "Gerar contorno"
 *  6. Wait for outline generation to finish
 *  7. Click "Gerar" in the footer
 *  8. Wait 5 minutes for presentation generation
 *  9. Click three dots menu "..."
 * 10. Click "Exportar..."
 * 11. Click "Exportar para PowerPoint"
 *
 * Requires: First-time manual login via `npm run gamma:login`
 */
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import { CONFIG } from '../config.mjs';
import { log, writeTaskLog } from '../logger/logger.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PROFILE_DIR = path.resolve(__dirname, '..', '..', 'chrome-profile');

export class GammaExecutor {
  constructor() {
    this.name = 'Gamma';
    this.requiresGit = false;
  }

  /**
   * Execute the full Gamma automation flow.
   * @param {string} prompt - The task description
   * @param {string} _workDir - Unused (no Git workspace needed)
   * @param {string} [taskId] - Task ID for logging
   * @returns {Promise<import('./base-executor.mjs').ExecutionResult>}
   */
  async execute(prompt, _workDir, taskId) {
    log.info(`  🎨 Executing Gamma browser automation...`);

    if (CONFIG.DRY_RUN) {
      log.info(`  🏜️  DRY RUN — skipping Gamma execution`);
      return {
        success: true,
        output: `[DRY RUN] Would create Gamma presentation: ${prompt.slice(0, 100)}`,
        exitCode: 0,
        durationMs: 0,
      };
    }

    const startTime = Date.now();
    let browser = null;
    let output = '';

    try {
      browser = await puppeteer.launch({
        headless: false,
        userDataDir: CONFIG.CHROME_PROFILE_DIR || DEFAULT_PROFILE_DIR,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--window-size=1366,900',
          '--disable-blink-features=AutomationControlled',
        ],
        defaultViewport: { width: 1366, height: 900 },
      });

      const page = await browser.newPage();
      page.setDefaultTimeout(60000);

      // Configure download directory via CDP so exports save to workspace
      const downloadPath = CONFIG.WORKSPACE_DIR;
      const cdp = await page.createCDPSession();
      await cdp.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath,
      });
      log.info(`  📂 Downloads will be saved to: ${downloadPath}`);

      // ── Step 1: Navigate ──
      log.info(`  📌 [1/11] Navigating to gamma.app...`);
      await page.goto('https://gamma.app/', { waitUntil: 'networkidle2', timeout: 30000 });
      await this._sleep(3000);
      output += '[1/11] ✅ Navigated to gamma.app\n';

      // Verify login
      const loggedIn = await this._hasText(page, 'button', 'Criar novo');
      if (!loggedIn) {
        throw new Error('Not logged in to gamma.app. Run "npm run gamma:login" first.');
      }

      // ── Step 2: Click "Criar novo" ──
      log.info(`  📌 [2/11] Clicking "Criar novo"...`);
      await this._clickByText(page, 'button', 'Criar novo');
      await this._sleep(3000);
      output += '[2/11] ✅ Clicked "Criar novo"\n';

      // ── Step 3: Click "Gerar" card ──
      log.info(`  📌 [3/11] Clicking "Gerar" card...`);
      await this._clickByText(page, 'button, div[role="button"]', 'Gerar', 'prompt');
      await this._sleep(3000);
      output += '[3/11] ✅ Clicked "Gerar" card\n';

      // ── Step 4: Type prompt ──
      log.info(`  📌 [4/11] Typing prompt...`);
      const editorSel = '.tiptap.ProseMirror, div[contenteditable="true"], div.ProseMirror';
      await page.waitForSelector(editorSel, { timeout: 15000 });
      await this._sleep(500);
      await page.click(editorSel);
      await this._sleep(300);
      await page.keyboard.type(prompt, { delay: 20 });
      await this._sleep(1000);
      output += `[4/11] ✅ Typed: "${prompt.slice(0, 80)}..."\n`;

      // ── Step 5: Click "Gerar contorno" ──
      log.info(`  📌 [5/11] Clicking "Gerar contorno"...`);
      await this._clickByText(page, 'button', 'Gerar contorno');
      output += '[5/11] ✅ Clicked "Gerar contorno"\n';

      // ── Step 6: Wait for outline generation ──
      log.info(`  📌 [6/11] Waiting for outline (up to 2 min)...`);
      await this._waitForFooterGerar(page, 120000);
      await this._sleep(2000);
      output += '[6/11] ✅ Outline generated\n';

      // ── Step 7: Click "Gerar" in footer ──
      log.info(`  📌 [7/11] Clicking "Gerar" in footer...`);
      await this._clickFooterGerar(page);
      output += '[7/11] ✅ Clicked footer "Gerar"\n';

      // ── Step 8: Wait 5 minutes ──
      const waitMs = CONFIG.GAMMA_GENERATION_WAIT_MS;
      log.info(`  📌 [8/11] Waiting ${waitMs / 60000} min for presentation...`);
      await this._sleep(waitMs);
      output += `[8/11] ✅ Waited ${waitMs / 60000} min\n`;

      // ── Step 9: Click three dots "..." ──
      log.info(`  📌 [9/11] Opening three-dots menu...`);
      await this._clickThreeDots(page);
      await this._sleep(2000);
      output += '[9/11] ✅ Opened menu\n';

      // ── Step 10: Click "Exportar..." ──
      log.info(`  📌 [10/11] Clicking "Exportar..."...`);
      await this._clickByText(page, '[role="menuitem"], button, div', 'Exportar');
      await this._sleep(3000);
      output += '[10/11] ✅ Clicked "Exportar..."\n';

      // ── Step 11: Click "Exportar para PowerPoint" ──
      log.info(`  📌 [11/11] Clicking "Exportar para PowerPoint"...`);
      await this._clickByText(page, 'button, div, a, [role="button"]', 'PowerPoint');
      await this._sleep(8000);
      output += '[11/11] ✅ Export to PowerPoint triggered\n';

      const durationMs = Date.now() - startTime;
      output += `\n🎉 Done in ${Math.round(durationMs / 1000)}s\n`;
      log.info(`  ✅ Gamma complete in ${Math.round(durationMs / 1000)}s`);

      if (taskId) writeTaskLog(taskId, output);
      return { success: true, output, exitCode: 0, durationMs };

    } catch (error) {
      const durationMs = Date.now() - startTime;
      output += `\n❌ ERROR: ${error.message}\n`;
      log.error(`  ❌ Gamma failed: ${error.message}`);
      if (taskId) writeTaskLog(taskId, output);
      return { success: false, output, exitCode: 1, durationMs };
    } finally {
      if (browser) await browser.close().catch(() => {});
    }
  }

  // ── Helpers ──

  _sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  async _hasText(page, selector, text) {
    return page.evaluate((sel, txt) => {
      return [...document.querySelectorAll(sel)].some(el => el.textContent.includes(txt));
    }, selector, text);
  }

  /**
   * Click first element matching selector whose text includes `text`.
   * If `disambiguator` is given, the element must also contain that string.
   */
  async _clickByText(page, selector, text, disambiguator = null) {
    await this._sleep(500);
    const clicked = await page.evaluate((sel, txt, dis) => {
      const els = [...document.querySelectorAll(sel)];
      for (const el of els) {
        const c = el.textContent || '';
        if (c.includes(txt)) {
          if (dis && !c.includes(dis)) continue;
          el.scrollIntoView({ block: 'center' });
          el.click();
          return true;
        }
      }
      return false;
    }, selector, text, disambiguator);

    if (!clicked) throw new Error(`Element "${text}" not found (${selector})`);
  }

  /**
   * Wait for the footer "Gerar" button (appears after outline generation).
   * This button contains "Gerar" but NOT "contorno".
   */
  async _waitForFooterGerar(page, timeout = 120000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const found = await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const b of btns) {
          const t = b.textContent.trim();
          const r = b.getBoundingClientRect();
          // Footer button: bottom half of viewport, says "Gerar" but not "contorno"
          if (t.includes('Gerar') && !t.includes('contorno') && r.top > 400) {
            return true;
          }
        }
        return false;
      });
      if (found) return;
      await this._sleep(3000);
    }
    throw new Error('Outline generation timed out — footer "Gerar" button not found');
  }

  /** Click the footer "Gerar" button (not "Gerar contorno"). */
  async _clickFooterGerar(page) {
    const clicked = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        const t = b.textContent.trim();
        const r = b.getBoundingClientRect();
        if (t.includes('Gerar') && !t.includes('contorno') && r.top > 400) {
          b.scrollIntoView({ block: 'center' });
          b.click();
          return true;
        }
      }
      return false;
    });
    if (!clicked) throw new Error('Footer "Gerar" button not found');
  }

  /** Click the three-dots "..." menu button in the top toolbar. */
  async _clickThreeDots(page) {
    const clicked = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        // Check aria-label for menu/options
        const label = (b.getAttribute('aria-label') || '').toLowerCase();
        if (label.includes('more') || label.includes('menu') || label.includes('option')) {
          b.click();
          return true;
        }
      }
      // Fallback: look for a small icon button with "..." or "⋯" text
      for (const b of btns) {
        const t = b.textContent.trim();
        if (t === '...' || t === '⋯' || t === '···' || t === '…') {
          b.click();
          return true;
        }
      }
      // Fallback 2: look for button with only an SVG child (icon buttons) near top-right
      for (const b of btns) {
        const r = b.getBoundingClientRect();
        const hasOnlySvg = b.children.length === 1 && b.children[0].tagName === 'svg';
        if (hasOnlySvg && r.top < 80 && r.right > 800) {
          b.click();
          return true;
        }
      }
      return false;
    });
    if (!clicked) throw new Error('Three-dots menu button not found');
  }
}
