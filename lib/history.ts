import { EvaluationSession } from "./evaluation";

const DB_NAME = "image-model-bench";
const STORE_NAME = "sessions";
const DB_VERSION = 1;

const openDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const transact = async <T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
) => {
  const database = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = action(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
};

export const saveSession = (session: EvaluationSession) =>
  transact("readwrite", (store) => store.put(session));

export const listSessions = async () => {
  const sessions = await transact<EvaluationSession[]>("readonly", (store) =>
    store.getAll(),
  );
  return sessions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const clearSessions = () =>
  transact("readwrite", (store) => store.clear());

// ponytail: IndexedDB is intentionally local and quota-bound; migrate this
// adapter to Postgres + object storage when shared accounts are introduced.
