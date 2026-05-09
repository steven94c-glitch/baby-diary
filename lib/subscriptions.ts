import webpush from "web-push";
import { put, list, del } from "@vercel/blob";

export type StoredSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  ts?: number;
};

const KEY = "subscriptions.json";

let configured = false;
function configure() {
  if (configured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

async function findBlob() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const { blobs } = await list({ prefix: KEY, limit: 1 });
    return blobs.find((b) => b.pathname === KEY) ?? null;
  } catch {
    return null;
  }
}

export async function readSubscriptions(): Promise<StoredSubscription[]> {
  const blob = await findBlob();
  if (!blob) return [];
  try {
    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as StoredSubscription[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeSubscriptions(subs: StoredSubscription[]) {
  const existing = await findBlob();
  if (existing) {
    try {
      await del(existing.url);
    } catch {}
  }
  await put(KEY, JSON.stringify(subs, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

export async function addSubscription(sub: StoredSubscription): Promise<void> {
  const subs = await readSubscriptions();
  if (subs.some((s) => s.endpoint === sub.endpoint)) return;
  subs.push({ ...sub, ts: Date.now() });
  await writeSubscriptions(subs);
}

export async function removeSubscription(endpoint: string): Promise<void> {
  const subs = await readSubscriptions();
  const next = subs.filter((s) => s.endpoint !== endpoint);
  if (next.length !== subs.length) await writeSubscriptions(next);
}

export async function sendPushToAll(payload: {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}): Promise<void> {
  if (!configure()) return;
  const subs = await readSubscriptions();
  if (subs.length === 0) return;
  const dead: string[] = [];
  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify(payload)
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) dead.push(sub.endpoint);
        else console.error("push error:", err);
      }
    })
  );
  if (dead.length > 0) {
    const next = subs.filter((s) => !dead.includes(s.endpoint));
    await writeSubscriptions(next);
  }
}
