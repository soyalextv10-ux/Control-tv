import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'control-tv:tvs';

export async function loadTvs() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export async function saveTv(tv) {
  const list = await loadTvs();
  const next = [tv, ...list.filter((x) => !(x.ip === tv.ip && x.brand === tv.brand))];
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function removeTv(tv) {
  const list = await loadTvs();
  const next = list.filter((x) => !(x.ip === tv.ip && x.brand === tv.brand));
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
