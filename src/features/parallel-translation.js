import { WebSocket } from 'ws';
import { config } from '../config/env.js';
import { createGeminiSession, createTranslationSetup } from '../gemini/live-session.js';

export function attachParallelTranslation(browser) {
  if (!config.geminiApiKey) {
    browser.close(1011, 'Missing GEMINI_API_KEY');
    return;
  }

  const gemini = createGeminiSession(
    () => {
      gemini.send(JSON.stringify(createTranslationSetup()));
      browser.send(JSON.stringify({ type: 'connected', model: config.models.translation }));
    },
    (data) => { if (browser.readyState === WebSocket.OPEN) browser.send(data.toString()); },
    (error) => { if (browser.readyState === WebSocket.OPEN) browser.send(JSON.stringify({ type: 'error', message: error.message })); },
    (code, reason) => { if (browser.readyState === WebSocket.OPEN) browser.close(code || 1000, reason); }
  );

  browser.on('message', (data) => {
    if (gemini.readyState === WebSocket.OPEN) gemini.send(data);
  });
  browser.on('close', () => gemini.close());
}
