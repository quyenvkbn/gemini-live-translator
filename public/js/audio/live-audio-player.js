const decodeBase64 = value => {
  const binary = atob(value); const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

export class LiveAudioPlayer {
  constructor() { this.context = null; this.nextTime = 0; }
  start() { this.context ||= new AudioContext(); this.context.resume(); }
  playPcm(base64, mimeType = 'audio/pcm;rate=24000') {
    this.start();
    const rate = Number(mimeType.match(/rate=(\d+)/)?.[1] || 24000);
    const bytes = decodeBase64(base64); const samples = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
    const buffer = this.context.createBuffer(1, samples.length, rate); const channel = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) channel[i] = samples[i] / 32768;
    const source = this.context.createBufferSource(); source.buffer = buffer; source.connect(this.context.destination);
    this.nextTime = Math.max(this.nextTime, this.context.currentTime + 0.02); source.start(this.nextTime); this.nextTime += buffer.duration;
  }
  stop() { this.nextTime = 0; this.context?.close(); this.context = null; }
}
