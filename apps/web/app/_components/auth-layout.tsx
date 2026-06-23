import Link from "next/link";

const MONTHS_PT = [
  "JANEIRO",
  "FEVEREIRO",
  "MARÇO",
  "ABRIL",
  "MAIO",
  "JUNHO",
  "JULHO",
  "AGOSTO",
  "SETEMBRO",
  "OUTUBRO",
  "NOVEMBRO",
  "DEZEMBRO",
];

function editionLabel(): string {
  const d = new Date();
  return `ED. — ${MONTHS_PT[d.getMonth()]} ${d.getFullYear()} · OPEN SOURCE`;
}

/**
 * Split editorial shell for the auth screens: a masthead "cover" aside on the
 * left (Prensa identity) and the form column on the right. Shared by sign-in
 * and sign-up so both pages stay visually identical.
 */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-page wrap">
      <div className="auth-split">
        <aside className="auth-aside">
          <Link href="/" className="auth-brand">
            ethitorial
          </Link>
          <div className="auth-rule" />
          <p className="auth-tagline">ESPAÇO PESSOAL DE APRENDIZADO E ESTUDO · THIAGO PANINI</p>
          <p className="auth-quote">
            Entre para votar, comentar e acompanhar o que está sendo publicado.
          </p>
          <p className="auth-edition">{editionLabel()}</p>
        </aside>
        <div className="auth-main">{children}</div>
      </div>
    </div>
  );
}
