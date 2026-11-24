// LG webOS: WebSocket SSAP en el puerto 3000 (ws) o 3001 (wss).
// La primera vez el televisor pide aceptar la conexión; la clave se guarda para la próxima.
const BUTTONS = { UP: 'UP', DOWN: 'DOWN', LEFT: 'LEFT', RIGHT: 'RIGHT', OK: 'ENTER', BACK: 'BACK', HOME: 'HOME' };
const URIS = {
  VOL_UP: 'ssap://audio/volumeUp',
  VOL_DOWN: 'ssap://audio/volumeDown',
  CH_UP: 'ssap://tv/channelUp',
  CH_DOWN: 'ssap://tv/channelDown',
  POWER: 'ssap://system/turnOff',
};

export function createLG(ip, saved = {}, onToken = () => {}) {
  let ws = null;
  let pointer = null;
  let clientKey = saved.token || null;
  let muted = false;
  let counter = 0;
  const waiting = {};

  function open(url) {
    return new Promise((resolve, reject) => {
      const sock = new WebSocket(url);
      const timer = setTimeout(() => {
        try { sock.close(); } catch (e) {}
        reject(new Error('Tiempo agotado. Acepta el aviso en el televisor.'));
      }, 30000);
      sock.onopen = () => {
        sock.send(JSON.stringify({
          type: 'register', id: 'register_0',
          payload: {
            forcePairing: false, pairingType: 'PROMPT',
            ...(clientKey ? { 'client-key': clientKey } : {}),
            manifest: {
              manifestVersion: 1,
              permissions: ['LAUNCH', 'CONTROL_AUDIO', 'CONTROL_POWER', 'CONTROL_INPUT_TV',
                'CONTROL_MOUSE_AND_KEYBOARD', 'CONTROL_INPUT_TEXT', 'READ_INSTALLED_APPS'],
            },
          },
        }));
      };
      sock.onmessage = (ev) => {
        let m;
        try { m = JSON.parse(ev.data); } catch (e) { return; }
        if (m.type === 'registered') {
          clearTimeout(timer);
          if (m.payload && m.payload['client-key']) { clientKey = m.payload['client-key']; onToken(clientKey); }
          resolve(sock);
        } else if (m.type === 'error' && m.id === 'register_0') {
          clearTimeout(timer);
          reject(new Error('El televisor rechazó la conexión'));
        } else if (m.id && waiting[m.id]) {
          waiting[m.id](m);
          delete waiting[m.id];
        }
      };
      sock.onerror = () => { clearTimeout(timer); reject(new Error('No se pudo conectar')); };
    });
  }

  function request(uri, payload) {
    return new Promise((resolve) => {
      const id = 'req_' + (++counter);
      waiting[id] = resolve;
      ws.send(JSON.stringify({ type: 'request', id, uri, ...(payload ? { payload } : {}) }));
      setTimeout(() => { if (waiting[id]) { delete waiting[id]; resolve(null); } }, 5000);
    });
  }

  async function ensurePointer() {
    if (pointer && pointer.readyState === 1) return pointer;
    const res = await request('ssap://com.webos.service.networkinput/getPointerInputSocket');
    const path = res && res.payload && res.payload.socketPath;
    if (!path) throw new Error('No se pudo abrir el control de botones');
    pointer = await new Promise((resolve, reject) => {
      const s = new WebSocket(path);
      s.onopen = () => resolve(s);
      s.onerror = () => reject(new Error('Error en el control de botones'));
    });
    return pointer;
  }

  return {
    brand: 'LG',
    async connect() {
      const urls = [`ws://${ip}:3000`, `wss://${ip}:3001`];
      let lastErr;
      for (const u of urls) {
        try { ws = await open(u); return; } catch (e) { lastErr = e; }
      }
      throw lastErr || new Error('No se pudo conectar');
    },
    async send(key) {
      if (!ws) return;
      if (key === 'MUTE') {
        muted = !muted;
        await request('ssap://audio/setMute', { mute: muted });
        return;
      }
      if (URIS[key]) { await request(URIS[key]); return; }
      if (BUTTONS[key]) {
        const p = await ensurePointer();
        p.send(`type:button\nname:${BUTTONS[key]}\n\n`);
      }
    },
    close() {
      try { pointer && pointer.close(); } catch (e) {}
      try { ws && ws.close(); } catch (e) {}
      ws = null; pointer = null;
    },
  };
}
