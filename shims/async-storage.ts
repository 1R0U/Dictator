const memory = new Map<string, string>();

function storage() {
  try { return typeof window !== 'undefined' ? window.localStorage : null; }
  catch { return null; }
}

const AsyncStorage = {
  async getItem(key: string) {
    try { return storage()?.getItem(key) ?? memory.get(key) ?? null; }
    catch { return memory.get(key) ?? null; }
  },
  async setItem(key: string, value: string) {
    const target = storage();
    try { target?.setItem(key, value); } catch { /* use memory fallback */ }
    memory.set(key, value);
  },
  async removeItem(key: string) {
    try { storage()?.removeItem(key); } catch { /* memory is still cleared */ }
    memory.delete(key);
  },
};

export default AsyncStorage;
