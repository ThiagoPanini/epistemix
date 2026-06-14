// SEC-2a: security response headers applied to all Next.js routes.
// script-src/style-src keep 'unsafe-inline' as documented debt (SEC-2b):
//   - Next 15 injects inline hydration scripts (no nonce without custom server)
//   - shiki/rehype-pretty-code emits style= on code tokens
//   - 10+ components use style={{}} for dynamic values
export const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://github.com https://accounts.google.com",
      // unsafe-inline is SEC-2b debt — see comment above
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];
