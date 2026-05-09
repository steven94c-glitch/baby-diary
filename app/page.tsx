import { readEntries, type Entry } from "@/lib/entries";

export const dynamic = "force-dynamic";

const babyName = process.env.BABY_NAME ?? "Baby";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function tiltFor(id: string): number {
  // -3 to +3 degrees, deterministic
  return (hash(id) % 7) - 3;
}

function noteVariantFor(id: string): "sticky" | "notepad" | "notecard" {
  const variants = ["sticky", "notepad", "notecard"] as const;
  return variants[hash(id) % variants.length];
}

function PolaroidEntry({ e }: { e: Entry }) {
  const tilt = tiltFor(e.id);
  return (
    <div
      className="polaroid mx-auto w-full max-w-md"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div className="polaroid-photo">
        {e.media.map((m, i) =>
          m.kind === "video" ? (
            <video key={i} src={m.url} controls playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={m.url} alt="" loading="lazy" />
          )
        )}
      </div>
      {e.text ? (
        <div className="polaroid-caption">{e.text}</div>
      ) : (
        <div style={{ height: 18 }} />
      )}
      <div className="polaroid-meta">
        {e.author ? `${e.author} · ` : ""}
        {formatTime(e.ts)}
      </div>
    </div>
  );
}

function NoteEntry({ e }: { e: Entry }) {
  const tilt = tiltFor(e.id);
  const variant = noteVariantFor(e.id);
  return (
    <div
      className={`mx-auto w-full max-w-sm ${variant}`}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div className="whitespace-pre-wrap">{e.text}</div>
      <span className="note-meta">
        {e.author ? `— ${e.author}, ` : "— "}
        {formatTime(e.ts)}
      </span>
    </div>
  );
}

export default async function Home() {
  const entries = await readEntries();

  const groups = new Map<string, Entry[]>();
  for (const e of entries) {
    const key = formatDate(e.ts);
    const arr = groups.get(key) ?? [];
    arr.push(e);
    groups.set(key, arr);
  }

  return (
    <main className="mx-auto max-w-2xl px-8 pb-32 pt-20 sm:px-10 sm:pt-24">
      <header className="mb-14 text-center">
        <h1
          className="font-block uppercase leading-[0.95] text-5xl sm:text-7xl"
          style={{ color: "var(--ink)" }}
        >
          {babyName}
        </h1>
        <p
          className="mt-4 font-hand text-xl"
          style={{ color: "var(--cornstalk-deep)" }}
        >
          a little diary
        </p>
      </header>

      {entries.length === 0 ? (
        <p className="mt-24 text-center font-hand text-xl" style={{ color: "var(--muted)" }}>
          No entries yet — send a photo or note from the Telegram group.
        </p>
      ) : (
        <div className="space-y-16">
          {Array.from(groups.entries()).map(([day, dayEntries]) => (
            <section key={day}>
              <h2 className="day-heading mb-8">{day}</h2>
              <ul className="space-y-12">
                {dayEntries.map((e) => (
                  <li key={e.id}>
                    {e.media.length > 0 ? <PolaroidEntry e={e} /> : <NoteEntry e={e} />}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
