import { GeminiLiveClient } from '../transport/live-client.js';
import { createPcmAudioCapture } from '../media/audio-capture.js';
import { LiveAudioPlayer } from '../audio/live-audio-player.js';

const toBase64 = bytes => { let binary = ''; for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(binary); };

export class ParallelTranslation {
  constructor({ video, canvas, onStatus, onCaptions }) { this.video = video; this.canvas = canvas; this.onStatus = onStatus; this.onCaptions = onCaptions; this.audioPlayer = new LiveAudioPlayer(); }
  async start() {
    this.client = new GeminiLiveClient({ onMessage: m => this.handleMessage(m), onClose: event => this.onStatus(event?.reason || 'Đã ngắt kết nối', 'error') });
    // Create the audio context inside the user's click gesture so browser autoplay policy allows playback.
    this.audioPlayer.start();
    await this.client.connect();
    const mediaStream = this.video.srcObject || (this.video.src && this.video.captureStream ? this.video.captureStream() : null);
    this.audioStream = mediaStream?.getAudioTracks().length ? mediaStream : await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
    this.audio = createPcmAudioCapture({ stream: this.audioStream, onChunk: bytes => this.client.send({ realtimeInput: { audio: { data: toBase64(bytes), mimeType: 'audio/pcm;rate=16000' } } }) });
    // Gemini 3.5 Live Translate is audio-only. Video frame streaming belongs
    // to the future VisualAnalysis feature backed by Gemini 3.8 Live.
    this.onStatus('Đang nghe', 'live');
  }
  stop() { this.audio?.stop(); this.frames?.stop(); this.audioPlayer.stop(); if (this.audioStream?.getAudioTracks().length && !this.video.srcObject) this.audioStream.getTracks().forEach(t => t.stop()); this.client?.close(); this.onStatus('Sẵn sàng', 'idle'); }
  handleMessage(message) {
    if (message.type === 'connected') return this.onStatus('Đang nghe', 'live');
    if (message.type === 'error') return this.onStatus(message.message, 'error');
    const content = message.serverContent; if (!content) return;
    const source = content.inputTranscription?.text || '';
    const translation = content.outputTranscription?.text || (content.modelTurn?.parts || []).map(part => part.text || '').join('');
    for (const part of content.modelTurn?.parts || []) if (part.inlineData?.data) this.audioPlayer.playPcm(part.inlineData.data, part.inlineData.mimeType);
    const complete = Boolean(content.turnComplete);
    this.onCaptions({ source, translation, complete });
  }
}
