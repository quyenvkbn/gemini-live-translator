import { WebSocket } from 'ws';
import { config } from '../config/env.js';

export function createGeminiSession(onOpen, onMessage, onError, onClose) {
  const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${encodeURIComponent(config.geminiApiKey)}`;
  const socket = new WebSocket(url);
  socket.on('open', onOpen);
  socket.on('message', onMessage);
  socket.on('error', onError);
  socket.on('close', onClose);
  return socket;
}

export function createTranslationSetup() {
  return {
    setup: {
      model: `models/${config.models.translation}`,
      generationConfig: {
        responseModalities: ['AUDIO'],
        translationConfig: { targetLanguageCode: 'vi', echoTargetLanguage: true }
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {}
    }
  };
}
