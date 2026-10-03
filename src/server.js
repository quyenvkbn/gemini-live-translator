import express from 'express';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { config } from './config/env.js';
import { attachParallelTranslation } from './features/parallel-translation.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = express();
app.use(express.static(path.join(root, 'public')));
app.get('/health', (_req, res) => res.json({ ok: true, models: config.models, apiKeyConfigured: Boolean(config.geminiApiKey) }));

const server = createServer(app);
const liveServer = new WebSocketServer({ server, path: '/live' });
liveServer.on('connection', attachParallelTranslation);
server.listen(config.port, '0.0.0.0', () => console.log(`Gemini Live Translator: http://localhost:${config.port}`));
