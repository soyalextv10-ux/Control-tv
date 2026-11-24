// Roku: control por HTTP (ECP), puerto 8060. No requiere emparejar.
const KEYS = {
  UP: 'Up', DOWN: 'Down', LEFT: 'Left', RIGHT: 'Right', OK: 'Select',
  BACK: 'Back', HOME: 'Home', VOL_UP: 'VolumeUp', VOL_DOWN: 'VolumeDown',
  MUTE: 'VolumeMute', CH_UP: 'ChannelUp', CH_DOWN: 'ChannelDown', POWER: 'PowerOff',
};

export function createRoku(ip) {
  return {
    brand: 'Roku',
    async connect() {
      const r = await fetch(`http://${ip}:8060/query/device-info`);
      if (!r.ok) throw new Error('No responde el Roku');
    },
    async send(key) {
      const k = KEYS[key];
      if (!k) return;
      await fetch(`http://${ip}:8060/keypress/${k}`, { method: 'POST' });
    },
    close() {},
  };
}
