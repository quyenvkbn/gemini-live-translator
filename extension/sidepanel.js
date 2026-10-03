const DEFAULT_BACKEND_URL = 'wss://gemini-live-translator-zv4s.onrender.com/live';
const $ = id => document.getElementById(id);
let socket; let capture; let audioContext; let processor; let sourceNode; let outputContext; let nextOutputTime = 0; let sourceText = ''; let translationText = '';

function status(text, type = '') { $('status').textContent = text; $('status').className = `status ${type}`; }
function normalizeBackendUrl(value) {
  const saved = (value || '').trim();
  if (!saved || /localhost|127\.0\.0\.1/i.test(saved)) return DEFAULT_BACKEND_URL;
  if (/^wss:\/\/gemini-live-translator-zv4s\.onrender\.com\/?$/i.test(saved)) return DEFAULT_BACKEND_URL;
  return saved;
}
function bytesToBase64(bytes) { let binary = ''; for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(binary); }
function pcm16(data) { const output = new Int16Array(data.length); for (let i = 0; i < data.length; i++) output[i] = Math.max(-1, Math.min(1, data[i])) * 32767; return output; }
function playAudio(base64, mimeType = 'audio/pcm;rate=24000') {
  outputContext ||= new AudioContext(); outputContext.resume();
  const binary = atob(base64); const bytes = new Uint8Array(binary.length); for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const samples = new Int16Array(bytes.buffer); const rate = Number(mimeType.match(/rate=(\d+)/)?.[1] || 24000);
  const buffer = outputContext.createBuffer(1, samples.length, rate); const channel = buffer.getChannelData(0); for (let i = 0; i < samples.length; i++) channel[i] = samples[i] / 32768;
  const player = outputContext.createBufferSource(); player.buffer = buffer; player.connect(outputContext.destination); nextOutputTime = Math.max(nextOutputTime, outputContext.currentTime + .02); player.start(nextOutputTime); nextOutputTime += buffer.duration;
}

function handleMessage(message) {
  if (message.type === 'connected') { status('Đang dịch', 'live'); return; }
  if (message.type === 'error') { status(message.message, 'error'); return; }
  const content = message.serverContent; if (!content) return;
  for (const part of content.modelTurn?.parts || []) if (part.inlineData?.data) playAudio(part.inlineData.data, part.inlineData.mimeType);
  sourceText += content.inputTranscription?.text || '';
  translationText += content.outputTranscription?.text || '';
  $('source').textContent = sourceText || 'Đang chờ âm thanh…'; $('translation').textContent = translationText || 'Bản dịch sẽ xuất hiện ở đây…';
  if (content.turnComplete) { sourceText = ''; translationText = ''; }
}

async function start() {
  status('Đang kết nối…', 'live');
  $('start').disabled = true;
  $('stop').disabled = false;
  const backendUrl = normalizeBackendUrl($('backendUrl').value);
  $('backendUrl').value = backendUrl;
  chrome.storage.local.set({ backendUrl });
  if (!backendUrl || !/^wss:\/\//i.test(backendUrl)) throw new Error('Hãy nhập URL backend online dạng wss://.../live. Extension không còn dùng localhost.');
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab?.id) throw new Error('Không xác định được tab hiện tại.');
    if (/^(chrome|edge|about|brave):/i.test(tab.url || '')) throw new Error('Chrome không cho phép lấy âm thanh từ trang hệ thống. Hãy mở YouTube hoặc Facebook.');
    const streamId = await new Promise((resolve, reject) => {
      chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id }, id => {
        const error = chrome.runtime.lastError;
        if (error) reject(new Error(error.message));
        else if (!id) reject(new Error('Chrome không cấp được stream audio cho tab.'));
        else resolve(id);
      });
    });
    capture = await navigator.mediaDevices.getUserMedia({
      audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId } },
      video: false
    });
  } catch (error) {
    throw new Error(`Chrome không lấy được âm thanh tab: ${error?.message || error}`);
  }
  if (!capture?.getAudioTracks().length) throw new Error('Không lấy được audio của tab.');
  socket = new WebSocket(backendUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = () => reject(new Error('Không kết nối được backend Render'));
  });
  socket.onmessage = event => { try { handleMessage(JSON.parse(event.data)); } catch {} };
  socket.onclose = event => status(event.reason || 'Đã ngắt kết nối', 'error');
  audioContext = new AudioContext({ sampleRate: 16000 }); sourceNode = audioContext.createMediaStreamSource(capture);
  processor = audioContext.createScriptProcessor(4096, 1, 1);
  processor.onaudioprocess = event => { const pcm = pcm16(event.inputBuffer.getChannelData(0)); socket?.readyState === WebSocket.OPEN && socket.send(JSON.stringify({ realtimeInput: { audio: { data: bytesToBase64(new Uint8Array(pcm.buffer)), mimeType: 'audio/pcm;rate=16000' } } })); };
  sourceNode.connect(processor); processor.connect(audioContext.destination); $('start').disabled = true; $('stop').disabled = false; status('Đang dịch', 'live');
}
function stop(resetStatus = true) { processor?.disconnect(); sourceNode?.disconnect(); audioContext?.close(); outputContext?.close(); outputContext = null; nextOutputTime = 0; capture?.getTracks().forEach(track => track.stop()); socket?.close(); socket = capture = null; $('start').disabled = false; $('stop').disabled = true; if (resetStatus) status('Sẵn sàng'); }
$('start').onclick = () => start().catch(error => { stop(false); status(error.message, 'error'); }); $('stop').onclick = stop;
chrome.storage.local.get(['backendUrl'], value => {
  const saved = value.backendUrl || '';
  const backendUrl = normalizeBackendUrl(saved);
  $('backendUrl').value = backendUrl;
  if (backendUrl !== saved) chrome.storage.local.set({ backendUrl });
});
$('backendUrl').onchange = () => chrome.storage.local.set({ backendUrl: $('backendUrl').value.trim() });
