import * as Network from 'expo-network';

function probe(url, ms = 1200) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal })
    .then((r) => { clearTimeout(t); return r; })
    .catch(() => { clearTimeout(t); return null; });
}

async function check(ip) {
  const found = [];
  const [roku, samsung, lg] = await Promise.all([
    probe(`http://${ip}:8060/query/device-info`),
    probe(`http://${ip}:8001/api/v2/`),
    probe(`http://${ip}:3000/`),
  ]);
  if (roku && roku.ok) found.push({ brand: 'Roku', ip, name: 'Roku ' + ip });
  if (samsung && samsung.ok) found.push({ brand: 'Samsung', ip, name: 'Samsung ' + ip });
  if (lg && !roku && !samsung) found.push({ brand: 'LG', ip, name: 'LG (posible) ' + ip });
  return found;
}

// Busca televisores en la misma red Wi-Fi (rango /24 del teléfono).
export async function scanNetwork(onProgress = () => {}) {
  const myIp = await Network.getIpAddressAsync();
  const parts = (myIp || '').split('.');
  if (parts.length !== 4) throw new Error('No hay conexión Wi-Fi');
  const prefix = parts.slice(0, 3).join('.');
  const results = [];
  const batch = 40;
  for (let start = 1; start <= 254; start += batch) {
    const ips = [];
    for (let i = start; i < start + batch && i <= 254; i++) ips.push(`${prefix}.${i}`);
    const found = await Promise.all(ips.map(check));
    found.forEach((f) => results.push(...f));
    onProgress(Math.min(start + batch - 1, 254) / 254);
  }
  return results;
         }
