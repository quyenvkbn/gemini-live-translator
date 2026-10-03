export function createPcmAudioCapture({ stream, onChunk }) {
  const audioContext = new AudioContext({ sampleRate: 16000 });
  const source = audioContext.createMediaStreamSource(stream);
  const processor = audioContext.createScriptProcessor(4096, 1, 1);
  processor.onaudioprocess = (event) => {
    const input = event.inputBuffer.getChannelData(0);
    const pcm = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) pcm[i] = Math.max(-1, Math.min(1, input[i])) * 0x7fff;
    onChunk(new Uint8Array(pcm.buffer));
  };
  source.connect(processor); processor.connect(audioContext.destination);
  return { stop: () => { processor.disconnect(); audioContext.close(); } };
}
