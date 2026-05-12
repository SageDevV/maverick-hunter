/**
 * Maverick Hunter — Gamma Login Helper
 * Opens a Chromium browser with the persistent profile so the user
 * can manually log in to gamma.app. The session cookies are saved
 * for subsequent automated runs.
 *
 * Usage: npm run gamma:login
 */
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILE_DIR = process.env.CHROME_PROFILE_DIR
  || path.resolve(__dirname, '..', 'chrome-profile');

console.log('');
console.log('  ══════════════════════════════════════════════');
console.log('   🎨 GAMMA LOGIN — Session Setup');
console.log('  ══════════════════════════════════════════════');
console.log(`   📂 Profile: ${PROFILE_DIR}`);
console.log('');
console.log('  A browser window will open. Please:');
console.log('  1. Log in to gamma.app with your Google account');
console.log('  2. Verify you see your dashboard');
console.log('  3. Close the browser window when done');
console.log('');
console.log('  Your session will be saved for automated runs.');
console.log('  ══════════════════════════════════════════════');
console.log('');

const browser = await puppeteer.launch({
  headless: false,
  userDataDir: PROFILE_DIR,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--window-size=1366,900',
    '--disable-blink-features=AutomationControlled',
  ],
  defaultViewport: { width: 1366, height: 900 },
});

const page = await browser.newPage();
await page.goto('https://gamma.app/', { waitUntil: 'networkidle2' });

console.log('  🌐 Browser opened at gamma.app');
console.log('  ⏳ Waiting for you to log in and close the browser...');
console.log('');

browser.on('disconnected', () => {
  console.log('  ✅ Session saved! You can now run Gamma tasks automatically.');
  process.exit(0);
});
