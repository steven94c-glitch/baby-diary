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

export async function appendEntry(entry: Entry): Promise<void> {
  const current = await readEntries();
  const next = [entry, ...current];
  const existing = await findEntriesBlob();
  if (existing) {
    try {
      await del(existing.url);
    } catch {}
  }
  await put(ENTRIES_KEY, JSON.stringify(next, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}
