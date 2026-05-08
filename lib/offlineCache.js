const DB_NAME = 'safeflow-offline';
const DB_VERSION = 1;

function openDb() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('rams-cache')) db.createObjectStore('rams-cache', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('outbox')) db.createObjectStore('outbox', { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCachedDocument(document) {
  const db = await openDb();
  if (!db || !document?.id) return;
  await new Promise((resolve, reject) => {
    const tx = db.transaction('rams-cache', 'readwrite');
    tx.objectStore('rams-cache').put({ ...document, cached_at: new Date().toISOString() });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadCachedDocuments() {
  const db = await openDb();
  if (!db) return [];
  return new Promise((resolve, reject) => {
    const tx = db.transaction('rams-cache', 'readonly');
    const request = tx.objectStore('rams-cache').getAll();
    request.onsuccess = () => resolve((request.result || []).sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''))).slice(0, 10));
    request.onerror = () => reject(request.error);
  });
}

export async function queueOfflineWrite(url, payload) {
  const db = await openDb();
  if (!db) return;
  await new Promise((resolve, reject) => {
    const tx = db.transaction('outbox', 'readwrite');
    tx.objectStore('outbox').put({ id: `${Date.now()}-${Math.random()}`, url, payload, created_at: new Date().toISOString() });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
