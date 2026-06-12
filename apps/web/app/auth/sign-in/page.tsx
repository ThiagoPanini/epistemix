"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/app/_components/primitives";
import { signIn } from "@/lib/auth-client";

const HAS_GITHUB = process.env.NEXT_PUBLIC_GITHUB_OAUTH === "1";
const HAS_GOOGLE = process.env.NEXT_PUBLIC_GOOGLE_OAUTH === "1";
const HAS_SOCIAL = HAS_GITHUB || HAS_GOOGLE;

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [socialPending, setSocialPending] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await signIn.email({ email, password });
      if (result.error) {
        setError("E-mail ou senha incorretos.");
      } else {
        router.push("/");
      }
    } catch {
      setError("Erro ao entrar. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  async function handleSocial(provider: "github" | "google") {
    setSocialPending(provider);
    try {
      await signIn.social({
        provider,
        callbackURL: "/",
      });
    } catch {
      setError(`Erro ao entrar com ${provider}. Tente novamente.`);
      setSocialPending(null);
    }
  }

  return (
    <div className="auth-page wrap">
      <div className="auth-card">
        <Link href="/" className="auth-brand">
          epistemix
        </Link>
        <h1 className="auth-title">Entrar</h1>

        {HAS_SOCIAL && (
          <div className="auth-social">
            {HAS_GITHUB && (
              <button
                type="button"
                className="auth-social-btn"
                disabled={socialPending !== null || pending}
                onClick={() => handleSocial("github")}
              >
                <Icon name="github" size={15} />
                {socialPending === "github" ? "Redirecionando…" : "Entrar com GitHub"}
              </button>
            )}
            {HAS_GOOGLE && (
              <button
                type="button"
                className="auth-social-btn"
                disabled={socialPending !== null || pending}
                onClick={() => handleSocial("google")}
              >
                {socialPending === "google" ? "Redirecionando…" : "Entrar com Google"}
              </button>
            )}
            <div className="auth-divider">
              <span>ou</span>
            </div>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={pending || socialPending !== null}
          />
          <label className="auth-label" htmlFor="password">
            Senha
          </label>
          <input
            id="password"
            type="password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={pending || socialPending !== null}
          />
          {error && <p className="auth-error">{error}</p>}
          <button
            type="submit"
            className="auth-submit"
            disabled={pending || socialPending !== null}
          >
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
