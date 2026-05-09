import { redirect } from "next/navigation";
import { cookies } from "next/headers";

const babyName = process.env.BABY_NAME ?? "Baby";

async function submit(formData: FormData) {
  "use server";
  const entered = String(formData.get("password") ?? "");
  const expected = process.env.SITE_PASSWORD ?? "";
  if (expected && entered === expected) {
    const jar = await cookies();
    jar.set("diary_auth", expected, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    redirect("/");
  }
  redirect("/login?error=1");
}

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="text-3xl">{babyName}&apos;s Diary</h1>
      <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
        Enter the family password to view.
      </p>
      <form action={submit} className="mt-8 space-y-3">
        <input
          name="password"
          type="password"
          autoFocus
          className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
          style={{ borderColor: "rgba(0,0,0,0.15)" }}
        />
        <button
          type="submit"
          className="w-full rounded-lg px-3 py-2 text-white"
          style={{ background: "var(--accent)" }}
        >
          Enter
        </button>
        {error && <p className="text-sm text-red-600">Incorrect password.</p>}
      </form>
    </main>
  );
}
