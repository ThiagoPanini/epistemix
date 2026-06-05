/**
 * Conventional Commits — enforced no commit-msg hook (Lefthook).
 * Tipos e escopos alinhados ao ADR-0005.
 */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "chore", "docs", "refactor", "test"],
    ],
  },
};
