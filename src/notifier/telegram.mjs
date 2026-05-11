/**
 * Maverick Hunter — Telegram Notifier
 * Sends execution status notifications via Telegram Bot API.
 * Reuses the same bot/chat from QuestLog's notification system.
 */
import { CONFIG } from '../config.mjs';
import { log } from '../logger/logger.mjs';

/**
 * Send a message via Telegram Bot API.
 * @param {string} text - HTML-formatted message
 */
async function sendTelegram(text) {
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = CONFIG;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    log.debug('  📱 Telegram not configured, skipping notification');
    return;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();
    if (data?.ok) {
      log.debug('  📱 Telegram notification sent');
    } else {
      log.warn(`  ⚠️ Telegram API error: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    log.warn(`  ⚠️ Telegram send failed: ${error.message}`);
  }
}

/**
 * Notify that a task execution started.
 * @param {Object} quest
 * @param {string} branch
 */
export async function notifyTaskStarted(quest, branch) {
  const msg = [
    `🚀 <b>Maverick Hunter</b>`,
    ``,
    `▶️ Iniciando task:`,
    `<b>${quest.title}</b>`,
    ``,
    `🤖 Agente: <b>${quest.agentLabel}</b>`,
    `🌿 Branch: <code>${branch}</code>`,
    `📋 ID: <code>${quest.id}</code>`,
  ].join('\n');

  await sendTelegram(msg);
}

/**
 * Notify that a task execution completed successfully.
 * @param {Object} quest
 * @param {number} durationMs
 * @param {string} branch
 */
export async function notifyTaskCompleted(quest, durationMs, branch) {
  const durationSec = Math.round(durationMs / 1000);
  const durationMin = Math.round(durationSec / 60);
  const timeStr = durationMin > 0 ? `${durationMin}min ${durationSec % 60}s` : `${durationSec}s`;

  const msg = [
    `✅ <b>Maverick Hunter</b>`,
    ``,
    `Task concluída com sucesso!`,
    `<b>${quest.title}</b>`,
    ``,
    `🤖 Agente: <b>${quest.agentLabel}</b>`,
    `⏱️ Duração: ${timeStr}`,
    `🌿 Branch: <code>${branch}</code>`,
  ].join('\n');

  await sendTelegram(msg);
}

/**
 * Notify that a task execution failed.
 * @param {Object} quest
 * @param {string} errorMsg
 */
export async function notifyTaskFailed(quest, errorMsg) {
  const shortError = errorMsg.slice(0, 200);

  const msg = [
    `❌ <b>Maverick Hunter</b>`,
    ``,
    `Task falhou:`,
    `<b>${quest.title}</b>`,
    ``,
    `🤖 Agente: <b>${quest.agentLabel}</b>`,
    `💥 Erro: <code>${shortError}</code>`,
  ].join('\n');

  await sendTelegram(msg);
}

/**
 * Notify system startup.
 * @param {number} taskCount - Number of pending tasks found
 */
export async function notifySystemStarted(taskCount) {
  const msg = [
    `🔥 <b>Maverick Hunter Online</b>`,
    ``,
    `Sistema iniciado com sucesso.`,
    `📋 ${taskCount} task(s) pendente(s) encontrada(s).`,
    `⏰ Polling: a cada ${CONFIG.POLL_INTERVAL_MS / 1000 / 60} minutos`,
  ].join('\n');

  await sendTelegram(msg);
}
