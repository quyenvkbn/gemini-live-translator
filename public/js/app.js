import { ParallelTranslation } from './features/parallel-translation.js';

const $ = id => document.getElementById(id);
const video = $('video'); const stage = document.querySelector('.stage'); const canvas = $('frameCanvas');
const status = $('status'); const sourceCaption = $('sourceCaption'); const translatedCaption = $('translatedCaption');
let translator; let sourceBuffer = ''; let translationBuffer = '';
function setStatus(text, type = 'idle') { status.textContent = text; status.className = `status ${type}`; }
const updateCaptions = ({ source, translation, complete }) => { sourceBuffer += source; translationBuffer += translation; sourceCaption.textContent = sourceBuffer || 'Đang chờ âm thanh…'; translatedCaption.textContent = translationBuffer || 'Bản dịch sẽ xuất hiện ở đây…'; if (complete) { sourceBuffer = ''; translationBuffer = ''; } };
fetch('/health').then(response => response.json()).then(health => {
  if (!health.apiKeyConfigured) setStatus('Chưa cấu hình GEMINI_API_KEY', 'error');
}).catch(() => setStatus('Không kết nối được backend', 'error'));

$('videoFile').onchange = event => { const file = event.target.files[0]; if (!file) return; video.src = URL.createObjectURL(file); stage.classList.add('has-video'); video.play().catch(() => {}); };
$('micButton').onclick = async () => { if (translator) { translator.stop(); translator = null; $('micButton').textContent = '● Bắt đầu nghe'; return; } try { translator = new ParallelTranslation({ video, canvas, onStatus: setStatus, onCaptions: updateCaptions }); await translator.start(); $('micButton').textContent = '■ Dừng nghe'; } catch (error) { setStatus(error.message, 'error'); translator?.stop(); translator = null; } };
$('cameraButton').onclick = async () => { try { const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); video.srcObject = stream; stage.classList.add('has-video'); await video.play(); $('micButton').click(); } catch (error) { setStatus(error.message, 'error'); } };
$('tabButton').onclick = async () => {
  try {
    if (translator) { translator.stop(); translator = null; $('micButton').textContent = '● Bắt đầu nghe'; }
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    if (!stream.getAudioTracks().length) {
      stream.getTracks().forEach(track => track.stop());
      throw new Error('Tab chưa chia sẻ âm thanh. Hãy chọn tab YouTube và bật “Chia sẻ âm thanh”.');
    }
    video.srcObject = stream; stage.classList.add('has-video'); await video.play();
    stream.getVideoTracks()[0].addEventListener('ended', () => translator?.stop());
    if (!translator) $('micButton').click();
  } catch (error) { if (error.name !== 'AbortError') setStatus(error.message, 'error'); }
};
$('clearButton').onclick = () => { sourceBuffer = ''; translationBuffer = ''; sourceCaption.textContent = 'Đang chờ âm thanh…'; translatedCaption.textContent = 'Bản dịch sẽ xuất hiện ở đây…'; };
$('targetLanguage').onchange = event => translator?.client.send({ clientContent: { turns: [{ role: 'user', parts: [{ text: `Từ bây giờ hãy dịch sang ${event.target.value}.` }] }], turnComplete: true } });
