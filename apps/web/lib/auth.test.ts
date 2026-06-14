import { describe, expect, it } from "vitest";
import { auth } from "./auth";

describe("auth config — SEC-1 role server-controlled", () => {
  it("role field has input: false (prevents client privilege escalation)", () => {
    const roleField = auth.options.user?.additionalFields?.role;
    expect(roleField).toBeDefined();
    expect(roleField?.input).toBe(false);
  });

  it("role field has defaultValue 'user'", () => {
    const roleField = auth.options.user?.additionalFields?.role;
    expect(roleField?.defaultValue).toBe("user");
  });

  it("username field has input: true (client-supplied)", () => {
    const usernameField = auth.options.user?.additionalFields?.username;
    expect(usernameField?.input).toBe(true);
  });
});
