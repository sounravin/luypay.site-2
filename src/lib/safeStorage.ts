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
        return window.localStorage.getItem(key);
      } catch (e) {
        // Fallback to memory
      }
    }
    return memoryStorage[key] !== undefined ? memoryStorage[key] : null;
  },

  setItem(key: string, value: string): void {
    if (isLocalStorageAvailable) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch (e) {
        // Fallback to memory
      }
    }
    memoryStorage[key] = String(value);
  },

  removeItem(key: string): void {
    if (isLocalStorageAvailable) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch (e) {
        // Fallback to memory
      }
    }
    delete memoryStorage[key];
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
