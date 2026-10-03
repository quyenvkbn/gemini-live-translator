export function createVideoFrameCapture({ video, canvas, onFrame }) {
  const timer = setInterval(() => {
    if (!video.videoWidth) return;
    canvas.width = 640; canvas.height = Math.round(640 * video.videoHeight / video.videoWidth);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => blob?.arrayBuffer().then(buffer => onFrame(new Uint8Array(buffer))), 'image/jpeg', .65);
  }, 1000);
  return { stop: () => clearInterval(timer) };
}
