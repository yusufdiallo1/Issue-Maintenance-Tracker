"use client";

// Offline outbox: queues writes in IndexedDB when offline (or when an online
// write fails) and flushes them automatically when connectivity returns.
// Each op has a client-generated UUID so a retry can never double-apply.
import { openDB, type IDBPDatabase } from "idb";

export type OutboxKind = "create" | "take" | "done" | "reopen" | "deadline";

export type OutboxOp = {
  id: string; // client UUID — idempotency key
  kind: OutboxKind;
  payload: Record<string, unknown>;
  // For create-report: compressed photo blobs to upload on sync.
  photos?: Blob[];
  createdAt: number;
  tries: number;
};

const DB_NAME = "aurion-outbox";
const STORE = "ops";

let dbp: Promise<IDBPDatabase> | null = null;
function db() {
  if (!dbp) {
    dbp = openDB(DB_NAME, 1, {
      upgrade(d) {
        if (!d.objectStoreNames.contains(STORE)) {
          d.createObjectStore(STORE, { keyPath: "id" });
        }
      },
    });
  }
  return dbp;
}

export function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function enqueue(op: Omit<OutboxOp, "createdAt" | "tries">): Promise<void> {
  const d = await db();
  await d.put(STORE, { ...op, createdAt: Date.now(), tries: 0 });
}

export async function allOps(): Promise<OutboxOp[]> {
  const d = await db();
  const ops = (await d.getAll(STORE)) as OutboxOp[];
  return ops.sort((a, b) => a.createdAt - b.createdAt);
}

export async function removeOp(id: string): Promise<void> {
  const d = await db();
  await d.delete(STORE, id);
}

export async function bumpTries(id: string): Promise<void> {
  const d = await db();
  const op = (await d.get(STORE, id)) as OutboxOp | undefined;
  if (op) await d.put(STORE, { ...op, tries: op.tries + 1 });
}

export async function pendingCount(): Promise<number> {
  const d = await db();
  return d.count(STORE);
}

/**
 * Compress an image client-side (canvas → JPEG, long edge ~1280px, ~<300KB)
 * so queued photos don't blow the IndexedDB quota.
 */
export async function compressImage(file: File, maxEdge = 1280, quality = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", quality);
  });
}
