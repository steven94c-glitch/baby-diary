import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { appendEntry, type Entry, type Media } from "@/lib/entries";
import { downloadFile, sendMessage, type TgMessage, type TgUpdate } from "@/lib/telegram";

export const runtime = "nodejs";
export const maxDuration = 60;

function allowedUserIds(): Set<number> {
  return new Set(
    (process.env.TELEGRAM_ALLOWED_USER_IDS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n))
  );
}

function allowedChatId(): number | null {
  const v = process.env.TELEGRAM_ALLOWED_CHAT_ID;
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function handleMessage(msg: TgMessage): Promise<void> {
  const chatOk = allowedChatId();
  if (chatOk !== null && msg.chat.id !== chatOk) return;

  const allowed = allowedUserIds();
  if (allowed.size > 0 && (!msg.from || !allowed.has(msg.from.id))) {
    await sendMessage(msg.chat.id, "Sorry — you're not on the post list for this diary.", msg.message_id);
    return;
  }

  const text = (msg.caption ?? msg.text ?? "").trim();
  const media: Media[] = [];

  if (msg.photo && msg.photo.length > 0) {
    const largest = msg.photo.reduce((a, b) => (a.width * a.height >= b.width * b.height ? a : b));
    const { buffer, contentType, ext } = await downloadFile(largest.file_id);
    const blob = await put(`media/${msg.date}-${largest.file_id}.${ext}`, Buffer.from(buffer), {
      access: "public",
      contentType,
      addRandomSuffix: true,
    });
    media.push({ url: blob.url, kind: "photo", width: largest.width, height: largest.height });
  }

  if (msg.video) {
    const { buffer, contentType, ext } = await downloadFile(msg.video.file_id);
    const blob = await put(`media/${msg.date}-${msg.video.file_id}.${ext}`, Buffer.from(buffer), {
      access: "public",
      contentType,
      addRandomSuffix: true,
    });
    media.push({ url: blob.url, kind: "video", width: msg.video.width, height: msg.video.height });
  }

  if (media.length === 0 && !text) return;

  const entry: Entry = {
    id: `${msg.chat.id}-${msg.message_id}`,
    ts: msg.date * 1000,
    author: msg.from?.first_name ?? msg.from?.username,
    text,
    media,
  };

  await appendEntry(entry);
  await sendMessage(msg.chat.id, "Saved ✓", msg.message_id);
}

export async function POST(req: NextRequest) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expected) {
    const got = req.headers.get("x-telegram-bot-api-secret-token");
    if (got !== expected) return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: TgUpdate;
  try {
    update = (await req.json()) as TgUpdate;
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const msg = update.message ?? update.channel_post;
  if (!msg) return NextResponse.json({ ok: true });

  try {
    await handleMessage(msg);
  } catch (err) {
    console.error("telegram handler error:", err);
    try {
      await sendMessage(msg.chat.id, "Something went wrong saving that — try again?", msg.message_id);
    } catch {}
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, hint: "POST webhook only" });
}
