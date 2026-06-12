"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";

type VoteState = { count: number; voted: boolean };

export function VoteButton({ artifactId }: { artifactId: string }) {
  const { data: session } = useSession();
  const isLoggedIn = session?.user != null;

  const [state, setState] = useState<VoteState>({ count: 0, voted: false });
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch(`/api/votes/${artifactId}`)
      .then((r) => r.json())
      .then((data: VoteState) => setState(data))
      .catch(() => {});
  }, [artifactId]);

  async function handleVote() {
    if (!isLoggedIn || pending) return;

    // Optimistic update
    const optimistic: VoteState = {
      count: state.voted ? state.count - 1 : state.count + 1,
      voted: !state.voted,
    };
    setState(optimistic);
    setPending(true);

    try {
      const res = await fetch(`/api/votes/${artifactId}`, { method: "POST" });
      if (res.ok) {
        const confirmed: VoteState = await res.json();
        setState(confirmed);
      } else {
        // Reconcile back on error
        setState(state);
      }
    } catch {
      setState(state);
    } finally {
      setPending(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <button type="button" className="up-btn up-btn--anon" disabled title="Entre para votar">
        ▲ {state.count}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`up-btn${state.voted ? " up-btn--active" : ""}`}
      onClick={handleVote}
      disabled={pending}
      aria-pressed={state.voted}
      aria-label={state.voted ? "Remover upvote" : "Upvote"}
    >
      ▲ {state.count}
    </button>
  );
}
