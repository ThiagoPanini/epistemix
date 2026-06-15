import { describe, expect, it } from "vitest";
import { SECURITY_HEADERS } from "./security-headers";

function header(key: string): string | undefined {
  return SECURITY_HEADERS.find((h) => h.key === key)?.value;
}

describe("SECURITY_HEADERS (SEC-2a)", () => {
  it("includes X-Content-Type-Options: nosniff", () => {
    expect(header("X-Content-Type-Options")).toBe("nosniff");
  });

  it("includes X-Frame-Options: DENY", () => {
    expect(header("X-Frame-Options")).toBe("DENY");
  });

  it("includes Referrer-Policy", () => {
    expect(header("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("includes HSTS", () => {
    const hsts = header("Strict-Transport-Security");
    expect(hsts).toMatch(/max-age=\d+/);
    expect(hsts).toContain("includeSubDomains");
  });

  it("includes Permissions-Policy", () => {
    expect(header("Permissions-Policy")).toBeDefined();
  });

  it("CSP: default-src 'self'", () => {
    expect(header("Content-Security-Policy")).toContain("default-src 'self'");
  });

  it("CSP: object-src 'none'", () => {
    expect(header("Content-Security-Policy")).toContain("object-src 'none'");
  });

  it("CSP: frame-ancestors 'none'", () => {
    expect(header("Content-Security-Policy")).toContain("frame-ancestors 'none'");
  });

  it("CSP: img-src allows https: for OAuth avatars", () => {
    const csp = header("Content-Security-Policy") ?? "";
    expect(csp).toMatch(/img-src[^;]*https:/);
  });

  it("CSP: script-src includes 'unsafe-inline' (SEC-2b debt)", () => {
    expect(header("Content-Security-Policy")).toContain("script-src 'self' 'unsafe-inline'");
  });
});
