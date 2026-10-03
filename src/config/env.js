import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 3000),
  geminiApiKey: process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'replace_with_a_new_key' ? process.env.GEMINI_API_KEY : '',
  models: {
    translation: process.env.GEMINI_TRANSLATION_MODEL || 'gemini-3.5-live-translate-preview',
    live: process.env.GEMINI_LIVE_MODEL || 'gemini-3.8-live',
    transcription: process.env.GEMINI_TRANSCRIPTION_MODEL || 'gemini-3.5-transcribe-live',
    analysis: process.env.GEMINI_ANALYSIS_MODEL || 'gemini-3.8-live',
    deepAnalysis: process.env.GEMINI_DEEP_ANALYSIS_MODEL || 'gemini-3.8-live-extended-thinking'
  }
};
