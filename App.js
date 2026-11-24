import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { BRANDS, createDriver } from './src/tvs';
import { scanNetwork } from './src/scan';
import { loadTvs, saveTv, removeTv } from './src/storage';

const C = {
  bg: '#0e1116', card: '#1a1f27', btn: '#262d38', accent: '#4f8cff',
  text: '#f2f4f8', dim: '#8b95a5', red: '#e5484d',
};

function Btn({ label, onPress, style, textStyle, flex }) {
  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); onPress(); }}
      style={({ pressed }) => [s.btn, flex && { flex: 1 }, style, pressed && { opacity: 0.6 }]}
    >
      <Text style={[s.btnText, textStyle]}>{label}</Text>
    </Pressable>
  );
}

function Remote({ tv, onBack, onToken }) {
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState('');
  const driver = useRef(null);

  useEffect(() => {
    let alive = true;
    const d = createDriver(tv.brand, tv.ip, tv, (token) => onToken(token));
    driver.current = d;
    d.connect()
      .then(() => alive && setStatus('ok'))
      .catch((e) => { if (alive) { setError(e.message); setStatus('error'); } });
    return () => { alive = false; d.close(); };
  }, []);

  const send = (k) => driver.current && driver.current.send(k).catch(() => {});

  if (status === 'connecting') {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={s.title}>Conectando con {tv.name}…</Text>
        {tv.brand !== 'Roku' && (
          <Text style={s.dim}>Si aparece un aviso en el televisor, acéptalo con su control.</Text>
        )}
      </View>
    );
  }
  if (status === 'error') {
    return (
      <View style={s.center}>
        <Text style={s.title}>No se pudo conectar</Text>
        <Text style={s.dim}>{error}</Text>
        <Btn label="Volver" onPress={onBack} style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.remote}>
      <View style={s.row}>
        <Btn label="‹ TVs" onPress={onBack} />
        <Text style={s.small}>{tv.name}</Text>
        <Btn label="⏻" onPress={() => send('POWER')} style={{ backgroundColor: C.red }} />
      </View>

      <View style={s.dpad}>
        <View style={s.row}><Btn label="▲" onPress={() => send('UP')} style={s.round} /></View>
        <View style={s.row}>
          <Btn label="◀" onPress={() => send('LEFT')} style={s.round} />
          <Btn label="OK" onPress={() => send('OK')} style={[s.round, { backgroundColor: C.accent }]} />
          <Btn label="▶" onPress={() => send('RIGHT')} style={s.round} />
        </View>
        <View style={s.row}><Btn label="▼" onPress={() => send('DOWN')} style={s.round} /></View>
      </View>

      <View style={s.row}>
        <Btn label="↩ Atrás" onPress={() => send('BACK')} flex />
        <Btn label="⌂ Inicio" onPress={() => send('HOME')} flex />
      </View>

      <View style={s.row}>
        <View style={s.col}>
          <Text style={s.dim}>Volumen</Text>
          <Btn label="＋" onPress={() => send('VOL_UP')} />
          <Btn label="Silencio" onPress={() => send('MUTE')} />
          <Btn label="－" onPress={() => send('VOL_DOWN')} />
        </View>
        <View style={s.col}>
          <Text style={s.dim}>Canal</Text>
          <Btn label="＋" onPress={() => send('CH_UP')} />
          <View style={{ height: 52 }} />
          <Btn label="－" onPress={() => send('CH_DOWN')} />
        </View>
      </View>
    </ScrollView>
  );
}

