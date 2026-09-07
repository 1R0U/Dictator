const memory = new Map<string, string | null>();

function storage() {
  try { return typeof window !== 'undefined' ? window.localStorage : null; }
  catch { return null; }
}

const AsyncStorage = {
  async getItem(key: string) {
    if (memory.has(key)) return memory.get(key) ?? null;
    try { return storage()?.getItem(key) ?? null; }
    catch { return memory.get(key) ?? null; }
  },
  async setItem(key: string, value: string) {
    const target = storage();
    try { target?.setItem(key, value); } catch { /* use memory fallback */ }
    memory.set(key, value);
  },
  async removeItem(key: string) {
    try { storage()?.removeItem(key); } catch { /* memory is still cleared */ }
    memory.set(key, null);
  },
};

export default AsyncStorage;
