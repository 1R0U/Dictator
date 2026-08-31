const memory = new Map<string, string>();

function storage() {
  return typeof window !== 'undefined' ? window.localStorage : null;
}

const AsyncStorage = {
  async getItem(key: string) {
    return storage()?.getItem(key) ?? memory.get(key) ?? null;
  },
  async setItem(key: string, value: string) {
    const target = storage();
    if (target) target.setItem(key, value);
    else memory.set(key, value);
  },
  async removeItem(key: string) {
    storage()?.removeItem(key);
    memory.delete(key);
  },
};

export default AsyncStorage;
