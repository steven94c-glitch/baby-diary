import { put, list, del } from "@vercel/blob";

export type Media = {
  url: string;
  width?: number;
  height?: number;
  kind: "photo" | "video";
};

export type Entry = {
  id: string;
  ts: number;
  author?: string;
  text: string;
  media: Media[];
};

const ENTRIES_KEY = "entries.json";

async function findEntriesBlob() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const { blobs } = await list({ prefix: ENTRIES_KEY, limit: 1 });
    return blobs.find((b) => b.pathname === ENTRIES_KEY) ?? null;
  } catch {
    return null;
  }
}

export async function readEntries(): Promise<Entry[]> {
  const blob = await findEntriesBlob();
  if (!blob) return [];
  try {
    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as Entry[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeEntries(entries: Entry[]): Promise<void> {
  const existing = await findEntriesBlob();
  if (existing) {
    try {
      await del(existing.url);
    } catch {}
  }
  await put(ENTRIES_KEY, JSON.stringify(entries, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

export async function appendEntry(entry: Entry): Promise<void> {
  const current = await readEntries();
  await writeEntries([entry, ...current]);
}

export async function updateEntryText(id: string, text: string): Promise<boolean> {
  const current = await readEntries();
  const idx = current.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  current[idx] = { ...current[idx], text };
  await writeEntries(current);
  return true;
}

export async function deleteEntry(id: string): Promise<boolean> {
  const current = await readEntries();
  const target = current.find((e) => e.id === id);
  if (!target) return false;
  for (const m of target.media) {
    try {
      await del(m.url);
    } catch {}
  }
  await writeEntries(current.filter((e) => e.id !== id));
  return true;
}
