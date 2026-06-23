/* storage.js
Client-side persistent storage for My-loan (IndexedDB with localStorage fallback).
Expose: window.Storage with methods: init, loadAllLoans, saveAllLoans, addLoan, updateLoan, deleteLoan, clearAll, exportData, importDataFromFile, enableAutoSave
*/
(function(exports){
  const DB_NAME = 'my_loan_db';
  const DB_VERSION = 1;
  const STORE_NAME = 'loans';
  const FALLBACK_KEY = 'my_loan_data_v1';
  let db = null;

  function openDB() {
    return new Promise((resolve, reject) => {
      if (db) return resolve(db);
      if (!('indexedDB' in window)) return resolve(null);
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const _db = e.target.result;
        if (!_db.objectStoreNames.contains(STORE_NAME)) {
          const store = _db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
      req.onsuccess = (e) => {
        db = e.target.result;
        resolve(db);
      };
      req.onerror = (e) => reject(e.target.error);
      req.onblocked = () => console.warn('IDB open blocked');
    });
  }

  function readFallback() {
    try {
      const raw = localStorage.getItem(FALLBACK_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Fallback read error', e);
      return [];
    }
  }
  function writeFallback(data) {
    try {
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('Fallback write error', e);
      return false;
    }
  }

  function generateId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
  }

  async function init() {
    await openDB().catch(()=>null);
    const current = await loadAllLoans();
    if ((!current || current.length === 0) && localStorage.getItem(FALLBACK_KEY)) {
      const fallback = readFallback();
      if (fallback && fallback.length) {
        await saveAllLoans(fallback);
      }
    }
    const loans = await loadAllLoans();
    window.loans = loans || [];
    return loans;
  }

  async function loadAllLoans() {
    const _db = await openDB().catch(()=>null);
    if (!_db) return readFallback();
    return new Promise((resolve, reject) => {
      const tx = _db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => { console.warn('IDB read error', e); resolve(readFallback()); };
    });
  }

  async function saveAllLoans(loans) {
    const _db = await openDB().catch(()=>null);
    if (!_db) { writeFallback(loans); return { ok:true, method:'localStorage' }; }
    return new Promise((resolve, reject) => {
      const tx = _db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const clearReq = store.clear();
      clearReq.onsuccess = () => {
        try {
          for (const item of loans) {
            if (!item.id) item.id = generateId();
            store.put(item);
          }
        } catch (err) { reject(err); }
      };
      clearReq.onerror = (e) => { console.warn('IDB clear error', e); writeFallback(loans); resolve({ok:true,method:'localStorage'}); };
      tx.oncomplete = () => { try{ writeFallback(loans); }catch(e){} resolve({ok:true,method:'indexeddb'}); };
      tx.onerror = (e) => { console.warn('IDB tx error', e); writeFallback(loans); resolve({ok:true,method:'localStorage'}); };
    });
  }

  async function addLoan(loan) {
    if (!loan) throw new Error('loan required');
    if (!loan.id) loan.id = generateId();
    if (!loan.createdAt) loan.createdAt = new Date().toISOString();
    const _db = await openDB().catch(()=>null);
    if (!_db) { const arr = readFallback(); arr.push(loan); writeFallback(arr); window.loans = arr; return loan; }
    return new Promise((resolve, reject) => {
      const tx = _db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.add(loan);
      req.onsuccess = () => { loadAllLoans().then(arr=>{ writeFallback(arr); window.loans = arr; }).catch(()=>{}); resolve(loan); };
      req.onerror = () => { store.put(loan).onsuccess = () => { loadAllLoans().then(arr=>{ writeFallback(arr); window.loans = arr; }).catch(()=>{}); resolve(loan); }; };
    });
  }

  async function updateLoan(loan) {
    if (!loan || !loan.id) throw new Error('loan with id required');
    const _db = await openDB().catch(()=>null);
    if (!_db) { const arr = readFallback().map(x => x.id === loan.id ? loan : x); writeFallback(arr); window.loans = arr; return loan; }
    return new Promise((resolve, reject) => {
      const tx = _db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(loan);
      req.onsuccess = () => { loadAllLoans().then(arr=>{ writeFallback(arr); window.loans = arr; }).catch(()=>{}); resolve(loan); };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async function deleteLoan(id) {
    if (!id) throw new Error('id required');
    const _db = await openDB().catch(()=>null);
    if (!_db) { const arr = readFallback().filter(x => x.id !== id); writeFallback(arr); window.loans = arr; return {ok:true}; }
    return new Promise((resolve, reject) => {
      const tx = _db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => { loadAllLoans().then(arr=>{ writeFallback(arr); window.loans = arr; }).catch(()=>{}); resolve({ok:true}); };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async function clearAll() {
    const _db = await openDB().catch(()=>null);
    if (!_db) { localStorage.removeItem(FALLBACK_KEY); window.loans = []; return {ok:true}; }
    return new Promise((resolve, reject) => {
      const tx = _db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => { localStorage.removeItem(FALLBACK_KEY); window.loans = []; resolve({ok:true}); };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async function exportData(filename = 'my-loans-backup.json') {
    const loans = await loadAllLoans();
    const blob = new Blob([JSON.stringify(loans, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),5000);
  }

  async function importDataFromFile(file) {
    if (!file) throw new Error('file required');
    const text = await file.text();
    let parsed;
    try { parsed = JSON.parse(text); if (!Array.isArray(parsed)) throw new Error('Expected an array'); } catch (e) { throw new Error('Invalid JSON file: '+e.message); }
    for (const item of parsed) { if (!item.id) item.id = generateId(); }
    await saveAllLoans(parsed);
    window.loans = parsed;
    if (typeof window.renderLoans === 'function') window.renderLoans();
    return { ok:true, imported: parsed.length };
  }

  function enableAutoSave(opts = {}) {
    const intervalMs = opts.intervalMs || 30000;
    let timer = null;
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'hidden') {
        try { if (Array.isArray(window.loans)) await saveAllLoans(window.loans); } catch (e){}
      }
    });
    if (intervalMs > 0) {
      timer = setInterval(async () => { try { if (Array.isArray(window.loans)) await saveAllLoans(window.loans); } catch (e){} }, intervalMs);
    }
    return () => { if (timer) clearInterval(timer); };
  }

  const API = {
    init,
    loadAllLoans,
    saveAllLoans,
    addLoan,
    updateLoan,
    deleteLoan,
    clearAll,
    exportData,
    importDataFromFile,
    enableAutoSave,
  };

  exports.Storage = API;
  // auto-init
  (async function(){ try{ await API.init(); API.enableAutoSave({ intervalMs: 30000 }); }catch(e){ console.error('Storage init error', e); }})();

})(window);