export default function App() {
  const [tvs, setTvs] = useState([]);
  const [current, setCurrent] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [found, setFound] = useState([]);
  const [brand, setBrand] = useState('Roku');
  const [ip, setIp] = useState('');

  useEffect(() => { loadTvs().then(setTvs); }, []);

  async function scan() {
    setScanning(true); setFound([]); setProgress(0);
    try {
      const res = await scanNetwork(setProgress);
      setFound(res);
      if (!res.length) Alert.alert('No se encontró ningún televisor', 'Revisa que el teléfono y el televisor estén en la misma red Wi-Fi, o agrégalo con su IP.');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setScanning(false);
  }

  async function open(tv) {
    const list = await saveTv(tv);
    setTvs(list);
    setCurrent(tv);
  }

  function addManual() {
    const clean = ip.trim();
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(clean)) {
      Alert.alert('IP no válida', 'Escribe algo como 192.168.1.50');
      return;
    }
    open({ brand, ip: clean, name: `${brand} ${clean}` });
  }

  async function onToken(token) {
    if (!current) return;
    const updated = { ...current, token };
    setCurrent(updated);
    setTvs(await saveTv(updated));
  }

  if (current) {
    return (
      <SafeAreaView style={s.screen}>
        <StatusBar style="light" />
        <Remote tv={current} onBack={() => setCurrent(null)} onToken={onToken} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.screen}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.home}>
        <Text style={s.h1}>Control TV</Text>

        {tvs.length > 0 && (
          <>
            <Text style={s.h2}>Mis televisores</Text>
            {tvs.map((tv) => (
              <View key={tv.brand + tv.ip} style={s.item}>
                <Pressable style={{ flex: 1 }} onPress={() => open(tv)}>
                  <Text style={s.title}>{tv.name}</Text>
                  <Text style={s.dim}>{tv.brand} · {tv.ip}</Text>
                </Pressable>
                <Pressable onPress={async () => setTvs(await removeTv(tv))}>
                  <Text style={[s.dim, { fontSize: 20, padding: 8 }]}>✕</Text>
                </Pressable>
              </View>
            ))}
          </>
        )}

        <Text style={s.h2}>Buscar en mi Wi-Fi</Text>
        <Btn label={scanning ? `Buscando… ${Math.round(progress * 100)}%` : 'Buscar televisores'} onPress={scan} style={{ backgroundColor: C.accent }} />
        {found.map((tv) => (
          <Pressable key={tv.brand + tv.ip} style={s.item} onPress={() => open(tv)}>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{tv.name}</Text>
              <Text style={s.dim}>Toca para conectar</Text>
            </View>
          </Pressable>
        ))}

        <Text style={s.h2}>Agregar con IP</Text>
        <View style={s.row}>
          {BRANDS.map((b) => (
            <Btn key={b} label={b} flex onPress={() => setBrand(b)}
              style={brand === b && { backgroundColor: C.accent }} />
          ))}
        </View>
        <TextInput
          style={s.input} value={ip} onChangeText={setIp}
          placeholder="192.168.1.50" placeholderTextColor={C.dim}
          keyboardType="numbers-and-punctuation" autoCorrect={false}
        />
        <Btn label="Conectar" onPress={addManual} />
        <Text style={[s.dim, { marginTop: 16 }]}>
          La IP del televisor está en sus ajustes de red o en la lista de dispositivos de tu router.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  home: { padding: 20, paddingTop: 48, gap: 12 },
  remote: { padding: 20, paddingTop: 48, gap: 18 },
  h1: { color: C.text, fontSize: 30, fontWeight: '700' },
  h2: { color: C.dim, fontSize: 14, fontWeight: '600', marginTop: 12, textTransform: 'uppercase' },
  title: { color: C.text, fontSize: 17, fontWeight: '600' },
  small: { color: C.text, fontSize: 15 },
  dim: { color: C.dim, fontSize: 14, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  col: { flex: 1, gap: 10, alignItems: 'stretch' },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, padding: 14 },
  btn: { backgroundColor: C.btn, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: C.text, fontSize: 17, fontWeight: '600' },
  round: { width: 84, height: 84, borderRadius: 42, paddingHorizontal: 0, paddingVertical: 0 },
  dpad: { alignItems: 'center', gap: 10, backgroundColor: C.card, borderRadius: 28, padding: 18 },
  input: { backgroundColor: C.card, color: C.text, borderRadius: 14, padding: 14, fontSize: 17 },
});
