// Samsung (Tizen): WebSocket en el puerto 8001 (ws) o 8002 (wss).
// La primera vez el televisor muestra un aviso "Permitir"; hay que aceptarlo con el control físico.
const KEYS = {
  UP: 'KEY_UP', DOWN: 'KEY_DOWN', LEFT: 'KEY_LEFT', RIGHT: 'KEY_RIGHT', OK: 'KEY_ENTER',
  BACK: 'KEY_RETURN', HOME: 'KEY_HOME', VOL_UP: 'KEY_VOLUP', VOL_DOWN: 'KEY_VOLDOWN',
  MUTE: 'KEY_MUTE', CH_UP: 'KEY_CHUP', CH_DOWN: 'KEY_CHDOWN', POWER: 'KEY_POWER',
};

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function toBase64(str) {
  let out = '';
  for (let i = 0; i < str.length; i += 3) {
    const a = str.charCodeAt(i), b = str.charCodeAt(i + 1), c = str.charCodeAt(i + 2);
    out += B64[a >> 2] + B64[((a & 3) << 4) | ((b || 0) >> 4)];
    out += isNaN(b) ? '=' : B64[((b & 15) << 2) | ((c || 0) >> 6)];
    out += isNaN(c) ? '=' : B64[c & 63];
  }
  return out;
}

export function createSamsung(ip, saved = {}, onToken = () => {}) {
  let ws = null;
  let token = saved.token || null;

  function open(url) {
    return new Promise((resolve, reject) => {
      const sock = new WebSocket(url);
      const timer = setTimeout(() => {
        try { sock.close(); } catch (e) {}
        reject(new Error('Tiempo agotado. Acepta el aviso en el televisor.'));
      }, 20000);
      sock.onmessage = (ev) => {
        let m;
        try { m = JSON.parse(ev.data); } catch (e) { return; }
        if (m.event === 'ms.channel.connect') {
          clearTimeout(timer);
          if (m.data && m.data.token) { token = m.data.token; onToken(token); }
          resolve(sock);
        } else if (m.event === 'ms.error') {
          clearTimeout(timer);
          reject(new Error('El televisor rechazó la conexión'));
        }
      };
      sock.onerror = () => { clearTimeout(timer); reject(new Error('No se pudo conectar')); };
    });
  }

  return {
    brand: 'Samsung',
    async connect() {
      const name = toBase64('ControlTV');
      const tk = token ? `&token=${token}` : '';
      const urls = [
        `ws://${ip}:8001/api/v2/channels/samsung.remote.control?name=${name}${tk}`,
        `wss://${ip}:8002/api/v2/channels/samsung.remote.control?name=${name}${tk}`,
      ];
      let lastErr;
      for (const u of urls) {
        try { ws = await open(u); return; } catch (e) { lastErr = e; }
      }
      throw lastErr || new Error('No se pudo conectar');
    },
    async send(key) {
      const k = KEYS[key];
      if (!k || !ws) return;
      ws.send(JSON.stringify({
        method: 'ms.remote.control',
        params: { Cmd: 'Click', DataOfCmd: k, Option: 'false', TypeOfRemote: 'SendRemoteKey' },
      }));
    },
    close() { try { ws && ws.close(); } catch (e) {} ws = null; },
  };
}
