// Memory fallback store when localStorage is blocked (e.g., inside cross-origin iframe with third-party cookie blocking)
const memoryStorage: Record<string, string> = {};

let isLocalStorageAvailable = false;
try {
  const testKey = '__storage_test__';
  window.localStorage.setItem(testKey, testKey);
  window.localStorage.removeItem(testKey);
  isLocalStorageAvailable = true;
} catch (e) {
  isLocalStorageAvailable = false;
}

export const safeStorage = {
  getItem(key: string): string | null {
    if (isLocalStorageAvailable) {
      try {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      } catch (e) {
        // Fallback to memory
      }
    }
    return memoryStorage[key] !== undefined ? memoryStorage[key] : null;
  },

  async getItemAsync(key: string): Promise<string | null> {
    const syncVal = this.getItem(key);
    if (syncVal) return syncVal;
    try {
      const idbVal = await largeMediaStorage.get(key);
      if (idbVal) {
        memoryStorage[key] = idbVal;
        return idbVal;
      }
    } catch (err) {}
    return null;
  },

  setItem(key: string, value: string): void {
    const strVal = String(value);
    memoryStorage[key] = strVal;

    if (isLocalStorageAvailable) {
      try {
        window.localStorage.setItem(key, strVal);
      } catch (e) {
        // Fallback to memory & IDB on quota or restriction
      }
    }
    largeMediaStorage.save(key, strVal).catch(() => {});
  },

  removeItem(key: string): void {
    delete memoryStorage[key];
    if (isLocalStorageAvailable) {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {}
    }
    largeMediaStorage.remove(key).catch(() => {});
  },

  clear(): void {
    if (isLocalStorageAvailable) {
      try {
        window.localStorage.clear();
        return;
      } catch (e) {
        // Fallback to memory
      }
    }
    for (const key in memoryStorage) {
      delete memoryStorage[key];
    }
  }
};

export const largeMediaStorage = {
  save(key: string, value: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('LuypayMediaDB', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('media')) {
          db.createObjectStore('media');
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('media', 'readwrite');
        const store = tx.objectStore('media');
        store.put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    });
  },

  get(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('LuypayMediaDB', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('media')) {
          db.createObjectStore('media');
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('media', 'readonly');
        const store = tx.objectStore('media');
        const getReq = store.get(key);
        getReq.onsuccess = () => resolve(getReq.result || null);
        getReq.onerror = () => reject(getReq.error);
      };
      request.onerror = () => reject(request.error);
    });
  },

  remove(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('LuypayMediaDB', 1);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('media', 'readwrite');
        const store = tx.objectStore('media');
        store.delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    });
  }
};
