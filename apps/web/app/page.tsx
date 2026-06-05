const API_URL = process.env.EPISTEMIX_API_URL ?? "http://localhost:8000";

type Health = { status: string };

async function getApiHealth(): Promise<Health | null> {
  try {
    const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as Health;
  } catch {
    return null;
  }
}

export default async function Home() {
  const health = await getApiHealth();
  const ok = health?.status === "ok";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <h1 className="bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-5xl font-semibold tracking-tight text-transparent">
        epistemix
      </h1>
      <p className="max-w-md text-center text-neutral-400">
        Hub pessoal de aprendizado. Fase 0 — esqueleto no ar.
      </p>
      <div className="flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/60 px-4 py-2 text-sm">
        <span
          className={`inline-block h-2 w-2 rounded-full ${ok ? "bg-emerald-400" : "bg-red-400"}`}
          aria-hidden
        />
        <span className="text-neutral-300">
          API:{" "}
          <span className={ok ? "text-emerald-400" : "text-red-400"}>
            {ok ? "online" : "indisponível"}
          </span>
        </span>
      </div>
    </main>
  );
}
