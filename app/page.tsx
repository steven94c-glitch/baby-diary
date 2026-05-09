import { readEntries } from "@/lib/entries";

export const dynamic = "force-dynamic";

const babyName = process.env.BABY_NAME ?? "Baby";

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default async function Home() {
  const entries = await readEntries();

  const groups = new Map<string, typeof entries>();
  for (const e of entries) {
    const key = formatDate(e.ts);
    const arr = groups.get(key) ?? [];
    arr.push(e);
    groups.set(key, arr);
  }

  return (
    <main className="mx-auto max-w-2xl px-5 pb-24 pt-12">
      <header className="mb-12 text-center">
        <h1 className="text-4xl tracking-tight">{babyName}&apos;s Diary</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          A little corner of the internet just for {babyName.toLowerCase()}.
        </p>
      </header>

      {entries.length === 0 ? (
        <p className="mt-24 text-center" style={{ color: "var(--muted)" }}>
          No entries yet. Send a photo or note from the Telegram group to get started.
        </p>
      ) : (
        <div className="space-y-12">
          {Array.from(groups.entries()).map(([day, dayEntries]) => (
            <section key={day}>
              <h2 className="mb-4 text-sm uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                {day}
              </h2>
              <ul className="space-y-8">
                {dayEntries.map((e) => (
                  <li
                    key={e.id}
                    className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                    style={{ borderColor: "rgba(0,0,0,0.06)" }}
                  >
                    {e.media.length > 0 && (
                      <div className={e.media.length > 1 ? "grid grid-cols-2 gap-px" : ""}>
                        {e.media.map((m, i) =>
                          m.kind === "video" ? (
                            <video
                              key={i}
                              src={m.url}
                              controls
                              playsInline
                              className="w-full bg-black"
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={i}
                              src={m.url}
                              alt=""
                              loading="lazy"
                              className="w-full object-cover"
                            />
                          )
                        )}
                      </div>
                    )}
                    {(e.text || e.author) && (
                      <div className="px-5 py-4">
                        {e.text && <p className="whitespace-pre-wrap leading-relaxed">{e.text}</p>}
                        <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
                          {e.author ? `${e.author} · ` : ""}
                          {formatTime(e.ts)}
                        </p>
                      </div>
                    )}
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
