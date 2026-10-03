export class GeminiLiveClient {
  constructor({ onMessage, onClose }) { this.onMessage = onMessage; this.onClose = onClose; }
  connect() {
    return new Promise((resolve, reject) => {
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.socket = new WebSocket(`${protocol}//${location.host}/live`);
      this.socket.onopen = resolve; this.socket.onerror = () => reject(new Error('Không thể kết nối server'));
      this.socket.onclose = event => this.onClose?.(event); this.socket.onmessage = event => { try { this.onMessage(JSON.parse(event.data)); } catch {} };
    });
  }
  send(message) { if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(message)); }
  close() { this.socket?.close(); this.socket = null; }
}
